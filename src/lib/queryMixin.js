export default {
  name: "ar-tree",
  components: {
    "ar-context-menu": ContextMenu,
  },
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      pageId: String,
      viewObj: Object,
      defaultProps: {
        isLeaf: "isLeaf",
      },
    };
  },
  pouch: {
    pageSettings: function () {
      return {
        database: "settings",
        selector: { _id: this.pageId },
        first: true,
      };
    },
  },
  methods: {
    handleDragStart(node, ev) {
      console.log("drag start", node);
    },
    handleDragEnter(draggingNode, dropNode, ev) {
      console.log("tree drag enter: ", dropNode.label);
    },
    handleDragLeave(draggingNode, dropNode, ev) {
      console.log("tree drag leave: ", dropNode.label);
    },
    handleDragOver(draggingNode, dropNode, ev) {
      console.log("tree drag over: ", dropNode.label);
    },
    handleDragEnd(draggingNode, dropNode, dropType, ev) {
      console.log("tree drag end: ", dropNode && dropNode.label, dropType);
    },
    handleDrop(draggingNode, dropNode, dropType, ev) {
      console.log("tree drop: ", dropNode.label, dropType);
    },
    allowDrop(draggingNode, dropNode, type) {
      if (dropNode.data.label === "Level two 3-1") {
        return type !== "inner";
      } else {
        return true;
      }
    },
    allowDrag(draggingNode) {
      return draggingNode.data.label.indexOf("Level three 3-1-1") === -1;
    },

    async loadNode(node, resolve) {


      // Get obj a property using dot noatation
      const getDescendantProp = (obj, desc) => {
        desc = desc.substring(1) // assume starts with a $
        var arr = desc.split(".");
        while (arr.length && (obj = obj[arr.shift()]));
        return obj;
      };

      const resolveQueryVariables = (obj, mongoQuery) => {
        let mongoQueryClone = JSON.parse(JSON.stringify(mongoQuery))
        // Replace variables in the mongoQuery
        let selector = mongoQueryClone.selector;
        for (var key in selector) {
          const value = selector[key];
          if (value === "$fk") selector[key] = obj._id;
          else if (value.startsWith("$"))
            selector[key] = getDescendantProp(obj, value);
          //if (!selector[key]) throw "Bad query " + value;
        }
        return mongoQueryClone
      }

      // Get / Execute the query
      const executeQuery = async (obj, queryObj) => {
        // temp hack: https://github.com/pouchdb/pouchdb/issues/6399
        delete queryObj.mongoQuery.sort; 

        const resolvedMongoQuery = resolveQueryVariables(obj, queryObj.mongoQuery)
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



      const getTheData = async (queryId) => {
        if (queryId == "ybjrgmdjybzl") debugger;
        // Get the queryObj
        let queryObj = await this.$pouch.get(queryId);

        // In the case of a many to one query we interate over the many array
        // Execute the query for each of the items
        // use the item as basis for resolving query variables
        if (queryObj.mongoQuery.manyToOneArrayProp) {
          const manyArr = node.data[queryObj.mongoQuery.manyToOneArrayProp]
          const filteredArr = manyArr.filter( item => {
            return item.stateId
          })
          let promiseArr = filteredArr.map((item) => {
            return executeQuery(item, queryObj)
          })
          const arrayOfResultArrays = await Promise.all(promiseArr)
          return arrayOfResultArrays.flat()

        } else {
          // Otherwise just execute the query. 
          // Use node.data as basis for resolving query varialbles
          return executeQuery(node.data, queryObj)
        }
      }

      try {
        // root level
        if (node.level === 0) {
          // Get the viewObj
          this.viewObj = await this.$pouch.get(this.viewId);
          // Execute the query
          let resArr = await getTheData(this.viewObj.queryId);
          resolve(resArr);
        }
        if (node.level > 0) {
          //TODO remove condition?
          if (node.data.subQueryIds) {
            let promiseArr = node.data.subQueryIds.map((queryId) => {
              return getTheData(queryId);
            });
            const resArr = await Promise.all(promiseArr);
            console.log(resArr.flat());
            resolve(resArr.flat());
          } else resolve([]);
        }
      } catch (err) {
        console.error(err);
        this.$message({ message: err, type: "error" });
      }
    },

    renderContent(createElement, { node, data, store }) {
      return createElement("span", [
        createElement("img", {
          attrs: { src: data.icon },
          style: { "vertical-align": "middle" },
        }),
        createElement("span", {
          style: { "margin-left": "5px" },
          domProps: { innerHTML: node.label },
        }),
      ]);
    },

    nodeContextmenu(event, nodeObject, nodeProperty, treeNode) {
      //event, node object corresponding to the node clicked, node property of TreeNode, TreeNode itself
      console.log(event, nodeObject, nodeProperty, treeNode);
      // See https://medium.com/@akumaisaacakuma/how-to-create-custom-context-menu-in-vue-970e67059532
    },

    // The tree node expands
    handleNodeExpand(data) {
      let expandedNodes = this.pageSettings.expandedNodes
        ? this.pageSettings.expandedNodes
        : [];
      let idx = expandedNodes.find((item) => {
        return item === data._id;
      });
      // Save the currently expanded node
      if (!idx) {
        expandedNodes.push(data._id);
        this.$settings.upsert(this.pageId, (doc) => {
          doc.expandedNodes = expandedNodes;
          return doc;
        });
      }
    },
    // The tree node is closed
    handleNodeCollapse(data) {
      let expandedNodes = this.pageSettings.expandedNodes;
      if (!expandedNodes) return;
      let idx = expandedNodes.find((item) => {
        return item === data._id;
      });
      // Delete the currently closed node
      if (idx) {
        expandedNodes.splice(idx, 1);
        this.$settings.upsert(this.pageId, (doc) => {
          doc.expandedNodes = expandedNodes;
          return doc;
        });
      }
    },

    // Insert selectObjId and pageId into next level hash
    updateNextLevelHashSelectedObjId(nodeData) {
      let hashArr = window.location.hash.split("/");
      let nextPageStateStr = hashArr[this.hashLevel + 2];
      if (!nextPageStateStr) nextPageStateStr = "";
      let nextPageStateArr = nextPageStateStr.split(".");
      nextPageStateArr[0] = nodeData._id;
      if (nodeData.pageId && nextPageStateArr[1] !== nodeData.pageId) {
        nextPageStateArr[1] = nodeData.pageId;
        // Remove tab if there is one. Page find its own tab
        nextPageStateArr.splice(2);
        // Remove erveything that comes after the next level as it no longer valid
        hashArr.splice(this.hashLevel + 3);
      }
      nextPageStateStr = nextPageStateArr.join(".");
      hashArr[this.hashLevel + 2] = nextPageStateStr;
      //TODO remove following levels, fill with defaults
      let hash = hashArr.join("/");
      window.location.hash = hash;
    },

    handleHashChange: function () {
      const ourLevelStr = window.location.hash.split("/")[this.hashLevel + 1];
      if (ourLevelStr) {
        const ourLevelArr = ourLevelStr.split(".");
        this.selectedObjId = ourLevelArr[0];
        this.pageId = ourLevelArr[1];
      }

      const nextLevelStr = window.location.hash.split("/")[this.hashLevel + 2];
      if (nextLevelStr) {
        const nextLevelArr = nextLevelStr.split(".");
        const selectedObjId = nextLevelArr[0];
        // TODO select unselect is a bit buggy
        this.$refs["tree"].setCurrentKey(null);
        this.$refs["tree"].setCurrentKey(selectedObjId);
      }
    },
  },

  mounted() {
    window.addEventListener("hashchange", this.handleHashChange, false);
    this.handleHashChange();
  },
  beforeDestroy() {
    window.removeEventListener("hashchange", this.handleHashChange, false);
  },
};
</script>

<style scoped>
</style>
