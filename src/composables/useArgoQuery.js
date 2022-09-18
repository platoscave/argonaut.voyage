import { ref, reactive, toRefs, onUnmounted, watch, unref } from 'vue'
import { db } from "~/services/dexieServices";
import { liveQuery } from "dexie";
//import { useSubscription } from '@vueuse/rxjs'
import { defer, of, from, combineLatest, tap } from 'rxjs';
import { map, switchMap} from 'rxjs/operators'
import {JSONPath} from "jsonpath-plus"

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
          if (!contextObj._id) throw new Error('_id not found in contextObj')
          retObj[key] = contextObj._id;
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
          promisses.push(subClasses(subClass._id))
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
          promisses.push(ownedAccounts(unitAccounr._id))
        })
        let arrayOfResultArrays = await Promise.all(promisses)

        const results = ownedAccountsArr.concat(arrayOfResultArrays.flat())
        return results
      }

      if (!contextObj._id) throw new Error('_id not found in contextObj')

      const rootClass = await db.state.get(contextObj._id)
      let results = await ownedAccounts(contextObj._id)
      results.splice(0, 0, rootClass)// Add the root class
      return results
    }

    const filterSortCollection = (collection, queryObj) => {
      if (queryObj.filter) {
        const resolvedEquals = resolve$Vars({ equals: queryObj.filter.equals }, contextObj)
        // TODO is the filter still being used?
        //const filterFunc = obj => jp.query(obj, queryObj.filter.path)[0] === resolvedEquals.equals
        //const filterFunc = JSONPath({path: queryObj.filter.path)[0] === resolvedEquals.equals, obj});
        //collection = collection.filter(filterFunc)
      }

      if (queryObj.sortBy) return collection.sortBy(queryObj.sortBy)
      else return collection.toArray()
    }

    const sortArray = (array, sortBy) => {
      if(!sortBy) return array
      array.sort((a, b) => {
        return a[sortBy] < b[sortBy] ? -1 : 1;
      });
      return array;
    }
/*
    // Get Icon from item anscestors, recursivly
    const getAnscestorsIcon = async (id) => {
      //console.log('id',id)
      if(!id) return ''
      const classObj = await db.state.get(id);
      if (classObj.classIcon) return classObj.classIcon;
      return getAnscestorsIcon(classObj.superClassId);
    }
*/
/*
    const enrichItemsWithTreeVars = (items, queryObj, iconsArr) => {
      const enrichedResults = items.map((item, idx) => {
        let label = item.title ? item.title : item.name; //TODO value?
        let pageId = item.pageId ? item.pageId : queryObj.nodesPageId
        if(!pageId) {
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
console.log(queryObj.subQueryIds)
        item.treeVars = {
          label: label,
          pageId: pageId,
          //icon: iconsArr[idx],
          iconName: null, // in future we will use the name instead of the actual icon
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



      return enrichedResults
      //return of(enrichedResults)
    }

    const addTreeVars$ = (items, queryObj) => {
      const icons$Arr = items.map(item => {
        //console.log(item)
        if(item.icon) return of(item.icon)
        else if(queryObj.icon) return of(queryObj.icon)
        //else return from(getAnscestorsIcon(item._id))
        return of('')
      })
      debugger
      return combineLatest(icons$Arr).pipe(
        //tap(val => console.log(val)),
        map(iconsArr => enrichItemsWithTreeVars(items, queryObj, iconsArr))
      )

    }
*/
    return queryObj$.pipe(switchMap(queryObj => {

      let slectorResult$ = null
      const resolvedWhere = resolve$Vars(queryObj.where, contextObj)

      // Determine slectorResult$ based on queryObj selector
      if (queryObj.selector === 'Context Object') {

        // return the contextObj as observable
        if (!contextObj) throw new Error('selector Context Object must have a contextObj')
        slectorResult$ = of(contextObj)

      } else if (queryObj.selector === 'Subclasses') {

        // collect all of the subclasses as seen from given classId
        if (!resolvedWhere.classId) throw new Error('selector Subclasses must have a where clause with a classId')
        slectorResult$ = from(collectSubclasses(resolvedWhere.classId).then( array => sortArray(array, queryObj.sortBy)))

      } else if (queryObj.selector === 'Owned Accounts') {

        // collect all of the owned accounts from given accountId
        if (!resolvedWhere._id) throw new Error('selector Owned Accounts must have a where clause with a _id')
        slectorResult$ = from(collectOwnedAccounts(resolvedWhere._id).then( array => sortArray(array, queryObj.sortBy)))

      } else { // Where Clause

        // execute the where clause
        const queryRes$ = liveQuery(() => {
          const collection = db.state.where(resolvedWhere)
          return filterSortCollection(collection, queryObj)
        })
        slectorResult$ = from(queryRes$)

      }

      // If queryObj has an idsArrayPath apply the path to the result of the selector
      // above to obtain a array of ids. Get each of the objects in the ids array.
      // Otherwise ignore.
      const resultArr$ = slectorResult$.pipe(switchMap(items => {

        //console.log('slectorResult', slectorResult$)
        if (queryObj.idsArrayPath) {

          // apply jsonPath to selector results to get an array of ids
          if (!queryObj.idsArrayPath.path || !queryObj.idsArrayPath.indexName) throw new Error('Ids Array Path must have a idsArrayPath and indexName')
          //const idsArr = jp.query(items, queryObj.idsArrayPath.path)
          const idsArr = JSONPath({path: queryObj.idsArrayPath.path, json: items});


          // validate the result
          if(!Array.isArray(idsArr) && !typeof idsArr === 'string') throw new Error('The result of idsArrayPath must be an array or a string' + idsArr)
          if(Array.isArray(idsArr)) {
            const invalidFound = idsArr.find( item => !typeof item === 'string' || item.length !== 12)
            if(invalidFound) throw new Error('The result of idsArrayPath must be an array of _ids' + idsArr)
          }
          if(typeof idsArr === 'string' && item.length !== 12) throw new Error('The result of idsArrayPath must be an _id' + idsArr)

          // Make the ids array is unique
          const uniqueIdsArr = [...new Set(idsArr)]


          // get all the objects corresponding to the ids array
          // We must perserve the order so we cant use anyOf
          const queryRes$Arr = uniqueIdsArr.map( id => {
            const whereClause = {}
            whereClause[queryObj.idsArrayPath.indexName] = id
            return liveQuery(() => db.state.where( whereClause ).toArray())
          })


          return combineLatest(queryRes$Arr).pipe(
            map(res => [].concat(...res))
          )
        }
        else return of(items) // return the original value

      }))


      // Add treeVars to the items for the benefit of trees and tables.
      // We have to do this here because in the case where idsArrayOrObj is an array 
      // of queryIds, this is the last place where we know wich query is responsible
      // for the query result.
      return resultArr$.pipe(map(items => {
        const results = items.map(item => {
          item.treeVars = {
            nodesPageId: queryObj.nodesPageId,
            nodesIcon: queryObj.nodesIcon,
            subQueryIds: queryObj.subQueryIds,
            selector: queryObj.selector,
            where: queryObj.where,
            idsArrayPath: queryObj.idsArrayPath,
          }
          return item
        })
        console.log('\nQuery Object: ', queryObj)
        console.log('Context Object: ', contextObj)
        console.log('Results', results)
        return results
      }))
      // return resultArr$.pipe(switchMap(items => {

      //   return addTreeVars$(items, queryObj)
      // }))
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
