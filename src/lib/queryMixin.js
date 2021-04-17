export default {
  methods: {

    async getTheData(nodeData, queryId) {

      // Get obj a property using dot noatation
      const getDescendantProp = (obj, desc) => {
        desc = desc.substring(1) // assume starts with a $
        var arr = desc.split(".");
        while (arr.length && (obj = obj[arr.shift()]));
        return obj;
      };

      const resolveQueryVariables = (obj, mongoQuery) => {

        // Clone the query
        let mongoQueryClone = JSON.parse(JSON.stringify(mongoQuery))

        // Replace variables in the mongoQuery
        let selector = mongoQueryClone.selector;
        for (var key in selector) {
          const value = selector[key];
          if (value === "$fk") selector[key] = obj._id;
          else if (value.startsWith("$")) {
            selector[key] = getDescendantProp(obj, value);
            // not found
            if (!selector[key]) return null
          }
        }
        return mongoQueryClone
      }

      // Get / Execute the query
      const executeQuery = async (obj, queryObj) => {
        // temp hack: https://github.com/pouchdb/pouchdb/issues/6399
        delete queryObj.mongoQuery.sort;

        const resolvedMongoQuery = resolveQueryVariables(obj, queryObj.mongoQuery)
        if(!resolvedMongoQuery) return []
        console.log(resolvedMongoQuery)

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
      const queryObj = await this.$pouch.get(queryId);

      // In the case of a many to one query we interate over the many array
      // Execute the query for each of the items
      // use the item as basis for resolving query variables
      if (queryObj.mongoQuery.manyToOneArrayProp) {
        const manyArr = nodeData[queryObj.mongoQuery.manyToOneArrayProp]
        let promiseArr = manyArr.map((item) => {
          return executeQuery(item, queryObj)
        })
        const arrayOfResultArrays = await Promise.all(promiseArr)
        return arrayOfResultArrays.flat()

      } else {
        // Otherwise just execute the query. 
        // Use node.data as basis for resolving query varialbles
        return executeQuery(nodeData, queryObj)
      }
    },
  },
}

