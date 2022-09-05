<script setup lang="ts">
import { ref, reactive, watch, onMounted, nextTick } from "vue";
import { db } from "~/services/dexieServices";
import useArgoQuery from "~/composables/useArgoQuery";
import { useHashDissect, updateNextLevelHash } from "~/composables/useHashDissect";
import { usePageSettings, saveExpandedNodes } from "~/composables/usePageSettings";
import { ElMessage, ElMessageBox } from "element-plus";
import jp from "jsonpath";

const props = defineProps({
  hashLevel: Number,
  widgetObj: Object,
});

const { selectedObjId, pageId, nextLevelSelectedObjId } = useHashDissect(props.hashLevel);
const { expandedNodes, settingsNextLevelSelectedObjId } = usePageSettings(pageId.value);

const treeEl = ref(null);
const menuEl = ref(null);
const showContextMenu = ref(false);

const defaultProps = {
  isLeaf: "isLeaf",
};
let copiedNodeId: string = "";

watch(nextLevelSelectedObjId, (nextLevelSelectedObjId) => {
  if (!treeEl.value) return;
  treeEl.value.setCurrentKey(nextLevelSelectedObjId);
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
        // If the query has subQueryIds, assume it may have children
        // TODO execute the treeVars.subQueryIds to see if we're dealing with a leaf node
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
      const queryResRef = useArgoQuery(node.data.treeVars.subQueryIds, node.data);
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

const handleNodeExpandColapse = async () => {
  // wait for ui update before we go looking for expanded nodes
  // otherwise we might mis the latest collapse
  await nextTick(); 

  const nodesMap = treeEl.value.store.nodesMap;
  const expandedNodes = [];
  for (let key in nodesMap) {
    if (nodesMap[key].expanded) expandedNodes.push(key);
  }
  saveExpandedNodes(pageId.value, expandedNodes);
};

const onCtrlCopy = (evt) => {
  console.log("Ctrl Copy evt", treeEl.value.getCurrentKey());
  const currentKey = treeEl.value.getCurrentKey();
  if (currentKey) copiedNodeId = currentKey;
};

const onCtrlPaste = async () => {
  if (!copiedNodeId || !treeEl.value) return;

  const currentObj = await db.state.get(copiedNodeId);
  if (currentObj.classId) currentObj.name = "[New Object]";
  else currentObj.title = "[New Class]";
  currentObj.description = "<p>[New Description]</p>";
  delete currentObj._id;
  const newObjId = await db.state.add(currentObj);

  const copiedNode = treeEl.value.getNode(copiedNodeId);
  if (copiedNode.data.treeVars.selector === "Context Object") {
    const path = copiedNode.data.treeVars.idsArrayPath.path;
    const parentId = treeEl.value.getCurrentKey();
    addToParentIdsArray(newObjId, parentId, path);
  }
};

const onCtrlCut = async () => {
  if (!treeEl.value) return;
  const currentKey = treeEl.value.getCurrentKey();
  if (!currentKey) return;
  const currentNode = treeEl.value.getNode(currentKey);
  copiedNodeId = currentKey;

  if (currentNode.data.treeVars.selector === "Context Object") {
    const idToRemove = currentKey;
    const parentId = currentNode.parent.data._id;
    const path = currentNode.data.treeVars.idsArrayPath.path;
    await cutFromParentIdsArray(idToRemove, parentId, path);
  }
};

const onDelete = async () => {
  if (!treeEl.value) return;
  const currentKey = treeEl.value.getCurrentKey();
  if (!currentKey) return;
  const currentNode = treeEl.value.getNode(currentKey);

  const messageBox = await ElMessageBox.confirm(
    `Permanently delete ${currentNode.data.label}?`,
    "Warning",
    {
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      type: "warning",
    }
  );
  if (messageBox === "confirm") {
    if (currentNode.data.treeVars.selector === "Context Object") {
      const idToRemove = currentKey;
      const parentId = currentNode.parent.data._id;
      const path = currentNode.data.treeVars.idsArrayPath.path;
      await cutFromParentIdsArray(idToRemove, parentId, path);
    }
    db.state.delete(currentKey);

    ElMessage({
      type: "success",
      message: "Delete completed",
    });
  }
};
const addToParentIdsArray = async (
  idToAdd: string,
  parentId: string,
  path: string,
  dropType?: string,
  dropNodeId?: string
) => {
  // Get the path that we will be using to update
  let valuePath = path;
  const pathLength = path.length - 3;
  if (path.substr(pathLength) === "[*]") valuePath = path.substr(0, path.length - 3);

  // get the new parent object based on parentId
  const parentObj = await db.state.get(parentId);

  // apply the path to get the ids array
  const newIdsArr = jp.query(parentObj, path);

  if (dropType === "before") {
    const beforeIdx = newIdsArr.indexOf(dropNodeId);
    newIdsArr.splice(beforeIdx - 1, 0, idToAdd);
  } else if (dropType === "after") {
    const beforeIdx = newIdsArr.indexOf(dropNodeId);
    newIdsArr.splice(beforeIdx, 0, idToAdd);
  } else newIdsArr.push(idToAdd); // add id to ids array, at the end

  // update the parentObj ids array with the longer array
  jp.value(parentObj, valuePath, newIdsArr);
  db.state.update(parentObj._id, parentObj);
};

const cutFromParentIdsArray = async (
  idToRemove: string,
  parentId: string,
  path: string
) => {
  // Get the path that we will be using to update
  let valuePath = path;
  const pathLength = path.length - 3;
  if (path.substr(pathLength) === "[*]") valuePath = path.substr(0, path.length - 3);

  // get the new parent object based on parentId
  const parentObj = await db.state.get(parentId);

  // apply the path to get the ids array
  const newIdsArr = jp.query(parentObj, path);
  const curIdx = newIdsArr.indexOf(idToRemove);
  newIdsArr.splice(curIdx, 1);

  // update the parentObj ids array with the longer array
  jp.value(parentObj, valuePath, newIdsArr);
  db.state.update(parentObj._id, parentObj);
};
const options = {
  items: [
    {
      label: "Cut",
      onClick: onCtrlCut,
    },
    {
      label: "Copy",
      onClick: onCtrlCopy,
    },
    {
      label: "Paste",
      onClick: onCtrlPaste,
    },
    {
      label: "Add New...",
      icon: "icon-print",
      disabled: true,
    },
    {
      label: "Associate With..",
      icon: "icon-print",
      disabled: true,
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
let draggingNodeParentId: string = "";
const handleDragStart = (node, evt) => {
  // we have to capture the draggingNode parent here because it disapears lateron
  draggingNodeParentId = node.parent.data._id;
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
    const idToRemove = draggingNode.data._id;
    const parentId = draggingNodeParentId;
    const path = dropNode.data.treeVars.idsArrayPath.path;
    await cutFromParentIdsArray(idToRemove, parentId, path);

    if (dropType === "inner") {
      const idToAdd = draggingNode.data._id;
      const parentId = dropNode.data._id;
      addToParentIdsArray(idToAdd, parentId, path);
    } else {
      // dropType before and after have a different parentId and need a dropNodeId
      const idToAdd = draggingNode.data._id;
      const parentId = dropNode.parent.data._id;
      const dropNodeId = dropNode.data._id;
      addToParentIdsArray(idToAdd, parentId, path, dropType, dropNodeId);
    }
  } else if (draggingNodeObj.data.treeVars.selector === "Where Clause") {
    const newParentId = dropNode.data._id;

    const draggingNodeObj = await db.state.get(draggingNode.data._id);

    // update the foreign key
    const whereObj = draggingNodeObj.data.treeVars.whereObj;
    for (const key in whereObj) {
      const value = whereObj[key];
      if (value === "$fk") draggingNodeObj[key] = newParentId;
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
    @keyup.ctrl.c="onCtrlCopy"
    @keyup.ctrl.v="onCtrlPaste"
    @keyup.ctrl.x="onCtrlCut"
    @keyup.delete="onDelete"
    @node-contextmenu="onContextMenu"
    @node-expand="handleNodeExpandColapse"
    @node-collapse="handleNodeExpandColapse"
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
img {
  height: 20px;
  width: 20px;
}
</style>
