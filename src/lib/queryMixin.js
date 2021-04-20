export default {
  methods: {

    // nodeData is used to resolve $ variables in queries
    async getTheData(queryId, nodeData = {}) {

      // Get obj a property using dot noatation
      const getDescendantProp = (desc, resolveObj) => {
        desc = desc.substring(1) // assume starts with a $
        var arr = desc.split(".");
        while (arr.length && (resolveObj = resolveObj[arr.shift()]));
        return resolveObj;
      };

      const resolveQueryVariables = (mongoQuery, resolveObj) => {

        // Clone the query
        let mongoQueryClone = JSON.parse(JSON.stringify(mongoQuery))

        // Replace variables in the mongoQuery
        let selector = mongoQueryClone.selector;
        for (var key in selector) {
          const value = selector[key];
          if (value === "$fk") selector[key] = resolveObj._id;
          else if (value.startsWith("$")) {
            selector[key] = getDescendantProp(value, resolveObj);
            if (!selector[key]) return null // not found
          }
        }
        return mongoQueryClone
      }

      // Get / Execute the query
      const executeQuery = async (queryObj, resolveObj) => {
        // temp hack: https://github.com/pouchdb/pouchdb/issues/6399
        delete queryObj.mongoQuery.sort;

        const resolvedMongoQuery = resolveQueryVariables(queryObj.mongoQuery, resolveObj)
        if (!resolvedMongoQuery) return [] // invalid query, ignore

        // Execute the mongoQuery
        const results = await this.$pouch.find(resolvedMongoQuery)

        return results.docs.map((item) => {
          item.label = item.title ? item.title : item.name;
          if (queryObj.subQueryIds) {
            item.subQueryIds = queryObj.subQueryIds;
            // If the query has subQueryIds, assume it may have children
            //TODO execute the queryObj.subQueryIds to see if we're dealing with a leaf node
            item.isLeaf = false;
          }
          // If the query retreives an icon, use it. Otherwise use the query icon.
          // TODO if the query reteives an empty icon, ask the object anscestors for an icon
          if (!item.icon) item.icon = queryObj.icon;
          // If the query retreives a pageId, use it. Otherwise use the query pageId.
          if (!item.pageId) item.pageId = queryObj.pageId;
          return item;
        })
      }



      // Get the queryObj
      const queryObj = await this.$pouch.get(queryId)

      // In the case of a many to one query we interate over the many array
      // Execute the query for each of the items
      // use the item as basis for resolving query variables
      if (queryObj.mongoQuery.manyToOneArrayProp) {
        const manyArr = nodeData[queryObj.mongoQuery.manyToOneArrayProp]
        let promiseArr = manyArr.map((item) => {
          return executeQuery(queryObj, item)
        })
        const arrayOfResultArrays = await Promise.all(promiseArr)
        return arrayOfResultArrays.flat()

      } else {
        // Otherwise just execute the query. 
        // Use node.data as basis for resolving query varialbles
        return executeQuery(queryObj, nodeData)
      }
    },



    // Updates the target object with corresponding properties from the source object
    // We write our own deepMerge (instead of using lodash) because we have to be able to reproduce it in C++, see below
    deepMerge(targetObj, sourceObj) {

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
    },

    // Merge class with all of its ancestors, recusivly
    async getMergedAncestorProperties(_id) {

      const classObj = await this.$pouch.get(_id)

      if (classObj.parentId) {

        const parentClassObj = await this.getMergedAncestorProperties(classObj.parentId)
        // Ovwewrite parentClassObj with this classObj and return the result
        this.deepMerge( parentClassObj, classObj)
        return parentClassObj

      }
      else return classObj

    },

    async getMaterializedView(viewId) {

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
                // TODO view cannot make things longer or shorter
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



      // Get the view
      const viewObj = await this.$pouch.get(viewId)

      if (!viewObj.baseClassId) return viewObj

      const mergedAncestorProperties = await this.getMergedAncestorProperties(viewObj.baseClassId)

      smartMerge(viewObj, mergedAncestorProperties)

      return mergedAncestorProperties
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
}

