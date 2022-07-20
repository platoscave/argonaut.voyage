import { ref, reactive, toRefs, onMounted, onUnmounted, watch } from 'vue'
import { db } from "~/services/dexieServices";
import { liveQuery } from "dexie";
//import { useSubscription } from '@vueuse/rxjs'
import { defer, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators'
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
return queryObj$
    const mapped =  queryObj$.pipe(switchMap(queryObj => {
      console.log('queryObj', queryObj)

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

        /* const mergedAncestorProperties = await this.getMergedAncestorProperties("dlpwvptczyeb")
        let resArray = []
        for (let key in mergedAncestorProperties.properties) {
          resArray.push({ _id: key, label: key })
        }
        return resArray */

      } else {

        // Otherwise just execute the query. 
        const resolvedWhere = resolve$Vars(queryObj.where, contextObj)

        return liveQuery(() => {
          const collection = db.state.where(resolvedWhere)
          return filterSortCollection(collection, queryObj)
        })
      }

    }))
    return mapped
  }



  const executeDependingOnQueryType = async () => {

    // recieved a string: query obj id
    if (typeof idsArrayOrObj === 'string') {
      const queryObj$ = of(db.state.get(idsArrayOrObj))
      return executeQuery(queryObj$)
    }

    // recieved an array of strings: query obj ids
    else if (typeof idsArrayOrObj === 'array') {
      const queryObjPromises = idsArrayOrObj.map(queryId => {
        const queryObj$ = from(db.state.get(queryId))
        return executeQuery(queryObj$)
      })
      //const queryObjArr = await Promise.all(queryObjPromises);
      console.log('queryObjArr',queryObjArr)
      debugger
      // Collect the observables
      // const obervablesArr = queryObjArr.map((queryObj) => {
      //   return argoQuery.executeQuery(queryObj);
      // });
      // console.log('obervablesArr',obervablesArr)

      //return obervablesArr.merge()
      //obervablesArr.switchMap(arr => Rx.Observable.combineLatest(Rx.Observable.of(res)))
      //return of(idsArrayOrObj)
    }

    // recieved a query obj
    else {
      // const queryObj$ = of(queryObj).pipe(switchMap(stingOrObj => {
      //   if (typeof stingOrObj === 'string') return from(db.state.get(stingOrObj))
      //   else return of(stingOrObj)
      // }))
      const obs = of(idsArrayOrObj)
      return executeQuery(obs)
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

  // watch(deps, () => {
  //     subscription.unsubscribe();
  //     subscription = observable.subscribe({
  //         next: (val) => {
  //             value.value = val;
  //         },
  //         error: options?.onError,
  //     });
  // });

  onUnmounted(() => {
      subscription.unsubscribe();
  });
  return value
}


/*
  // contextObj is used to resolve $ variables in queries
  static executeQuery(queryObj, contextObj = null) {

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

    // START HERE

    // Get the queryObj. Api allows passing queryId as opposed to queryObj
    // We have to capture the promise and turn it into an observable
    const queryObj$ = of(queryObj).pipe(switchMap(stingOrObj => {
      if (typeof stingOrObj === 'string') return from(db.state.get(stingOrObj))
      else return of(stingOrObj)
    }))

    return queryObj$.pipe(switchMap(queryObj => {

      if (queryObj.extendTo === 'Ids Array') {

        if (!queryObj.idsArrayPath || !queryObj.idsArrayPath.path || !queryObj.idsArrayPath.indexName) throw 'Ids Array query must have a idsArrayPath and indexName'
        if (!contextObj) throw 'Ids Array query must have a contextObj'

        // Obtain idObjectsArr from the context (the selectedObj)
        const idObjectsArr = jp.query(contextObj, queryObj.idsArrayPath.path)

        return liveQuery(() => {
          let collection$ = db.state.where(queryObj.idsArrayPath.indexName).anyOf(idObjectsArr)
          if (queryObj.filter) {
            const resolvedEquals = resolve$Vars({ equals: queryObj.filter.equals }, contextObj)
            const filterFunc = obj => jp.query(obj, queryObj.filter.path)[0] === resolvedEquals.equals
            collection$ = collection$.filter(filterFunc)
          } if (queryObj.sortBy) return collection$.sortBy(queryObj.sortBy)
          else return collection$.toArray()
        })

      } else if (queryObj.extendTo === 'Instances') {

        if (!queryObj.where.classId) throw 'extendTo Instances query must select a classId'

        return collectSubclasses$(queryObj.where.classId).pipe(
          switchMap(subClassesArr => {
            const subClasseIdsArr = subClassesArr.map(classObj => classObj._id)

            return liveQuery(() => {
              let collection$ = db.state.where('classId').anyOf(subClasseIdsArr)
              if (queryObj.filter) {
                const resolvedEquals = resolve$Vars({ equals: queryObj.filter.equals }, contextObj)
                const filterFunc = obj => jp.query(obj, queryObj.filter.path)[0] === resolvedEquals.equals
                collection$ = collection$.filter(filterFunc)
              } if (queryObj.sortBy) return collection$.sortBy(queryObj.sortBy)
              else return collection$.toArray()
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

        /* const mergedAncestorProperties = await this.getMergedAncestorProperties("dlpwvptczyeb")
        let resArray = []
        for (let key in mergedAncestorProperties.properties) {
          resArray.push({ _id: key, label: key })
        }
        return resArray * /

      } else {

        // Otherwise just execute the query. 
        const resolvedWhere = resolve$Vars(queryObj.where, contextObj)

        return liveQuery(() => {
          let collection$ = db.state.where(resolvedWhere)
          if (queryObj.filter) {
            const resolvedEquals = resolve$Vars({ equals: queryObj.filter.equals }, contextObj)
            const filterFunc = obj => jp.query(obj, queryObj.filter.path)[0] === resolvedEquals.equals
            collection$ = collection$.filter(filterFunc)
          }
          if (queryObj.sortBy) return collection$.sortBy(queryObj.sortBy)
          else return collection$.toArray()
        })
      }

    }))
  }
*/
