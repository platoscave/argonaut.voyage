<template>
  <div v-if="viewObj">
    <el-tree
      ref="tree"
      highlight-current
      :expand-on-click-node="false"
      :props="defaultProps"
      :load="loadNode"
      lazy
      node-key="_id"
      :render-content="renderContent"
      :default-expanded-keys="pageSettings ? pageSettings.expandedNodes : []"
      @node-click="updateNextLevelHashSelectedObjId"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
      @node-contextmenu="nodeContextmenu"
      draggable
      @node-drag-start="handleDragStart"
      @node-drag-enter="handleDragEnter"
      @node-drag-leave="handleDragLeave"
      @node-drag-over="handleDragOver"
      @node-drag-end="handleDragEnd"
      @node-drop="handleDrop"
      :allow-drop="allowDrop"
      :allow-drag="allowDrag"
    >
    </el-tree>
    <ar-context-menu />
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import ContextMenu from "./ContextMenu.vue";

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
      try {
        // root level
        if (node.level === 0) {
          // Get the viewObj
          this.viewObj = await this.$pouch.get(this.viewId);
          // Get the queryObj
          let queryObj = await this.$pouch.get(this.viewObj.queryId);
          // Replace variables in the mongoQuery
          let selector = queryObj.mongoQuery.selector;
          for (var key in selector) {
            let cond = selector[key];
            if (cond === "$fk") selector[key] = this.selectedObjId;
          }
          // Execute the mongoQuery
          const result = await this.$pouch.find(queryObj.mongoQuery);
          let rootClass = result.docs[0];
          let userData = {
            _id: rootClass._id,
            label: rootClass.title ? rootClass.title : rootClass.name,
            subQueryIds: queryObj.subQueryIds,
            isLeaf: !queryObj.subQueryIds,
            // If the query reteives an icon, use it. Otherwise use the query icon.
            // TODO if the query reteives an empty icon, ask the object anscestors for an icon
            icon: rootClass.icon ? rootClass.icon : queryObj.icon,
            pageId: rootClass.pageId ? rootClass.pageId : queryObj.pageId,
          };
          resolve([userData]);
        }
        if (node.level > 0) {
          //return resolve([]);
          let resArr = [];
          node.data.subQueryIds.forEach(async (queryId) => {
            // Get the queryObj for this queryId
            let queryObj = await this.$pouch.get(queryId);
            // Replace variables in the mongoQuery
            let selector = queryObj.mongoQuery.selector;
            for (var key in selector) {
              let cond = selector[key];
              if (cond === "$fk") selector[key] = node.data._id;
            }
            delete queryObj.mongoQuery.sort; // temp hack: https://github.com/pouchdb/pouchdb/issues/6399
            // Execute the mongoQuery in the queryObj
            const results = await this.$pouch.find(queryObj.mongoQuery);
            const queryResArr = results.docs.map((item) => {
              //TODO execute the queryObj.subQueryIds to see if we're dealing with a leaf node
              return {
                _id: item._id,
                label: item.title ? item.title : item.name,
                subQueryIds: queryObj.subQueryIds,
                isLeaf: !queryObj.subQueryIds,
                // If the query retreives an icon, use it. Otherwise use the query icon.
                // TODO if the query reteives an empty icon, ask the object anscestors for an icon
                icon: item.icon ? item.icon : queryObj.icon,
                pageId: item.pageId ? item.pageId : queryObj.pageId,
              };
            });
            resArr = resArr.concat(queryResArr);
            resolve(resArr);
          });
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
        // Remove erveything that come after the next level as it no longer valid
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
