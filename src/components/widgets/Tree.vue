<template>
  <div v-if="viewObj">
    <el-tree
      ref="tree"
      :highlight-current="true"
      :expand-on-click-node="false"
      :props="defaultProps"
      :load="loadNode"
      lazy
      node-key="_id"
      :render-content="renderContent"
      :default-expanded-keys="expandedNodes"
      @node-click="updateNextLevelHash"
      @node-contextmenu="showContextMenu"
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
    <ki-context
      class="context-menu"
      ref="kiContext"
      minWidth="1em"
      maxWidth="20em"
      backgroundColor="#232323"
      fontSize="15px"
      textColor="#eee"
      iconColor="#41b883"
      borderColor="#41b883"
      borderRadius="5px"
    />
  </div>
</template>

<script>
import { db, argoQuery } from "../../services/dexieServices";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-tree",
  mixins: [WidgetMixin],
  components: {},
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
      expandedNodes: [],
      nextLevelSelectedObjId: "",
    };
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
      //
      // Get Icon from item anscestors, recursivly
      const getAnscestorsIcon = async (id) => {
        const classObj = await db.state.get(id);
        //console.log("getProp", classObj._id, classObj.title, classObj.pageId, classObj.icon ? classObj.icon.substr(classObj.icon.length - 50) : 'no icon');
        if (classObj.classIcon) return classObj.classIcon;
        return await getAnscestorsIcon(classObj.superClassId);
      };

      const addTreeVariables = async (items, queryObj) => {
        items.forEach(async (item) => {
          item.label = item.title ? item.title : item.name; //TODO value?

          if (queryObj.subQueryIds && queryObj.subQueryIds.length) {
            item.subQueryIds = queryObj.subQueryIds;
            // If the query has subQueryIds, assume it may have children
            //TODO execute the queryObj.subQueryIds to see if we're dealing with a leaf node
            item.isLeaf = false;
          } else item.isLeaf = true;

          // If the queryObj has a pageId, use it. Otherwise use the item pageId.
          if (queryObj.nodesPageId) item.pageId = queryObj.nodesPageId;
          // Still no pageId, use the default object page based on merged anscestors
          if (!item.pageId) {
            if(item.data.classId) item.pageId = "mb2bdqadowve" // merged anscestors page
            else item.pagId = "24cnex2saye1" // class details page
          }

          // If the queryObj has an icon, use it. Otherwise use the item icon.
          if (queryObj.nodesIcon) item.icon = queryObj.nodesIcon;
          // Still no icon, ask the anscetors
          if (!item.icon) {
            item.icon = await getAnscestorsIcon(item.classId);

            console.log(
              "addTreeVariables after ",
              item._id,
              item.label,
              item.pageId,
              item.icon ? item.icon.substr(item.icon.length - 50) : "no icon"
            );
          }
        });
      };

      const executeQueryAddVars = async (queryId, nodeData) => {
        const queryObj = await db.state.get(queryId);
        const resArr = await argoQuery.executeQuery(queryObj, nodeData);
        await addTreeVariables(resArr, queryObj);
        return resArr;
      };

      try {
        // root level
        if (node.level === 0) {
          // Get the viewObj
          this.viewObj = await db.state.get(this.viewId);
          // Execute the query
          const resArr = await executeQueryAddVars(this.viewObj.queryId, {
            _id: this.selectedObjId,
          });
          resolve(resArr);
        }
        // node.level > 0
        else {
          if (node.data.subQueryIds) {
            let promiseArr = node.data.subQueryIds.map((queryId) => {
              // Execute the query
              return executeQueryAddVars(queryId, node.data);
            });
            const resArr = await Promise.all(promiseArr);
            let flatResArr = resArr.flat();
            console.log("flatResArr", flatResArr);
            resolve(flatResArr);
          } else resolve([]);
        }
      } catch (err) {
        console.error(err);
        this.$message({ message: err, type: "error" });
      }
    },

    renderContent(createElement, { node, data, store }) {
      const icon = data.icon
      if (!icon) {
        console.log("nodeData", node.label, data, data.icon);
      }
      return createElement("span", [
        createElement("img", {
          attrs: { src: icon },
          style: { "vertical-align": "middle" },
        }),
        createElement("span", {
          style: { "margin-left": "5px" },
          domProps: { innerHTML: node.label },
        }),
      ]);
    },

    showContextMenu(event, nodeData, node, nodeCmp) {
      //event.stopPropagation()
      //event.preventDefault()
      let items = [];
      if (nodeData.classId) {
        items = [
          {
            icon: "plus-circle",
            text: "Add Object",
            click: () => {
              alert("Option0!");
            },
          },
          {
            icon: "clone",
            text: "Clone Object",
            divider: true,
            click: () => {
              alert("Option2!");
            },
          },
          {
            icon: "minus-circle",
            text: "Delete Object",
            click: () => {
              alert("Option3!");
            },
          },
        ];
      } else {
        items = [
          {
            icon: "plus-circle",
            text: "Add Subclass",
            click: () => {
              alert("Option0!");
            },
          },
          {
            icon: "clone",
            text: "Clone Class",
            click: () => {
              alert("Option2!");
            },
          },
          {
            icon: "plus-circle",
            text: "Add Object",
            divider: true,
            click: () => {
              alert("Option2!");
            },
          },
          {
            icon: "minus-circle",
            text: "Delete Class",
            iconColor: "red",
            click: () => {
              alert("Option3!");
            },
          },
        ];
      }
      this.$refs.kiContext.show(event, items);
    },
    hideContextMenu() {
      this.$refs.kiContext.hide();
    },

    // The tree node expands, update page settings
    async handleNodeExpand(data) {
      let idx = this.expandedNodes.find((item) => {
        return item === data._id;
      });

      // Update the expanded nodes in pageSettings for this pageId in the settings db
      if (!idx) {
        this.expandedNodes.push(data._id);
        await db.settings.update(this.pageId, {
          expandedNodes: this.expandedNodes,
        });
      }
    },
    // The tree node is closed, update page settings
    async handleNodeCollapse(data) {
      let idx = this.expandedNodes.find((item) => {
        return item === data._id;
      });

      // Update the expanded nodes in pageSettings for this pageId in the settings db
      if (idx) {
        this.expandedNodes.splice(idx, 1);
        await db.settings.update(this.pageId, {
          expandedNodes: this.expandedNodes,
        });
      }
    },
  },

  // Click outside to close context menu
  // see https://stackoverflow.com/questions/36170425/detect-click-outside-element
  created() {
    this.__handlerRef__ = this.hideContextMenu.bind(this);
    document.body.addEventListener("click", this.__handlerRef__);
  },
  destroyed() {
    document.body.removeEventListener("click", this.__handlerRef__);
  },

  async mounted() {
    // See if we can get expanded nodes from the last time we visited this page
    const pageSettings = await db.settings.get(this.pageId);
    if (pageSettings) {
      if (pageSettings.expandedNodes)
        this.expandedNodes = pageSettings.expandedNodes;
    } else await db.settings.add({ pageId: this.pageId });

    // Click initial treenode
    setTimeout(async () => {
      // We have to wait half a second because the nodes won't have been loaded yet
      // Is there a better way?
      this.$refs["tree"].setCurrentKey(pageSettings.nextLevelSelectedObjId);
      const nodeData = this.$refs["tree"].getCurrentNode();
      if (nodeData) this.updateNextLevelHash(nodeData);
    }, 500);
  },
};
</script>

<style scoped>
.context-menu >>> .menu{
  border-color: #524f4f
}
</style>
