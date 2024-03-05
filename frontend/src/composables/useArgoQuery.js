import { ref, reactive, toRefs, onUnmounted, watch, unref } from 'vue'
import { db } from "~/services/dexieServices";
import { liveQuery } from "dexie";
//import { useSubscription } from '@vueuse/rxjs'
import { defer, of, from, combineLatest, tap, forkJoin, catchError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators'
import { JSONPath } from "jsonpath-plus"

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
        else if (value === "$fk") {
          if (!contextObj.key) throw new Error('key not found in contextObj')
          retObj[key] = contextObj.key;
        }
        else retObj[key] = value
      }
      return retObj
    }

    const collectSubclasses = async (classId) => {

      const subClasses = async classId => {
        let subClassesArr = await db.state.where({ 'superClassId': classId }).toArray()

        let promisses = []
        subClassesArr.forEach(subClass => {
          promisses.push(subClasses(subClass.key))
        })
        let arrayOfResultArrays = await Promise.all(promisses)

        let results = []
        results = results.concat(subClassesArr, arrayOfResultArrays.flat())
        return results
      }

      const rootClass = await db.state.get(classId)
      if (rootClass.classId) throw new Error('selector Subclasses must have a where clause that selects a class')

      let results = await subClasses(classId)
      results.splice(0, 0, rootClass)// Add the root class
      return results
    }

    const collectOwnedAccounts = async () => {

      const ownedAccounts = async accountId => {
        const allOrgUnitsCol = await db.state.where({ "classId": "dasprps1lrwf" })
        const ownedAccountsArr = await filterSortCollection(allOrgUnitsCol, {
          "filter": {
            "path": "$.permissions[?(@.perm_name == 'owner')].required_auth..accounts[*][?(@.permission == 'owner')].actor",
            "equals": accountId
          }
        })
        let promisses = []
        ownedAccountsArr.forEach(unitAccounr => {
          promisses.push(ownedAccounts(unitAccounr.key))
        })
        let arrayOfResultArrays = await Promise.all(promisses)

        const results = ownedAccountsArr.concat(arrayOfResultArrays.flat())
        return results
      }

      if (!contextObj.key) throw new Error('key not found in contextObj')

      const rootClass = await db.state.get(contextObj.key)
      let results = await ownedAccounts(contextObj.key)
      results.splice(0, 0, rootClass)// Add the root class
      return results
    }

    const filterSortCollection = (collection, queryObj) => {
      if (queryObj.filter) {
        // Replace $fk with something from the contect obj
        const resolvedEquals = resolve$Vars({ equals: queryObj.filter.equals }, contextObj)
        // Create the filter function
        const filterFunc = obj => JSONPath({ path: queryObj.filter.path, json: obj })[0] === resolvedEquals.equals;
        // Apply the filter
        collection = collection.filter(filterFunc)
      }

      if (queryObj.sortBy) return collection.sortBy(queryObj.sortBy)
      else return collection.toArray()
    }

    const sortArray = (array, sortBy) => {
      if (!sortBy) return array
      array.sort((a, b) => {
        return a[sortBy] < b[sortBy] ? -1 : 1;
      });
      return array;
    }

    // Get Icon from item anscestors, recursivly
    const getAnscestorsIcon = async (id) => {
      if (!id) return ''
      const classObj = await db.state.get(id);
      if (classObj.classIcon) return classObj.classIcon;
      return getAnscestorsIcon(classObj.superClassId);
    }


    const enrichItemsWithTreeVars = (items, queryObj, iconsArr) => {

      const enrichedResults = items.map((item, idx) => {
        let label = item.title ? item.title : item.name; //TODO value?
        let pageId = item.pageId ? item.pageId : queryObj.nodesPageId
        if (!pageId) {
          if (item.classId) pageId = "mb2bdqadowve";// class schema page
          else pageId = "24cnex2saye1"; // class details page
        }
        let isLeaf = true;
        if (queryObj.subQueryIds && queryObj.subQueryIds.length) {
          // If the query has subQueryIds, assume it may have children
          // TODO execute the queryObj.subQueryIds to see if we're dealing with a leaf node
          // i.e. get grandChildren
          isLeaf = false;
        }

        item.treeVars = {
          label: label,
          pageId: pageId,
          icon: iconsArr[idx], // pick icon from the array we found earlier
          isLeaf: isLeaf, // used by tree: expand/colapse arrow
          subQueryIds: queryObj.subQueryIds, // used by tree to get child nodes
          selector: queryObj.selector, // used by tree: onCtrlPaste, handelDrop etc
          where: queryObj.where,
          idsArrayPath: queryObj.idsArrayPath, // used by tree: onCtrlPaste, handelDrop etc

          nodesPageId: queryObj.nodesPageId,
          nodesIcon: queryObj.nodesIcon,
        }
        return item
      })


      // console.log('\nQuery Object: ', queryObj)
      // console.log('Context Object: ', contextObj)
      // console.log('Results', enrichedResults)
      return enrichedResults
    }

    const addTreeVars$ = (items, queryObj) => {
      // Collect observables of each icon into an array
      // We have to do icons separately because one case involves a promise
      const icons$Arr = items.map(item => {
        if (item.icon) return of(item.icon) // value as observable
        else if (queryObj.nodesIcon) return of(queryObj.nodesIcon)  // value as observable
        else if (item.classId) return from(getAnscestorsIcon(item.classId)) // promise as observable
        else return of('ClassIcon.svg')// // litteral as observable
      })

      // forkJoin the latest obsevables from the icons$Arr into a new observable array
      // Use forkJoin instead of combineLatest because we expect only one result from the promise
      return forkJoin(icons$Arr).pipe(
        // tap(val => console.log('collected icons',val)),
        // Now that we have the iconsArr we can continue to enrich items with treeVars
        map(iconsArr => enrichItemsWithTreeVars(items, queryObj, iconsArr))
      )

    }

    return queryObj$.pipe(switchMap(queryObj => {

      let slectorResult$ = null
      const resolvedWhere = resolve$Vars(queryObj.where, contextObj)

      // Determine selectorResult$ based on queryObj selector
      if (queryObj.selector === 'Context Object') {

        // return the contextObj as observable
        if (!contextObj) throw new Error('selector Context Object must have a contextObj')
        slectorResult$ = of(contextObj)

      } else if (queryObj.selector === 'Subclasses') {

        // collect all of the subclasses as seen from given classId
        if (!resolvedWhere.classId) throw new Error('selector Subclasses must have a where clause with a classId')
        slectorResult$ = from(collectSubclasses(resolvedWhere.classId).then(array => sortArray(array, queryObj.sortBy)))

      } else if (queryObj.selector === 'Owned Accounts') {

        // collect all of the owned accounts from given accountId
        if (!resolvedWhere.key) throw new Error('selector Owned Accounts must have a where clause with a key')
        slectorResult$ = from(collectOwnedAccounts(resolvedWhere.key).then(array => sortArray(array, queryObj.sortBy)))

      } else { // Where Clause

        // execute the where clause
        const queryRes$ = liveQuery(() => {
          const collection = db.state.where(resolvedWhere)
          return filterSortCollection(collection, queryObj)
        })
        slectorResult$ = from(queryRes$)

      }

      // If queryObj has an idsArrayPath apply the path to the result of the selector
      // above to obtain a array of ids. 
      // Execute the where clause to get an array for each of the ids in the ids array.
      // Otherwise ignore.
      const resultArr$ = slectorResult$.pipe(switchMap(items => {

        // If there is an idsArrayPath use it to get an array of ids
        if (queryObj.idsArrayPath) {


          // apply jsonPath to selector results to get an array of ids
          if (!queryObj.idsArrayPath.path || !queryObj.idsArrayPath.indexName) throw new Error('Ids Array Path must have a idsArrayPath and indexName')
          const idsArr = JSONPath({ path: queryObj.idsArrayPath.path, json: items });


          // validate the result (must be an array of ids)
          if (!Array.isArray(idsArr) && !typeof idsArr === 'string') throw new Error('The result of idsArrayPath must be an array or a string' + idsArr)
          if (Array.isArray(idsArr)) {
            const invalidFound = idsArr.find(item => !typeof item === 'string' || item.length !== 12)
            if (invalidFound) throw new Error('The result of idsArrayPath must be an array of _ids' + idsArr)
          }
          if (typeof idsArr === 'string' && item.length !== 12) throw new Error('The result of idsArrayPath must be an key' + idsArr)

          // Make sure the ids array is unique
          const uniqueIdsArr = [...new Set(idsArr)]


          // get all the objects corresponding to the ids array
          // We must perserve the order so we cant use anyOf
          const queryRes$Arr = uniqueIdsArr.map(id => {
            const whereClause = {}
            whereClause[queryObj.idsArrayPath.indexName] = id
            return liveQuery(() => db.state.where(whereClause).toArray())
          })

          if (items[0] === '5ucwmdby4wox') {
            console.log('TRACE PATH')
            console.log(items)
            console.log(queryRes)
            debugger
          }


          // Concatenate all of the observable arrays into a single observable array
          return combineLatest(queryRes$Arr).pipe(
            map(res => [].concat(...res))
          )
        }
        else return of(items) // no idsArrayPath, return the original value

      }))

      return resultArr$.pipe(switchMap(items => {
        // If there are no items we must return immediately
        if (!items.length) return of([])
        // Add treeVars to the items for the benefit of trees, tables, menus and selects.
        // We have to do this here, because in the case where idsArrayOrObj is an array 
        // of queryIds, this is the last place where we know which query is responsible
        // for the query result. Each query might want to have a different icon associated with it.
        return addTreeVars$(items, queryObj)
      }))
    }))
  }



  const executeDependingOnQueryType = () => {

    // Fail gracefully. Return empty array if there is no query (yet) 
    if (!idsArrayOrObj) return of([])

    // Recieved a string: query obj id
    else if (typeof idsArrayOrObj === 'string') {
      const queryObj$ = from(db.state.get(idsArrayOrObj)) // promise to observable
      return executeQuery(queryObj$)
    }

    // Recieved an array of strings: query obj ids
    else if (Array.isArray(idsArrayOrObj)) {

      // For each queryId, collect their observables in an array 
      const queryObj$Arr = idsArrayOrObj.map(queryId => {
        const queryObj$ = from(db.state.get(queryId)) // promise to observable
        return executeQuery(queryObj$)
      })

      // For each of the observable arrays in queryObj$Arr, 
      // concat their latest values into a new observable array 
      return combineLatest(queryObj$Arr).pipe(
        //tap(val => {console.log('combineLatest query results',val)}),
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

  watch(deps, (changedDeps) => {
    //console.log('deps changed', changedDeps)
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
