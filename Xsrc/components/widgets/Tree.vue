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
import {
  pluck,
  switchMap,
  filter,
  distinctUntilChanged,
  map,
} from "rxjs/operators";
import { from, defer, combineLatest } from "rxjs";
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
        if (classObj.classIcon) return classObj.classIcon;
        return getAnscestorsIcon(classObj.superClassId);
      };

      const addTreeVariables = (items, queryObj) => {
        // Do not use forEach with async
        for (const item of items) {
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
            if (item.classId) item.pageId = "mb2bdqadowve";
            // merged anscestors page
            else item.pageId = "24cnex2saye1"; // class details page
          }

          // If the queryObj has an icon, use it. Otherwise use the item icon.
          if (queryObj.nodesIcon) item.icon = queryObj.nodesIcon;
          // Still no icon, ask the anscetors
          //if (!item.icon) item.icon = await getAnscestorsIcon(item.classId);
        }
      };

      // If the item still doesn't have an icon then get one from the Anscestors
      const addClassIcons = async (items) => {
        const iconsPromisses = [];
        items.forEach((item) => {
          if (!item.icon)
            iconsPromisses.push(
              getAnscestorsIcon(
                item.classId ? item.classId : item.supperClassId
              )
            );
          else iconsPromisses.push(item.icon);
        });
        const iconsArr = await Promise.all(iconsPromisses);

        items.forEach((item, index) => {
          item.icon = iconsArr[index];
        });
      };

      try {
        // root level
        if (node.level === 0) {
          // Get the viewObj
          this.viewObj = await db.state.get(this.viewId);
          // Get the queryObj
          const queryObj = await db.state.get(this.viewObj.queryId);

          // Get the observable
          /* const observableResults$ = defer(() =>
            argoQuery.executeQuery(queryObj, {
              _id: this.selectedObjId,
            })
          ); */
          const observableResults$ = argoQuery.executeQuery(queryObj, {
            _id: this.selectedObjId,
          })

          observableResults$.subscribe({
            next: async (resultArr) => {
              addTreeVariables(resultArr, queryObj);
              await addClassIcons(resultArr); // if the item doesn't have one yet
              // update the root node
              node.store.setData(resultArr);
            },
            error: (error) => console.error(error),
          });
          resolve([]);
        }
        // node.level > 0
        else {
          if (node.data.subQueryIds) {

            // Collect the queries
            let queryPromisses = node.data.subQueryIds.map((queryId) =>
              db.state.get(queryId)
            );
            const queryObjArr = await Promise.all(queryPromisses);

            // Collect the observables
            let obervablesArr = queryObjArr.map((queryObj) => {
              return argoQuery.executeQuery(queryObj, node.data);
            });

            // Combine the latest results of each of the queries into a single res array
            // Whenever any of them emits a change
            const observableResults$ = combineLatest(obervablesArr).pipe(
              map((resArrArr) => {
                resArrArr.forEach((resArr, index) => {
                  addTreeVariables(resArr, queryObjArr[index]);
                })
                return resArrArr.flat();
              })
            );
            observableResults$.subscribe({
              next: async (resultArr) => {
                await addClassIcons(resultArr); // if the item doesn't have one yet
                // update the child items
                node.store.updateChildren(node.data._id, resultArr)
              },
              error: (error) => console.error(error),
            });
          }
          resolve([]);
        }
      } catch (err) {
        console.error(err);
        this.$message({ message: err, type: "error" });
      }
    },

    renderContent(createElement, { node, data, store }) {
      const icon = data.icon;
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
            icon: "clone",
            text: "Copy Object",
            divider: true,
            click: async () => {
              let obj = await db.state.get(nodeData._id);
              delete obj._id;
              obj.name += " - Copy";
              const newObjId = await db.state.add(obj);
              // Select the new node
              this.$refs["tree"].setCurrentKey(newObjId);
              this.updateNextLevelHash({ _id: newObjId });
            },
          },
          {
            icon: "minus-circle",
            text: "Delete Object",
            click: () => {
              // TODO remove id from hash
              db.state.delete(nodeData._id);
            },
          },
        ];
      } else {
        items = [
          {
            icon: "plus-circle",
            text: "Add Subclass",
            click: async () => {
              const newClsId = await db.state.add({
                title: "New Class",
                superClassId: nodeData._id,
              });
              // Select the new node
              this.$refs["tree"].setCurrentKey(newClsId);
              this.updateNextLevelHash({ _id: newClsId });
            },
          },
          {
            icon: "clone",
            text: "Copy Class",
            click: async () => {
              let cls = await db.state.get(nodeData._id);
              delete cls._id;
              cls.title += " - Copy";
              const newClsId = await db.state.add(cls);
              // Select the new node
              this.$refs["tree"].setCurrentKey(newClsId);
              this.updateNextLevelHash({ _id: newClsId });
            },
          },
          /* {
            icon: "plus-circle",
            text: "Add Object",
            divider: true,
            click: () => {
              db.state.add({
                name: "New Class",
                classId: nodeData._id,
                ownerId: nodeData.ownerId,
              });
            },
          }, */
          {
            icon: "minus-circle",
            text: "Delete Class",
            iconColor: "red",
            click: () => {
              // TODO remove id from hash
              db.state.delete(nodeData._id);
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
.context-menu >>> .menu {
  border-color: #524f4f;
}
</style>
