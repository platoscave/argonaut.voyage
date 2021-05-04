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
  </div>
</template>

<script>
import QueryMixin from "../../lib/queryMixin"
import WidgetMixin from "../../lib/widgetMixin"

export default {
  name: "ar-tree",
  mixins: [QueryMixin, WidgetMixin],
  components: {
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

      // Get PageId or Icon from item anscestors
      const getProp = async (id, prop) => {
        const classObj = await this.$pouch.get(id)
        if(classObj[prop]) return classObj[prop]
        return getProp(classObj.parentId, prop)
      }
      // For each resArr, Get PageId or Icon from item anscestors
      const getGetPropertyFromAnscetors = async (resArr, prop) => {
        let promisesArr = []
        resArr.forEach(item => {
          if(item[prop]) promisesArr.push(item[prop])
          else promisesArr.push(getProp(item.classId, prop))
        })
        const propArr = await Promise.all(promisesArr);
        resArr.forEach( (item, idx) => {
          item[prop] = propArr[idx]
        })
      }


      try {
        // root level
        if (node.level === 0) {
          // Get the viewObj
          this.viewObj = await this.$pouch.get(this.viewId);
          // Execute the query
          const resArr = await this.getTheData(this.viewObj.queryId, {_id: this.selectedObjId});

          // Get the pageIds / icons from anscetors, incase the result item didn't have one, neither did the mongoQuery
          getGetPropertyFromAnscetors(resArr, 'pageId')
          getGetPropertyFromAnscetors(resArr, 'icon')

          resolve(resArr);
        }
        if (node.level > 0) {
          //TODO remove condition?
          if (node.data.subQueryIds) {
            let promiseArr = node.data.subQueryIds.map((queryId) => {
              return this.getTheData(queryId, node.data);
            });
            const resArr = await Promise.all(promiseArr);
            let flatResArr = resArr.flat()

            // Get the pageIds / icons from anscetors, incase the result item didn't have one, neither did the mongoQuery
            getGetPropertyFromAnscetors(flatResArr, 'pageId')
            getGetPropertyFromAnscetors(flatResArr, 'icon')

            resolve(resArr.flat())
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
