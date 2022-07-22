<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
//import ClassObject3d from "./diagramObj3ds/classObj3d.js";
import { useScene } from "~/composables/useScene";
import { useHashDissect } from "~/composables/useHashDissect";
import { ElMessage } from "element-plus";


const props = defineProps({
  hashLevel: Number,
  viewId: String,
});

const skyboxArray = [
  "milkyway/posx.jpg",
  "milkyway/negx.jpg",
  "milkyway/posy.jpg",
  "milkyway/negy.jpg",
  "milkyway/posz.jpg",
  "milkyway/negz.jpg",
];
const selectableMeshArr: any[] = [];
const rootEl = ref(null);
const autoRotate = ref(false);

const { selectedObjId } = useHashDissect(props.hashLevel);
const { glModelObj3d, cssModelObj3d, cursor, loadingText } = useScene(
  rootEl,
  props.hashLevel,
  skyboxArray,
  selectableMeshArr,
  autoRotate
);

// Tell the root class to draw itself, and each of it's subclasses, recursivily
const drawClasses = async () => {
  // Get the root class from the store

  // Get the viewObj
  const viewObj = await db.state.get(props.viewId);

  // Execute the query
  let resArr = await argoQuery
    .executeQuery(viewObj.queryId)
    .pipe(take(1))
    .toPromise();

  // Create the ClassObject3d (extends Object3d)
  let rootClassObj3d = new ClassObject3d(resArr[0], true);
  glModelObj3d.add(rootClassObj3d);
  selectableMeshArr.push(rootClassObj3d.children[0]);

  // Tell root class to draw the subclasses
  await rootClassObj3d.drawSubclasses(selectableMeshArr);

  // Set the x positions
  const clidrenMaxX = rootClassObj3d.setPositionX(0);
  rootClassObj3d.translateX(-clidrenMaxX / 2); // move route obj to the center

  // important! after you set positions, otherwise obj3d matrixes will be incorrect
  glModelObj3d.updateMatrixWorld(true);

  rootClassObj3d.drawClassAssocs(glModelObj3d);

  // Tell root class and its subclasses to draw the objects
  await rootClassObj3d.drawObjects(selectableMeshArr);

  // important! after you set positions, otherwise obj3d matrixes will be incorrect
  glModelObj3d.updateMatrixWorld(true);

  rootClassObj3d.drawObjectAssocs(glModelObj3d);

  return rootClassObj3d;
};

onMounted(async () => {
  loadingText("Loading...");

  try {
    // await drawClasses();
    loadingText();
  } catch (err) {
    loadingText();
    ElMessage({
      showClose: true,
      message: err,
      type: "error",
      duration: 0,
    });
    throw err;
  }
});
</script>

<template>
  <div class="fab-parent">
    <div
      class="ar-full-height"
      ref="rootEl"
      v-bind:style="{ cursor: cursor }"
    ></div>
    <ElButton
      class="fab"
      icon="el-icon-refresh"
      circle
      @click="autoRotate = !autoRotate"
    ></ElButton>
  </div>
</template>

<style scoped>
.fab-parent {
  position: relative;
  height: 100%;
}
.fab {
  position: absolute;
  margin: 10px;
  bottom: 0px;
  right: 0;
  color: #eee;
  background: #e91e63;
  z-index: 20;
}
</style>
