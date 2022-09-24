import { db } from "~/services/dexieServices";
import jp from "jsonpath"

/* queryObj or queryId or queryIdsArr */
export default function argoQueryPromise(idsArrayOrObj, contextObj = null) {

  const executeQuery = async (queryObj) => {

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
        const filterFunc = obj => jp.query(obj, queryObj.filter.path)[0] === resolvedEquals.equals
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
      if(!id) return ''
      const classObj = await db.state.get(id);
      if (classObj.classIcon) return classObj.classIcon;
      return getAnscestorsIcon(classObj.superClassId);
    }


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

    const addTreeVars = async (items, queryObj) => {

      // Collect promise of each icon into an array
      // We have to do icons separately because one case involves a promise
      const iconsPromissesArr = items.map(item => {
        if(item.icon) return Promise.resolve(item.icon) // value as promise
        else if(queryObj.nodesIcon) return Promise.resolve(queryObj.nodesIcon) // value as promise
        else if(item.classId) return getAnscestorsIcon(item.classId) // promise
        else return Promise.resolve('ClassIcon.svg') // litteral as promise
      })

      const iconsArr = await Promise.all(iconsPromissesArr)
      // Now that we have the iconsArr we can continue to enrich items with treeVars
      return enrichItemsWithTreeVars(items, queryObj, iconsArr)

    }

    let slectorResult = null
    const resolvedWhere = resolve$Vars(queryObj.where, contextObj)

    // Determine slectorResult based on queryObj selector
    if (queryObj.selector === 'Context Object') {

      // return the contextObj as observable
      if (!contextObj) throw new Error('selector Context Object must have a contextObj')
      slectorResult = contextObj

    } else if (queryObj.selector === 'Subclasses') {

      // collect all of the subclasses as seen from given classId
      if (!resolvedWhere.classId) throw new Error('selector Subclasses must have a where clause with a classId')
      slectorResult = await collectSubclasses(resolvedWhere.classId).then(array => sortArray(array, queryObj.sortBy))

    } else if (queryObj.selector === 'Owned Accounts') {

      // collect all of the owned accounts from given accountId
      if (!resolvedWhere._id) throw new Error('selector Owned Accounts must have a where clause with a _id')
      slectorResult = await collectOwnedAccounts(resolvedWhere._id).then(array => sortArray(array, queryObj.sortBy))

    } else { // Where Clause

      // execute the where clause
      const collection = db.state.where(resolvedWhere)
      slectorResult = await filterSortCollection(collection, queryObj)

    }

    // If queryObj has an idsArrayPath apply the path to the result of the selector
    // above to obtain a array of ids. Get each of the objects in the ids array.
    // Otherwise ignore.
    let resultArr = null
    if (queryObj.idsArrayPath) {

      // apply jsonPath to selector results to get an array of ids
      if (!queryObj.idsArrayPath.path || !queryObj.idsArrayPath.indexName) throw new Error('Ids Array Path must have a idsArrayPath and indexName')
      const idsArr = jp.query(slectorResult, queryObj.idsArrayPath.path)

      // validate the result
      if (!Array.isArray(idsArr) && !typeof idsArr === 'string') throw new Error('The result of idsArrayPath must be an array or a string' + idsArr)
      if (Array.isArray(idsArr)) {
        const invalidFound = idsArr.find(item => !typeof item === 'string' || item.length !== 12)
        if (invalidFound) throw new Error('The result of idsArrayPath must be an array of _ids' + idsArr)
      }
      if (typeof idsArr === 'string' && item.length !== 12) throw new Error('The result of idsArrayPath must be an _id' + idsArr)

      // Make the ids array unique
      const uniqueIdsArr = [...new Set(idsArr)]

      // get all the objects corresponding to the ids array
      // We must perserve the order so we cant use any of
      const promisesArr = uniqueIdsArr.map( id => {
        const whereClause = {}
        whereClause[queryObj.idsArrayPath.indexName] = id
        return db.state.where( whereClause ).toArray()
      })
      const resultArrArr = await Promise.all(promisesArr)
      resultArr = resultArrArr.flat()
    }
    else resultArr = slectorResult// return the original value



    // Add treeVars to the items for the benefit of trees and tables.
    // We have to do this here because in the case where idsArrayOrObj is an array 
    // of queryIds, this is the last place where we know wich query is responsible
    // for the query result.
    return addTreeVars(resultArr, queryObj)
  }



  const executeDependingOnQueryType = async () => {

    // Recieved a string: query obj id
    if (typeof idsArrayOrObj === 'string') {
      const queryObj = await db.state.get(idsArrayOrObj)
      return executeQuery(queryObj)
    }

    // Recieved an array of strings: query obj ids
    else if (Array.isArray(idsArrayOrObj)) {
      // For each queryId, collect queryObjs in an array 
      const queryObjsPromises = idsArrayOrObj.map(queryId => db.state.get(queryId))
      const queryObjsArr = await Promise.all(queryObjsPromises)

      // For each queryObj, collect results in an array 
      const resPromises = queryObjsArr.map(queryObj => executeQuery(queryObj))
      const resArr = await Promise.all(resPromises)

      return resArr.flat()
    }

    // Recieved a query obj
    return executeQuery(idsArrayOrObj)
  }

  // START HERE
  return executeDependingOnQueryType();
}
