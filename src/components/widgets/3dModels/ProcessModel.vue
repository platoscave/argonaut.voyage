<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
// import PropositionObject3d from "./diagramObj3ds/propositionObj3d";
// import ProcessObject3d from "./diagramObj3ds/processObj3d.js";
// import OrgObject3d from "./diagramObj3ds/orgObj3d.js";
// import UserObject3d from "./diagramObj3ds/userObj3d.js";
import { useScene } from "~/composables/useScene";
import { useHashDissect } from "~/composables/useHashDissect";
import { ElMessage } from "element-plus";

const props = defineProps({
  hashLevel: Number,
  viewId: String,
});

const skyboxArray = [
  "islands/skybox_e.jpg",
  "islands/skybox_w.jpg",
  "islands/skybox_t.jpg",
  "islands/skybox_b.jpg",
  "islands/skybox_n.jpg",
  "islands/skybox_s.jpg",
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

const drawPropositions = async (zPos) => {
  // Get the processes from the store
  // Owned Processes Query

  let resArr = await argoQuery
    .executeQuery("f41heqslym5e", {
      _id: this.selectedObjId,
    })
    .pipe(take(1))
    .toPromise();

  // Create the PropositionObject3d (extends Object3d)
  let propositionsArr = [];
  let xPos = resArr.length * -WIDTH;
  resArr.forEach((item) => {
    let propositionObj3d = new PropositionObject3d(item, true);
    propositionObj3d.translateX(xPos);
    propositionObj3d.translateZ(zPos);
    propositionsArr.push(propositionObj3d);
    this.glModelObject3D.add(propositionObj3d);
    this.selectableMeshArr.push(propositionObj3d.children[0]);

    xPos += WIDTH * 2;
  });

  return propositionsArr;
};

const drawProcesses = async (zPos) => {
  // Get the processes from the store
  let resArr = await argoQuery
    .executeQuery("sfmg5u3wtpds", {
      // Owned Processes Query
      _id: this.selectedObjId,
    })
    .pipe(take(1))
    .toPromise();

  // Create the ProcessObject3ds (extends Object3d)
  let processArr = [];
  resArr.forEach((item) => {
    let processObj3d = new ProcessObject3d(item, true);
    processObj3d.translateZ(zPos);
    processArr.push(processObj3d);
    this.glModelObject3D.add(processObj3d);
    this.selectableMeshArr.push(processObj3d.children[0]);
  });

  // Tell processes to draw the first step, which will then draw their next steps
  let promisesArr = [];
  processArr.forEach((processObj3d) => {
    promisesArr.push(
      processObj3d.drawSteps(this.selectableMeshArr, this.glModelObject3D)
    );
  });
  await Promise.all(promisesArr);

  // Set the Y positions of the steps
  let maxXArr = [];
  let totalWidth = 0;
  processArr.forEach((processObj3d) => {
    let maxXYVec = processObj3d.setPositionY();
    maxXArr.push(maxXYVec.x);
    totalWidth += maxXYVec.x;
  });

  // Arrange Processes side by side, now that we know how wide they are
  let xPos = -totalWidth / 2;
  processArr.forEach((processObj3d, idx) => {
    processObj3d.translateX(xPos);
    xPos += maxXArr[idx] + maxXArr[idx + 1] / 2 + WIDTH * 4;
  });

  // Draw the end states
  processArr.forEach((processObj3d, idx) => {
    processObj3d.drawEndStates(maxXArr[idx]);
  });

  // Important! Must update world matrixes, after you change positions, otherwise obj3d matrixes will be incorrect
  this.glModelObject3D.updateMatrixWorld(true);

  // Let the steps to draw their connectors to their next steps
  processArr.forEach((processObj3d) => {
    processObj3d.drawStepConnectors(this.glModelObject3D);
  });

  return processArr;
};

const drawPropositionToProcessConnectors = (propositionArr) => {
  // Let the Propositions to draw their connectors to their Process
  propositionArr.forEach((propositionObj3d) => {
    propositionObj3d.drawPropositionToProcessConnectors(this.glModelObject3D);
  });
};

const drawOrgUnits = async (zPos) => {
  // Execute the Organization Query
  let resArr = await argoQuery
    .executeQuery("vbinebvkz1sq", {
      _id: this.selectedObjId,
    })
    .pipe(take(1))
    .toPromise();

  // Create the OrgObject3d (extends Object3d)
  let rootOrgObj3d = new OrgObject3d(resArr[0], true);
  rootOrgObj3d.translateZ(zPos);
  this.glModelObject3D.add(rootOrgObj3d);
  this.selectableMeshArr.push(rootOrgObj3d.children[0]);

  // Tell root class to draw the organizational units
  await rootOrgObj3d.drawOrgUnits(this.selectableMeshArr);

  // Set the x positions
  const childrenMaxX = rootOrgObj3d.setPositionX(0);
  rootOrgObj3d.translateX(-childrenMaxX / 2); // move route obj to the center

  // important! after you set positions, otherwise obj3d matrixes will be incorrect
  this.glModelObject3D.updateMatrixWorld(true);

  //rootOrgObj3d.drawClassAssocs(this.glModelObject3D);

  // Tell root org and its oug units to collect it's active permission userIds
  let activePermAccArr = [];
  await rootOrgObj3d.getActivePermissionedAccounts(
    this.selectableMeshArr,
    argoQuery.executeQuery,
    "1dbriehwtyyp",
    activePermAccArr
  );

  // Create the userObj3d
  let xPos = (-(activePermAccArr.length - 1) * WIDTH * 2) / 2;
  activePermAccArr.forEach((item) => {
    // Create the UserObject3d (extends Object3d)
    let userObj3d = new UserObject3d(item);
    this.glModelObject3D.add(userObj3d);
    this.selectableMeshArr.push(userObj3d.children[0]);
    userObj3d.translateX(xPos);
    userObj3d.translateZ(zPos - DEPTH * 10);
    userObj3d.translateY(HEIGHT * 4);
    xPos += WIDTH * 2;
  });

  // important! after you set positions, otherwise obj3d matrixes will be incorrect
  this.glModelObject3D.updateMatrixWorld(true);

  rootOrgObj3d.drawToUserAssocs(this.glModelObject3D);
};

const drawStepToUserConnectors = (processArr) => {
  // Let the steps to draw their connectors to their next steps
  processArr.forEach((processObj3d) => {
    processObj3d.drawStepToUserConnectors(this.glModelObject3D);
  });
};

onMounted(async () => {
  try {
    loadingText("Loading...");

    // const propositionsArr = await drawPropositions(0);
    // const processArr = await drawProcesses(-DEPTH * 30);
    // drawPropositionToProcessConnectors(propositionsArr);
    // await drawOrgUnits(-DEPTH * 60);
    // drawStepToUserConnectors(processArr);

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
    <el-button
      class="fab"
      icon="el-icon-refresh"
      circle
      @click="autoRotate = !autoRotate"
    ></el-button>
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
