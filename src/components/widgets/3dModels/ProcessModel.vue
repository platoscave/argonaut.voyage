<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
import argoQueryPromise from "~/lib/argoQueryPromise";
import PropositionObject3d from "./diagramObj3ds/propositionObj3d";
import ProcessObject3d from "./diagramObj3ds/processObj3d.js";
import OrgObject3d from "./diagramObj3ds/orgObj3d.js";
import UserObject3d from "./diagramObj3ds/userObj3d.js";
import { useThreejsScene } from "~/composables/useThreejsScene";
import { useHashDissect } from "~/composables/useHashDissect";
import { ElMessage } from "element-plus";
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"

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
const rootEl = ref(null);
const autoRotate = ref(false);

const { selectedObjId } = useHashDissect(props.hashLevel);
const { glModelObj3d, cssModelObj3d, cursor, addSelectable, removeSelectable, loadingText } = useThreejsScene(
  rootEl,
  props.hashLevel,
  skyboxArray,
  autoRotate
);

const drawPropositions = async (zPos) => {
  // Get the processes from the store
  // Owned Processes Query

  const resArr = await argoQueryPromise("f41heqslym5e", { _id: selectedObjId.value })


  // Create the PropositionObject3d (extends Object3d)
  let propositionsArr = [];
  let xPos = resArr.length * -WIDTH;
  resArr.forEach((item) => {
    let propositionObj3d = new PropositionObject3d(item, true);
    propositionObj3d.translateX(xPos);
    propositionObj3d.translateZ(zPos);
    propositionsArr.push(propositionObj3d);
    glModelObj3d.add(propositionObj3d);
    addSelectable(propositionObj3d.children[0]);

    xPos += WIDTH * 2;
  });

  return propositionsArr;
};

const drawProcesses = async (zPos) => {
  // Get the processes from the store
  const resArr = await argoQueryPromise("sfmg5u3wtpds", { _id: selectedObjId.value })

  // Create the ProcessObject3ds (extends Object3d)
  let processArr = [];
  resArr.forEach((item) => {
    let processObj3d = new ProcessObject3d(item, true);
    processObj3d.translateZ(zPos);
    processArr.push(processObj3d);
    glModelObj3d.add(processObj3d);
    addSelectable(processObj3d.children[0]);
  });

  // Tell processes to draw the first step, which will then draw their next steps
  let promisesArr = [];
  processArr.forEach((processObj3d) => {
    promisesArr.push(
      processObj3d.drawSteps(addSelectable, glModelObj3d)
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
  glModelObj3d.updateMatrixWorld(true);

  // Let the steps to draw their connectors to their next steps
  processArr.forEach((processObj3d) => {
    processObj3d.drawStepConnectors(glModelObj3d);
  });

  return processArr;
};

const drawPropositionToProcessConnectors = (propositionArr) => {
  // Let the Propositions to draw their connectors to their Process
  propositionArr.forEach((propositionObj3d) => {
    propositionObj3d.drawPropositionToProcessConnectors(glModelObj3d);
  });
};

const drawOrgUnits = async (zPos) => {

  // Get the organization
  //const orgObject = await db.state.get(selectedObjId.value)
  const orgObject = await argoQueryPromise(
    {
      selector: "Where Clause",
      where: { _id: "$fk" },
    },{ _id: selectedObjId.value }
  )

  // Create the OrgObject3d (extends Object3d)
  const rootOrgObj3d = new OrgObject3d(orgObject[0], true);
  rootOrgObj3d.translateZ(zPos);
  glModelObj3d.add(rootOrgObj3d);
  addSelectable(rootOrgObj3d.children[0]);

  // Tell root class to draw the organizational units
  await rootOrgObj3d.drawOrgUnits(addSelectable);

  // Set the x positions
  const childrenMaxX = rootOrgObj3d.setPositionX(0);
  rootOrgObj3d.translateX(-childrenMaxX / 2); // move route obj to the center

  // important! after you set positions, otherwise obj3d matrixes will be incorrect
  glModelObj3d.updateMatrixWorld(true);

  return rootOrgObj3d
};

const drawMembers = async (zPos) => {
  const membersArr = await argoQueryPromise("vbinebvkz1sq", { _id: selectedObjId.value })

    // Create the userObj3d
    let xPos = (-(membersArr.length - 1) * WIDTH * 2) / 2;
    membersArr.forEach((item) => {
      // Create the UserObject3d (extends Object3d)
      let userObj3d = new UserObject3d(item);
      glModelObj3d.add(userObj3d);
      addSelectable(userObj3d.children[0]);
      userObj3d.translateX(xPos);
      userObj3d.translateZ(zPos - DEPTH * 10);
      userObj3d.translateY(HEIGHT * 4);
      xPos += WIDTH * 2;
    });

  // important! after you set positions, otherwise obj3d matrixes will be incorrect
  glModelObj3d.updateMatrixWorld(true);
}

const drawStepToOrgUnitConnectors = (processArr) => {
  // Tell the steps to draw their connectors to their next steps
  processArr.forEach((processObj3d) => {
    processObj3d.drawStepToOrgUnitConnectors(glModelObj3d);
  });
};

const drawUnitToUserConnectors = (rootOrgObj3d) => {
  // Let the steps to draw their connectors to their next steps
  rootOrgObj3d.drawUnitToUserConnectors(glModelObj3d);
};

onMounted(async () => {
  try {
    loadingText("Loading...");

    const propositionsArr = await drawPropositions(0);
    const processArr = await drawProcesses(-DEPTH * 30);
    const rootOrgObj3d = await drawOrgUnits(-DEPTH * 60);
    await drawMembers(-DEPTH * 90);
    
    drawPropositionToProcessConnectors(propositionsArr);
    drawStepToOrgUnitConnectors(processArr);
    drawUnitToUserConnectors(rootOrgObj3d);

    loadingText();
  } catch (err) {
    loadingText();
    ElMessage({
      showClose: true,
      message: err.reason.message,
      type: "error",
      duration: 5000,
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
