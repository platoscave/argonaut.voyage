<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import useArgoQuery from "~/composables/useArgoQuery";
import { useHashDissect, updateNextLevelHash } from "~/composables/useHashDissect";
import { ElMessage } from "element-plus";
import jp from "jsonpath";

const props = defineProps({
  hashLevel: Number,
  widgetObj: Object,
});
const treeEl = ref(null);
const menuEl = ref(null);
const showContextMenu = ref(false);

const { selectedObjId, pageId, nextLevelSelectedObjId } = useHashDissect(props.hashLevel);

const defaultProps = {
  isLeaf: "isLeaf",
};
let expandedNodes = ref([]);

watch(nextLevelSelectedObjId, (nextLevelSelectedObjId) => {
  if (!treeEl.value) return;
  treeEl.value.setCurrentKey(nextLevelSelectedObjId);
});

// See if we can get expanded nodes from the last time we visited this page
db.settings.get(pageId.value).then((pageSettings) => {
  if (pageSettings && pageSettings.expandedNodes)
    expandedNodes.value = pageSettings.expandedNodes;
  // add empty pagesettings for update to work
  if (!pageSettings) db.settings.add({ pageId: pageId.value, expandedNodes: [] });
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

      if (item.treeVars.subQueryIds && item.treeVars.subQueryIds.length) {
        item.subQueryIds = item.treeVars.subQueryIds;
        // If the query has subQueryIds, assume it may have children
        //TODO execute the treeVars.subQueryIds to see if we're dealing with a leaf node
        item.isLeaf = false;
      } else item.isLeaf = true;

      // If the treeVars has a pageId, use it. Otherwise use the item pageId.
      if (item.treeVars.nodesPageId) item.pageId = item.treeVars.nodesPageId;
      // Still no pageId, use the default object page based on merged anscestors
      if (!item.pageId) {
        if (item.classId) item.pageId = "mb2bdqadowve";
        // merged anscestors page
        else item.pageId = "24cnex2saye1"; // class details page
      }

      // If the treeVars has an icon, use it. Otherwise use the item icon.
      if (item.treeVars.nodesIcon) item.icon = item.treeVars.nodesIcon;
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

      const queryResRef = useArgoQuery(queryObj, { _id: selectedObjId.value });
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
const handleNodeExpand = (expandedNode) => {
  db.settings.get(pageId.value).then((pageSettings) => {
    let idx = null;
    if (pageSettings.expandedNodes)
      idx = pageSettings.expandedNodes.find((item) => item === expandedNode._id);
    else pageSettings.expandedNodes = [];
    // Update the expanded nodes in pageSettings for this pageId in the settings db
    if (!idx) {
      pageSettings.expandedNodes.push(expandedNode._id);
      db.settings.update(pageId.value, {
        expandedNodes: pageSettings.expandedNodes,
      });
    }
  });
};
// The tree node is closed, update page settings
const handleNodeCollapse = async (collapsedNode) => {
  db.settings.get(pageId.value).then((pageSettings) => {
    const idx = pageSettings.expandedNodes.find((item) => item === collapsedNode._id);

    // Update the expanded nodes in pageSettings for this pageId in the settings db
    if (idx) {
      pageSettings.expandedNodes.splice(idx, 1);
      db.settings.update(pageId.value, {
        expandedNodes: pageSettings.expandedNodes,
      });
    }
  });
};
const options = {
  items: [
    {
      label: "Add Child Paragraph",
      onClick: () => {
        document.execCommand("copy");
      },
    },
    {
      label: "Copy",
      onClick: () => {
        document.execCommand("copy");
      },
    },
    { label: "Paste", disabled: true },
    {
      label: "Print",
      icon: "icon-print",
      onClick: () => {
        document.execCommand("print");
      },
    },
  ],
  iconFontClass: "iconfont",
  customClass: "class-a",
  minWidth: 230,
  x: 0,
  y: 0,
};

const onContextMenu = (evt, node) => {
  console.log("showContextMenu", node);
  let selectNode = treeEl.value.getNode(node);
  console.log("Parent", selectNode.parent);
  //prevent the browser's default menu
  evt.preventDefault();
  //shou our menu
  showContextMenu.value = true;
  options.x = evt.x;
  options.y = evt.y;
};
let draggingNodeParent = null;
const handleDragStart = (node, evt) => {
  // we have to capture the draggingNode parent here because it disapears lateron
  draggingNodeParent = node.parent;
};
const handleDragEnter = (draggingNode, dropNode, evt) => {
  //console.log("tree drag enter: ", dropNode.label);
};
const handleDragLeave = (draggingNode, dropNode, evt) => {
  //console.log("tree drag leave: ", dropNode.label);
};
const handleDragOver = (draggingNode, dropNode, evt) => {
  //console.log("tree drag over: ", dropNode.label);
};
const handleDragEnd = async (draggingNode, dropNode, dropType, evt) => {
  //console.log("tree drag end: ", dropNode, dropType);
};
const handleDrop = async (draggingNode, dropNode, dropType, evt) => {

  if (draggingNode.data.treeVars.selector === "Context Object") {
    // console.log("movingNode", draggingNode);
    // console.log("dropNode", dropNode);

    // Get the paths that we will be using
    const path = dropNode.data.treeVars.idsArrayPath.path;
    let valuePath = path;
    const pathLength = path.length - 3;
    if (path.substr(pathLength) === "[*]") valuePath = path.substr(0, path.length - 3);

    // remove draggingNode from current parent ids array
    // We got the draggingNodeParent in dragStart
    const currentParentObj = await db.state.get(draggingNodeParent.data._id);
    //console.log("Current Parent before",currentParentObj.name,currentParentObj.subParagraphIds);
    const curIdsArr = jp.query(currentParentObj, path);
    const curIdx = curIdsArr.indexOf(draggingNode.data._id);
    curIdsArr.splice(curIdx, 1);

    // update the currentParentObj with the shortend ids array
    jp.value(currentParentObj, valuePath, curIdsArr);
    await db.state.update(currentParentObj._id, currentParentObj);
    //console.log("Current Parent after",currentParentObj.name,currentParentObj.subParagraphIds);

    if (dropType === "inner") {

      // get the new parent object based on the dropNode
      const newParentObj = await db.state.get(dropNode.data._id);
      const newIdsArr = jp.query(newParentObj, path);

      // add draggingNode to drop node ids array, at the end
      newIdsArr.push(draggingNode.data._id);
      jp.value(newParentObj, valuePath, newIdsArr);
      await db.state.update(newParentObj._id, newParentObj);
      //console.log("New Parent after", newParentObj.name, newParentObj.subParagraphIds);
    }

    // add draggingNode to draggingNodeParent ids array, before dropNode
    if (dropType === "before") { 

      // get the new parent object based on the dropNode parent
      const newParentObj = await db.state.get(dropNode.parent.data._id);
      const newIdsArr = jp.query(newParentObj, path);
      //console.log("New Parent before", newParentObj.name, newParentObj.subParagraphIds);

      const beforeIdx = newIdsArr.indexOf(dropNode.data._id);
      newIdsArr.splice(beforeIdx - 1, 0, draggingNode.data._id);

      // update the newParentObj with the new ids array
      jp.value(newParentObj, valuePath, newIdsArr);
      await db.state.update(newParentObj._id, newParentObj);
      //console.log("New Parent after", newParentObj.name, newParentObj.subParagraphIds);
    }

    // add draggingNode to drop node ids array, after dropNode
    if (dropType === "after") {

      // get the new parent object based on the dropNode parent
      const newParentObj = await db.state.get(dropNode.parent.data._id);
      const newIdsArr = jp.query(newParentObj, path);
      //console.log("New Parent before", newParentObj.name, newParentObj.subParagraphIds);

      const afterIdx = newIdsArr.indexOf(dropNode.data._id);
      newIdsArr.splice(afterIdx, 0, draggingNode.data._id);

      // update the currentParentObj with the new ids array
      jp.value(newParentObj, valuePath, newIdsArr);
      await db.state.update(newParentObj._id, newParentObj);
      //console.log("New Parent after", newParentObj.name, newParentObj.subParagraphIds);
    }
  } else if (draggingNodeObj.data.treeVars.selector === "Where Clause") {

    const newParentId = dropNode.data._id;
    
    const draggingNodeObj = await db.state.get(draggingNode.data._id);

    // update the foreign key
    const whereObj = draggingNodeObj.data.treeVars.whereObj
    for(const key in whereObj) {
      const value = whereObj[key]
      if( value === '$fk') draggingNodeObj[key] = newParentId
    }
    await db.state.update(draggingNodeObj._id, draggingNodeObj);

  }
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
onMounted(() => {
  if (!nextLevelSelectedObjId.value) {
    // See if we can get CurrentKey from the last time we visited this page
    // We have to wait half a second because the nodes won't have been loaded yet
    setTimeout(() => {
      db.settings.get(pageId.value).then((pageSettings) => {
        if (pageSettings && pageSettings.nextLevelSelectedObjId) {
          //treeEl.value.setCurrentKey(pageSettings.nextLevelSelectedObjId);
          const nodeData = treeEl.value.getNode(pageSettings.nextLevelSelectedObjId);
          updateNextLevelHash(
            props.hashLevel,
            pageSettings.nextLevelSelectedObjId,
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
      (nodeData) => updateNextLevelHash(hashLevel, nodeData._id, nodeData.pageId)
    "
    @node-contextmenu="onContextMenu"
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
  <context-menu ref="menuEl" v-model:show="showContextMenu" :options="options" />
</template>

<style scoped>
.node-label {
  margin-left: 5px;
}
.context-menu >>> .menu {
  border-color: #524f4f;
}
</style>
