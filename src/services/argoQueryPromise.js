import { db } from "~/services/dexieServices";
import jp from "jsonpath"

/* queryObj or queryId or queryIdsArr */
export default function argoQueryPromise(idsArrayOrObj, contextObj = null, deps, options) {

  const executeQuery = async (queryObj) => {

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

    const filterSortCollection = (collection, queryObj) => {
      if (queryObj.filter) {
        const resolvedEquals = resolve$Vars({ equals: queryObj.filter.equals }, contextObj)
        const filterFunc = obj => jp.query(obj, queryObj.filter.path)[0] === resolvedEquals.equals
        collection = collection.filter(filterFunc)
      }
      if (queryObj.sortBy) return collection.sortBy(queryObj.sortBy)
      else return collection.toArray()
    }



    if (queryObj.extendTo === 'Ids Array') {

      if (!queryObj.idsArrayPath || !queryObj.idsArrayPath.path || !queryObj.idsArrayPath.indexName) throw 'Ids Array query must have a idsArrayPath and indexName'
      if (!contextObj) throw 'Ids Array query must have a contextObj'

      // Obtain idObjectsArr from the context (the selectedObj)
      const idObjectsArr = jp.query(contextObj, queryObj.idsArrayPath.path)

      let collection = db.state.where(queryObj.idsArrayPath.indexName).anyOf(idObjectsArr)
      return filterSortCollection(collection, queryObj)

    } else if (queryObj.extendTo === 'Instances') {

      if (!queryObj.where.classId) throw 'extendTo Instances query must select a classId'

      const subClassesArr = await collectSubclasses(queryObj.where.classId)
      const subClasseIdsArr = subClassesArr.map(classObj => classObj._id)

      let collection = db.state.where('classId').anyOf(subClasseIdsArr)
      return filterSortCollection(collection, queryObj)
      
    } else if (queryObj.extendTo === 'Subclasses') {

      if (!queryObj.where.classId) throw 'extendTo Subclasses query must select a classId'

      return collectSubclasses(queryObj.where.classId)

    } else if (queryObj.extendTo === 'Properties') {

    } else {

      // Otherwise just execute the query. 
      const resolvedWhere = resolve$Vars(queryObj.where, contextObj)

      const collection = db.state.where(resolvedWhere)
      return filterSortCollection(collection, queryObj)
    }

    
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
    else return executeQuery(idsArrayOrObj)
  }

  // START HERE
  return executeDependingOnQueryType();
}
