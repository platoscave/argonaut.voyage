import { ref, reactive, toRefs, onUnmounted, watch } from 'vue'
import { db } from "~/services/dexieServices";
import { liveQuery } from "dexie";
//import { useSubscription } from '@vueuse/rxjs'
import { defer, of, from, combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators'
import jp from "jsonpath"

/* queryObj or queryId or queryIdsArr */
export default function useArgoQuery(idsArrayOrObj, contextObj = null, deps, options) {

  const executeQuery = (queryObj$) => {

    const resolve$Vars = (whereClause, contextObj) => {
      let retObj = {}
      // Replace variables in the whereClause
      for (var key in whereClause) {
        const value = whereClause[key]
        // This is a query on the contextObj
        if (value === '$') retObj[key] = contextObj
        // Replace $fk with id from contextObj
        else if (value === "$fk") retObj[key] = contextObj._id;
        else retObj[key] = value
      }
      return retObj
    }

    const collectSubclasses$ = (classId) => {

      // warp promise in defer to return an observable
      return defer(async () => {
        const subClasses = async classId => {
          let subClassesArr = await db.state.where({ 'superClassId': classId }).toArray()

          let promisses = []
          subClassesArr.forEach(subClass => {
            promisses.push(subClasses(subClass._id))
          })
          let arrayOfResultArrays = await Promise.all(promisses)

          let results = []
          results = results.concat(subClassesArr, arrayOfResultArrays.flat())
          return results
        }

        const rootClass = await db.state.get(classId)
        let results = await subClasses(classId)
        results.splice(0, 0, rootClass)// Add the root class
        return results
      })
    }

    const filterSortCollection = (collection, queryObj) => {
      if (queryObj.filter) {
        const resolvedEquals = resolve$Vars({ equals: queryObj.filter.equals }, contextObj)
        const filterFunc = obj => jp.query(obj, queryObj.filter.path)[0] === resolvedEquals.equals
        collection = collection.filter(filterFunc)
      }
      if (queryObj.sortBy) return collection.sortBy(queryObj.sortBy)
      else return collection.toArray()
    }

    return queryObj$.pipe(switchMap(queryObj => {

      //tap(queryObj => console.log(`BEFORE MAP: ${queryObj}`))

      if (queryObj.extendTo === 'Ids Array') {

        if (!queryObj.idsArrayPath || !queryObj.idsArrayPath.path || !queryObj.idsArrayPath.indexName) throw 'Ids Array query must have a idsArrayPath and indexName'
        if (!contextObj) throw 'Ids Array query must have a contextObj'

        // Obtain idObjectsArr from the context (the selectedObj)
        const idObjectsArr = jp.query(contextObj, queryObj.idsArrayPath.path)

        return liveQuery(() => {
          let collection = db.state.where(queryObj.idsArrayPath.indexName).anyOf(idObjectsArr)
          return filterSortCollection(collection, queryObj)
        })

      } else if (queryObj.extendTo === 'Instances') {

        if (!queryObj.where.classId) throw 'extendTo Instances query must select a classId'

        return collectSubclasses$(queryObj.where.classId).pipe(
          switchMap(subClassesArr => {
            const subClasseIdsArr = subClassesArr.map(classObj => classObj._id)

            return liveQuery(() => {
              let collection = db.state.where('classId').anyOf(subClasseIdsArr)
              return filterSortCollection(collection, queryObj)
            })
          })
        )
      } else if (queryObj.extendTo === 'Subclasses') {

        if (!queryObj.where.classId) throw 'extendTo Subclasses query must select a classId'

        return collectSubclasses$(queryObj.where.classId)

      } else if (queryObj.extendTo === 'Properties') {

        // Do not use
        // Unfortunatly this doesn't work. We need the class being selected by the query.
        // This often involves contextObj to resolve query varialbles, which we don't have access to.

        /* const mergedAncestorProperties = await this.getClassSchema("dlpwvptczyeb")
        let resArray = []
        for (let key in mergedAncestorProperties.properties) {
          resArray.push({ _id: key, label: key })
        }
        return resArray */

      } else {

        // Otherwise just execute the query. 
        const resolvedWhere = resolve$Vars(queryObj.where, contextObj)

        const queryRes$ = liveQuery(() => {
          const collection = db.state.where(resolvedWhere)
          return filterSortCollection(collection, queryObj)
        })

        // queryRes$ does not have .pipe. Not sure why. It's an observable after all
        // Wrapping queryRes$ in from() does the trick
        return from(queryRes$).pipe(map(items => {
          // We add queryObj to the items for the benefit of trees. This must not be saved!
          return items.map(item => {
            item.queryObj = queryObj
            return item
          })
        }))
      }

    }))
  }



  const executeDependingOnQueryType = () => {

    // Recieved a string: query obj id
    if (typeof idsArrayOrObj === 'string') {
      const queryObj$ = from(db.state.get(idsArrayOrObj)) // promise to observable
      return executeQuery(queryObj$)
    }

    // Recieved an array of strings: query obj ids
    else if (Array.isArray(idsArrayOrObj)) {
      // For each queryId, collect their promises observables in an array 
      const queryObj$Arr = idsArrayOrObj.map(queryId => {
        const queryObj$ = from(db.state.get(queryId)) // promise to observable
        return executeQuery(queryObj$)
      })
      // For each of the observable arrays in queryObj$Arr, 
      // concat their latest values into a new array 
      return combineLatest(queryObj$Arr).pipe(
        map(res => [].concat(...res))
      )
    }

    // Recieved a query obj
    else {
      const queryObj$ = of(idsArrayOrObj) // object to observable
      return executeQuery(queryObj$)
    }
  }

  // START HERE
  const value = ref();
  //console.log('querier',querier, deps)
  const observable = executeDependingOnQueryType();
  let subscription = observable.subscribe({
    next: (val) => {
      value.value = val;
    },
    error: options?.onError,
  });

  watch(deps, () => {
    subscription.unsubscribe();
    subscription = observable.subscribe({
      next: (val) => {
        value.value = val;
      },
      error: options?.onError,
    });
  });

  // TODO find a solution
  // onUnmounted(() => {
  //     subscription.unsubscribe();
  // });
  return value
}
