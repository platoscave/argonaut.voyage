<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import useArgoQuery from "~/composables/useArgoQuery";
import {
  useHashDissect,
  updateNextLevelHash,
} from "~/composables/useHashDissect";
import { ElMessage } from "element-plus";

const props = defineProps({
  hashLevel: Number,
  widgetObj: Object,
});
const treeEl = ref(null);

const { selectedObjId, pageId, nextLevelSelectedObjId } = useHashDissect(
  props.hashLevel
);

const defaultProps = {
  isLeaf: "isLeaf",
};
let expandedNodes = ref([]);

watch(nextLevelSelectedObjId, (nextLevelSelectedObjId) => {
  if(!treeEl.value) return
  treeEl.value.setCurrentKey(nextLevelSelectedObjId);
});

// See if we can get expanded nodes from the last time we visited this page
db.settings.get(pageId.value).then((pageRes) => {
  if (pageRes && pageRes.expandedNodes)
    expandedNodes.value = pageRes.expandedNodes;
  // add empty pagesettings for update to work
  if (!pageRes) db.settings.add({ pageId: pageId.value });
});

const loadNode = async (node, resolve) => {
  //
  // Get Icon from item anscestors, recursivly
  const getAnscestorsIcon = async (id) => {
    const classObj = await db.state.get(id);
    if (classObj.classIcon) return classObj.classIcon;
    return getAnscestorsIcon(classObj.superClassId);
  };

  // If the item still doesn't have an icon then get one from the Anscestors
  const addClassIcons = async (items) => {
    const iconsPromisses = items.map((item) => {
      if (item.icon) return item.icon;
      return getAnscestorsIcon(item.classId ? item.classId : item.superClassId);
    });
    return await Promise.all(iconsPromisses);
  };

  const addTreeNodeVars = (items) => {
    const resItems = items.map((item) => {
      item.label = item.title ? item.title : item.name; //TODO value?

      if (item.queryObj.subQueryIds && item.queryObj.subQueryIds.length) {
        item.subQueryIds = item.queryObj.subQueryIds;
        // If the query has subQueryIds, assume it may have children
        //TODO execute the queryObj.subQueryIds to see if we're dealing with a leaf node
        item.isLeaf = false;
      } else item.isLeaf = true;

      // If the queryObj has a pageId, use it. Otherwise use the item pageId.
      if (item.queryObj.nodesPageId) item.pageId = item.queryObj.nodesPageId;
      // Still no pageId, use the default object page based on merged anscestors
      if (!item.pageId) {
        if (item.classId)
          item.pageId = "mb2bdqadowve"; // merged anscestors page
        else item.pageId = "24cnex2saye1"; // class details page
      }

      // If the queryObj has an icon, use it. Otherwise use the item icon.
      if (item.queryObj.nodesIcon) item.icon = item.queryObj.nodesIcon;
      return item;
    });
    return resItems;
  };

  try {
    // root level
    if (node.level === 0) {
      // Get the viewObj
      const viewObj = await db.state.get(props.widgetObj.viewId);
      // Get the queryObj
      const queryObj = await db.state.get(viewObj.queryId);

      const queryResRef = useArgoQuery(queryObj, { _id: selectedObjId });
      watch(queryResRef, (resultArr) => {
        // Add tree node vars
        const enrichedResultArr = addTreeNodeVars(resultArr);

        // if the item doesn't have an icon yet get it from class anscetors
        addClassIcons(enrichedResultArr).then((iconsArr) => {
          const finalResArr = enrichedResultArr.map((item, idx) => {
            item.icon = iconsArr[idx];
            return item;
          });
          // update the root node
          node.store.setData(finalResArr);
        });
      });

      resolve([]);
    }
    // node.level > 0
    else {
      const queryResRef = useArgoQuery(node.data.subQueryIds, node.data);
      watch(queryResRef, (resultArr) => {
        // Add tree node vars
        const enrichedResultArr = addTreeNodeVars(resultArr);

        addClassIcons(enrichedResultArr).then((iconsArr) => {
          const finalResArr = enrichedResultArr.map((item, idx) => {
            item.icon = iconsArr[idx];
            return item;
          });
          // update child nodes of this node
          node.store.updateChildren(node.data._id, finalResArr);
        });
      });

      resolve([]);
    }
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: "error",
      duration: 0,
    });
    throw err;
  }
};

// The tree node expands, update page settings
const handleNodeExpand = (data) => {
  db.settings.get(pageId.value).then((pageRes) => {
    const idx = pageRes.expandedNodes.find((item) => item === data._id);

    // Update the expanded nodes in pageSettings for this pageId in the settings db
    if (!idx) {
      pageRes.expandedNodes.push(data._id);
      db.settings.update(pageId.value, {
        expandedNodes: pageRes.expandedNodes,
      });
    }
  });
};
// The tree node is closed, update page settings
const handleNodeCollapse = async (data) => {
  db.settings.get(pageId.value).then((pageRes) => {
    const idx = pageRes.expandedNodes.find((item) => item === data._id);

    // Update the expanded nodes in pageSettings for this pageId in the settings db
    if (idx) {
      pageRes.expandedNodes.splice(idx, 1);
      db.settings.update(pageId.value, {
        expandedNodes: pageRes.expandedNodes,
      });
    }
  });
};
const handleDragStart = (node, ev) => {
  console.log("drag start", node);
};
const showContextMenu = (node, ev) => {
  console.log("showContextMenu", node);
};
const handleDragEnter = (draggingNode, dropNode, ev) => {
  console.log("tree drag enter: ", dropNode.label);
};
const handleDragLeave = (draggingNode, dropNode, ev) => {
  console.log("tree drag leave: ", dropNode.label);
};
const handleDragOver = (draggingNode, dropNode, ev) => {
  console.log("tree drag over: ", dropNode.label);
};
const handleDragEnd = (draggingNode, dropNode, dropType, ev) => {
  console.log("tree drag end: ", dropNode && dropNode.label, dropType);
};
const handleDrop = (draggingNode, dropNode, dropType, ev) => {
  console.log("tree drop: ", dropNode.label, dropType);
};
const allowDrop = (draggingNode, dropNode, type) => {
  if (dropNode.data.label === "Level two 3-1") {
    return type !== "inner";
  } else {
    return true;
  }
};
const allowDrag = (draggingNode) => {
  return draggingNode.data.label.indexOf("Level three 3-1-1") === -1;
};
onMounted(async () => {
  if (!nextLevelSelectedObjId.value) {
    // See if we can get CurrentKey from the last time we visited this page
    // We have to wait half a second because the nodes won't have been loaded yet
    setTimeout(() => {
      db.settings.get(pageId.value).then((pageRes) => {
        if (pageRes && pageRes.nextLevelSelectedObjId) {
          //treeEl.value.setCurrentKey(pageRes.nextLevelSelectedObjId);

          const nodeData = treeEl.value.getNode(pageRes.nextLevelSelectedObjId);
          debugger
          updateNextLevelHash(
            props.hashLevel,
            pageRes.nextLevelSelectedObjId,
            nodeData.data.pageId
          );
        }
      });
    }, 500);
  }
});
</script>

<template>
  <el-tree
    ref="treeEl"
    highlight-current
    :expand-on-click-node="false"
    :props="defaultProps"
    :load="loadNode"
    lazy
    node-key="_id"
    :default-expanded-keys="expandedNodes"
    @node-click="
      (nodeData) =>
        updateNextLevelHash(hashLevel, nodeData._id, nodeData.pageId)
    "
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
    <template #default="{ node, data }">
      <img :src="data.icon" />
      <span class="node-label">{{ node.label }}</span>
    </template>
  </el-tree>
</template>
<!--
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
                item.classId ? item.classId : item.superClassId
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
          });

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
                });
                return resArrArr.flat();
              })
            );
            observableResults$.subscribe({
              next: async (resultArr) => {
                await addClassIcons(resultArr); // if the item doesn't have one yet
                // update the child items
                node.store.updateChildren(node.data._id, resultArr);
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

    // The tree node expands, update page settings
    const handleNodeExpand = async (data) => {
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
    }
    // The tree node is closed, update page settings
    const handleNodeCollapse = async (data) => {
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
-->
<style scoped>
.node-label {
  margin-left: 5px;
}
.context-menu >>> .menu {
  border-color: #524f4f;
}
</style>
