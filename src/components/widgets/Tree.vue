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
      @node-click="updateNextLevelHash"
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
import ContextMenu from "./ContextMenu.vue"
import QueryMixin from "../../lib/queryMixin"
import WidgetMixin from "../../lib/widgetMixin"

export default {
  name: "ar-tree",
  mixins: [QueryMixin, WidgetMixin],
  components: {
    "ar-context-menu": ContextMenu,
  },
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      viewObj: {},
      defaultProps: {
        isLeaf: "isLeaf",
      },
      nextLevelSelectedObjId: ''
    }
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
          // Execute the query
          const resArr = await this.getTheData(this.viewObj.queryId, node.data);
          resolve(resArr);
        }
        if (node.level > 0) {
          //TODO remove condition?
          if (node.data.subQueryIds) {
            let promiseArr = node.data.subQueryIds.map((queryId) => {
              return this.getTheData(queryId, node.data);
            });
            const resArr = await Promise.all(promiseArr);
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

    // The tree node expands, update page settings
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
    // The tree node is closed, update page settings
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

  },

  watch: {
    nextLevelSelectedObjId: function (selectedObjId) {
        // TODO select unselect is a bit buggy
        //this.$refs["tree"].setCurrentKey(null);
        this.$refs["tree"].setCurrentKey(selectedObjId);
    },
  },
};
</script>

<style scoped>
</style>
