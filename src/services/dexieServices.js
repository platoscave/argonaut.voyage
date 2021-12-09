// db.js
import Dexie from 'dexie';
import { liveQuery } from "dexie";
import { map } from 'rxjs/operators';
import * as Rx from "rxjs";

export const db = new Dexie('argonautdb');
db.version(1).stores({
  state: '_id, classId, superClassId, ownerId', // Primary key and indexed props
  settings: 'pageId'
});



export class argoQuery {


  // nodeData is used to resolve $ variables in queries
  static async executeQuery(queryObj /* queryObj or queryId */, nodeData = null) {

    // Get obj a property using dot notation
    const getDescendantProp = (desc, resolveObj) => {
      desc = desc.substring(1) // assume starts with a $
      var arr = desc.split(".");
      while (arr.length && (resolveObj = resolveObj[arr.shift()]));
      return resolveObj;
    };

    const resolveQueryVariables = (selector, resolveObj) => {
      // Replace variables in the selector
      for (var key in selector) {
        const value = selector[key]
        // This is a complex query. Recusive call on each of the items
        if (Array.isArray(value)) value.forEach(item => resolveQueryVariables(item, resolveObj))
        // This is a request for the value itself (not a path)
        else if (value === '$') selector[key] = resolveObj
        // Replace $fk with id from resolve obj
        else if (value === "$fk") selector[key] = resolveObj._id;
        // Apply dot notation using resolveObj
        else if (value.startsWith("$")) {
          selector[key] = getDescendantProp(value, resolveObj);
          // not found? force empty results (null would cause everything to be retreived)
          if (!selector[key]) selector[key] = 'xxx'
        }
      }
    }

    // Get / Execute the query
    const executeQuery = async (queryObj, resolveObj) => {

      // Clone the query
      let queryObjClone = JSON.parse(JSON.stringify(queryObj))
      // Resolve the $variables in the query
      resolveQueryVariables(queryObjClone.selector, resolveObj)
      //console.log(queryObjClone)

      // Execute the query
      return Rx.from(liveQuery(() => {

        const collection$ = db.state.where(queryObj.selector)
        if (queryObj.sort) return collection$.sortBy(queryObj.sort)
        else return collection$.toArray()

      })).pipe(map(data => {

        // Add some attributes to each item for the bennifit of Tree
        return data.map(item => {

          item.label = item.title ? item.title : item.name;

          if (queryObj.subQueryIds && queryObj.subQueryIds.length) {
            item.subQueryIds = queryObj.subQueryIds;
            // If the query has subQueryIds, assume it may have children
            //TODO execute the queryObj.subQueryIds to see if we're dealing with a leaf node (only for tree nodes)
            item.isLeaf = false;
          }
          else item.isLeaf = true;

          // TODO The wrong way arround: must test. this is a result of dexie not having selected attrs
          // If the item has an icon, use it. Otherwise use the query icon.
          if (!item.icon) item.icon = queryObj.icon;

          // If the item has a pageId, use it. Otherwise use the query pageId.
          if (!item.pageId) item.pageId = queryObj.pageId
          return item;

        })
      }))
    }


    const collectSubclasses = async (classId) => {

      const subClasses = async classId => {
        let subClassesArr = await db.state
          .where("superClassId")
          .equals(classId)
          .toArray()
        let promisses = []
        subClassesArr.docs.forEach(subClass => {
          promisses.push(subClasses(subClass._id))
        })
        let arrayOfResultArrays = await Promise.all(promisses)

        let results = []
        results = results.concat(subClassesArr.docs, arrayOfResultArrays.flat())
        return results
      }

      const rootClass = await db.state.get(classId)
      let results = await subClasses(classId)
      results.splice(0, 0, rootClass)
      return results

    }

    // START HERE
    // Get the queryObj
    if (typeof queryObj === 'string') queryObj = await db.state.get(queryObj)
    // In the case of a many to one query we interate over the many array
    // Execute the query for each of the items
    // use the item as basis for resolving query variables
    if (queryObj.manyToOneArrayProp) {

      if (!nodeData) throw 'manyToOneArrayProp query must have a nodeData'

      const manyIdsArr = getDescendantProp(queryObj.manyToOneArrayProp, nodeData)
      if (!manyIdsArr) return []
      let promiseArr = manyIdsArr.map((item) => {
        return executeQuery(queryObj, item)
      })
      const arrayOfResultArrays = await Promise.all(promiseArr)
      // TODO results may still have to be sorted
      return arrayOfResultArrays.flat()

    } else if (queryObj.extendTo === 'Instances') {

      if (!queryObj.selector.classId) throw 'extendTo Instances query must select a classId'

      const rootClassId = queryObj.selector.classId
      const subClasses = await collectSubclasses(rootClassId)

      let promiseArr = subClasses.map(classObj => {
        queryObj.selector.classId = classObj._id
        return executeQuery(queryObj, classObj)
      })
      const arrayOfResultArrays = await Promise.all(promiseArr)
      // TODO results may still have to be sorted
      return arrayOfResultArrays.flat()

    } else if (queryObj.extendTo === 'Properties') {

      // Do not use
      // Unfortunatly this doesn't work. We need the class being selected by the query.
      // This often involves nodeData to resolve query varialbles, which we don't have access to.

      const mergedAncestorProperties = await this.getMergedAncestorProperties("dlpwvptczyeb")

      let resArray = []
      for (let key in mergedAncestorProperties.properties) {
        resArray.push({ _id: key, label: key })
      }

      // TODO results may still have to be sorted
      return resArray

    } else {

      // Otherwise just execute the query. 
      return executeQuery(queryObj, nodeData)

    }
  }



  // Updates the target object with corresponding properties from the source object, recusivly
  // We write our own deepMerge (instead of using lodash) because we have to be able to reproduce it in C++, see below
  static deepMerge(targetObj, sourceObj) {

    Object.keys(sourceObj).forEach(propName => {

      const targetProp = targetObj[propName]
      const sourceProp = sourceObj[propName]
      // TODO test if the types are the same, else throw error ?
      if (targetProp) {
        if (Array.isArray(sourceProp)) {
          // TODO make unique?
          // TODO deepMerge objects?
          targetObj[propName] = targetProp.concat(sourceProp)
        }
        else if (typeof sourceProp === "object") {
          this.deepMerge(targetObj[propName], sourceObj[propName])
        }
        else targetObj[propName] = sourceProp
      }
      else targetObj[propName] = sourceProp

    })
  }

  // Merge class with all of its ancestors, recusivly
  static async getMergedAncestorProperties(_id) {

    const classObj = await db.state.get(_id)

    if (classObj.superClassId) {

      const parentClassObj = await this.getMergedAncestorProperties(classObj.superClassId)
      // Ovwewrite parentClassObj with this classObj and return the result
      this.deepMerge(parentClassObj, classObj)
      return parentClassObj

    }
    else return classObj

  }

  // Get the view, then get the merged ancestors of the basClassId it points to.
  // Finally merge the view with the merged ancestors
  static async getMaterializedView(viewId) {

    const smartMerge = (viewObj, classObj) => {

      if (viewObj.properties) {
        // The the order and presence of viewObj properties is leading
        Object.keys(viewObj.properties).forEach(propName => {
          const viewProp = viewObj.properties[propName]
          const classProp = classObj.properties[propName]
          // TODO test if the types are the same, else throw error ?
          if (classProp) {
            if (Array.isArray(viewProp)) {
              // TODO make unique?
              // TODO deepMerge objects?
              viewObj.properties[propName] = viewProp.concat(classProp)
            }
            else if (typeof viewProp === "object") {
              // TODO view may want to overwrite certain properties eg title
              this.deepMerge(viewObj.properties[propName], classObj.properties[propName])
            }
            else {
              // TODO view cannot make things longer or shorter, earlier or later than allowed by merged ancesters
              //viewObj.properties[propName] = classProp
            }
          }
        })
      }

      // TODO Make sure unique?
      if (viewObj.requrired && classObj.requrired) viewObj.required = viewObj.required.concat(classObj.requrired)
      else if (classObj.requrired) viewObj.required = classObj.requrired

      if (viewObj.definitions && classObj.definitions) this.deepMerge(viewObj.definitions, classObj.definitions)
      else if (classObj.definitions) viewObj.definitions = classObj.definitions
    }


    // START HERE
    // Get the view
    const viewObj = await db.state.get(viewId)

    if (!viewObj.baseClassId) return viewObj

    const mergedAncestorProperties = await this.getMergedAncestorProperties(viewObj.baseClassId)

    smartMerge(viewObj, mergedAncestorProperties)

    return viewObj
  }

}

/*  example of C++ merge: https://stackoverflow.com/questions/40013355/how-to-merge-two-json-file-using-rapidjson

void mergeObjects(rapidjson::Value &dstObject, rapidjson::Value &srcObject, rapidjson::Document::AllocatorType &allocator)
{
  for (auto srcIt = srcObject.MemberBegin(); srcIt != srcObject.MemberEnd(); ++srcIt)
  {
      auto dstIt = dstObject.FindMember(srcIt->name);
      if (dstIt != dstObject.MemberEnd())
      {
          assert(srcIt->value.GetType() == dstIt->value.GetType());
          if (srcIt->value.IsArray())
          {
              for (auto arrayIt = srcIt->value.Begin(); arrayIt != srcIt->value.End(); ++arrayIt)
              {
                  dstIt->value.PushBack(*arrayIt, allocator);
              }
          }
          else if (srcIt->value.IsObject())
          {
              mergeObjects(dstIt->value, srcIt->value, allocator);
          }
          else
          {
              dstIt->value = srcIt->value;
          }
      }
      else
      {
          dstObject.AddMember(srcIt->name, srcIt->value, allocator);
      }
  }
} */