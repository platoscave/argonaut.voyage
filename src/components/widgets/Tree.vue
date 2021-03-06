<template>
  <div v-if="viewObj">
    <el-tree
      :props="props"
      :load="loadNode"
      lazy
      node-key="_id"
      :render-content="renderContent"
      :default-expanded-keys="pageSettings.expandedNodes"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
      draggable
      @node-contextmenu="nodeContextmenu"
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
    pageId: String,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      props: {
        label: "name",
        children: "zones",
        isLeaf: "leaf",
      },
      defaultProps: {
        children: "children",
        label: "label",
      },
    };
  },
  pouch: {
    viewObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.viewId },
        first: true,
      };
    },
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

    loadNode(node, resolve) {
      if (node.level === 0) {
        this.$pouch
          .find({
            selector: { _id: this.viewObj.subQueryIds },
          })
          .then((results) => {
            const query = results.docs[0];
            this.$pouch.find(results.docs[0].queryObj).then((results2) => {
              const resArr = results2.docs.map((entry) => {
                return {
                  _id: entry._id,
                  name: entry.title,
                  subQueryIds: query.subQueryIds,
                  icon: query.icon,
                };
              });
              resolve(resArr);
            });
            /* var liveFeed = this.$pouch
              .liveFind(results.docs[0].queryObj)

              // Called every time there is an update to the query
              .on("update", function (update, aggregate) {
                // update.action is 'ADD', 'UPDATE', or 'REMOVE'
                // update also contains id, rev, and doc
                console.log(update.action, update.id);
                // aggregate is an array of docs containing the latest state of the query
                resolve(aggregate);
                // (refreshUI would be a function you write to pipe the changes to your rendering engine)
              })

              // Called when the initial query is complete
              .on("ready", function () {
                console.log("Initial query complete.");
              })

              // Called when you invoke `liveFeed.cancel()`
              .on("cancelled", function () {
                console.log("LiveFind cancelled.");
              }); */
          })
          .catch(function (err) {
            console.log(err);
          });

        // Start our live query
      }
      if (node.level > 1) return resolve([]);

      setTimeout(() => {
        const data = [
          {
            name: "leaf",
            leaf: true,
          },
          {
            name: "zone",
          },
        ];

        resolve(data);
      }, 1000);
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

    handleHashChange: function () {
      const ourLevelStr = window.location.hash.split("/")[this.hashLevel + 1];
      if (!ourLevelStr) return;
      const levelStates = ourLevelStr.split(".");
      this.selectedObjId = levelStates[0];
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
