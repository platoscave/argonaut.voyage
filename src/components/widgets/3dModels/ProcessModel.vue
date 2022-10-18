<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
import argoQueryPromise from "~/lib/argoQueryPromise";
import AgreementObject3d from "./diagramObj3ds/agreementObj3d.js";
import PropositionObject3d from "./diagramObj3ds/propositionObj3d";
import ProcessObject3d from "./diagramObj3ds/processObj3d.js";
import OrgObject3d from "./diagramObj3ds/orgObj3d.js";
import UserObject3d from "./diagramObj3ds/userObj3d.js";
import { useThreejsScene } from "~/composables/useThreejsScene";
import { useHashDissect } from "~/composables/useHashDissect";
import { ElMessage } from "element-plus";
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"
import { Object3D, Mesh, BoxGeometry, PlaneGeometry, MeshBasicMaterial, ShapeGeometry, DoubleSide } from "three";
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { getRoundedRectShape } from "~/lib/threejsUtils"

/*
  Add .catch(error  => {throw new Error(error)} to all db.state.get
  in order to add stack to the error
*/


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

const drawAgreements = async (zPos: number) => {


  // Get the agreements
  const agreementsArr = await argoQueryPromise(
    {
      selector: "Subclasses",
      where: { classId: "i1gjptcb2skq" },
      idsArrayPath: {
        path: "$[*]._id",
        indexName: "classId"
      },
      sortBy: "name",
    },{ _id: selectedObjId.value }
  )



  // Create the AgreementObject3d (extends Object3d)
  const offset = WIDTH * agreementsArr.length - WIDTH / 2
  const agreementsObj3dArr = agreementsArr.map(( item: any, idx: number) => {
    const agreementObj3d = new AgreementObject3d(item, cssModelObj3d);
    agreementObj3d.translateX(WIDTH * 2 * idx - offset);
    agreementObj3d.translateZ(zPos);
    glModelObj3d.add(agreementObj3d);
    addSelectable(agreementObj3d.children[0])
    return agreementObj3d
  })

  return agreementsObj3dArr

}
const drawPropositions = async (zPos: number) => {

  // Owned Propositions Query
  const propositionsArr = await argoQueryPromise("f41heqslym5e", { _id: selectedObjId.value })

  // Create the PropositionObject3d (extends Object3d)
  const offset = WIDTH * 2 * propositionsArr.length / 2 - WIDTH 
  const propositionsObj3dArr = propositionsArr.map(( item: any, idx: number) => {
    const propositionObj3d = new PropositionObject3d(item, true);
    propositionObj3d.translateX(WIDTH * 2 * idx - offset);
    propositionObj3d.translateZ(zPos);
    glModelObj3d.add(propositionObj3d);
    addSelectable(propositionObj3d.children[0]);
    return propositionObj3d
  })

  // Add semi-transparent background mesh
  const backgroundMesh = getBackgroundMesh(HEIGHT * 2, WIDTH * 2 * propositionsArr.length, WIDTH / 16)
  backgroundMesh.translateZ(zPos - DEPTH);
  glModelObj3d.add(backgroundMesh);

  zPos = zPos- (DEPTH * 30)

  const processPromiseArr = propositionsArr.map((item: any) => db.state.get(item.processId))
  const processArr = await Promise.all(processPromiseArr)
  // Create the processObject3ds (extends Object3d)
  const processObj3dArr = processArr.map(( item: any, idx: number) => {
    const processObj3d = new ProcessObject3d(item, true);
    //processObj3d.translateX(propositionsArr.length * WIDTH * idx);
    processObj3d.translateZ(zPos);
    glModelObj3d.add(processObj3d);
    addSelectable(processObj3d.children[0]);
    return processObj3d
  })


  const subprocessPromiseArr = []
  propositionsArr.forEach(item => {
    if(item.subprocessId) subprocessPromiseArr.push(db.state.get(item.subprocessId))
  })

  // const subprocessPromiseArr = propositionsArr.map(
  //   (item: any) => db.state.get(item.subprocessId).catch(error  => {throw new Error(error)})
  // )
  //const subprocessPromiseArr = propositionsArr.map((item: any) => db.state.get(item.subprocessId))
  const subprocessArr = await Promise.all(subprocessPromiseArr)
  // Create the processObject3ds (extends Object3d)
  const subprocessObj3dArr = subprocessArr.map(( item: any, idx: number) => {
    const subprocessObj3d = new ProcessObject3d(item, true);
    subprocessObj3d.translateX(subprocessArr.length * WIDTH * idx);
    subprocessObj3d.translateZ(zPos);
    subprocessObj3d.translateY(-HEIGHT * 10);
    glModelObj3d.add(subprocessObj3d);
    addSelectable(subprocessObj3d.children[0]);
    return subprocessObj3d
  })

  const concatObj3dArr = processObj3dArr.concat(subprocessObj3dArr)

  // Tell processes to draw the first step, which will then draw their next steps
  const drawnStepsPromisesArr = concatObj3dArr.map(( item: any) => {
    return item.drawSteps(addSelectable, glModelObj3d)
  });
  await Promise.all(drawnStepsPromisesArr);


  // processObj3dArr

  // Set the Y positions of the steps
  let processMaxXArr = [];
  let totalWidth = 0;
  processObj3dArr.forEach((processObj3d) => {
    let maxXYVec = processObj3d.setPositionY();
    processMaxXArr.push(maxXYVec.x);
    totalWidth += maxXYVec.x;
  });

  // Arrange Processes side by side, now that we know how wide they are
  let xPos = -totalWidth / 2;
  processObj3dArr.forEach((processObj3d, idx) => {
    processObj3d.translateX(xPos);
    xPos += processMaxXArr[idx] + processMaxXArr[idx + 1] / 2 + WIDTH * 4;
  });

  // Draw the end states
  processObj3dArr.forEach((processObj3d, idx) => {
    processObj3d.drawEndStates(processMaxXArr[idx]);
  });


  // subprocessObj3dArr


  // Set the Y positions of the steps
  let maxXArr = [];
  totalWidth = 0;
  subprocessObj3dArr.forEach((processObj3d) => {
    let maxXYVec = processObj3d.setPositionY();
    maxXArr.push(maxXYVec.x);
    totalWidth += maxXYVec.x;
  });

  // Arrange Processes side by side, now that we know how wide they are
  xPos = -totalWidth / 2;
  subprocessObj3dArr.forEach((processObj3d, idx) => {
    processObj3d.translateX(xPos);
    xPos += maxXArr[idx] + maxXArr[idx + 1] / 2 + WIDTH * 4;
  });



  // both



  // Important! Must update world matrixes, after you change positions, otherwise obj3d matrixes will be incorrect
  glModelObj3d.updateMatrixWorld(true);

  // Let the steps draw their connectors to their next steps
  concatObj3dArr.forEach((processObj3d) => {
    processObj3d.drawStepConnectors(glModelObj3d);
  });

  // Let the Propositions draw their connectors to their Process
  propositionsObj3dArr.forEach((propositionObj3d) => {
    propositionObj3d.drawPropositionToProcessConnectors(glModelObj3d);
  });




  return concatObj3dArr
};

const drawOrgUnits = async (zPos) => {

  // Get the organization
  // We use argoQuery here because we want treeVars.icon
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

const drawAgreementConnectors = (agreementsObj3dArr) => {
  // Tell the steps to draw their connectors to their next steps
  agreementsObj3dArr.forEach((agreementObj3d) => {
    agreementObj3d.drawAgreementConnectors(glModelObj3d);
  });
};

const drawStepToOrgUnitConnectors = (processObj3dArr) => {
  // Tell the steps to draw their connectors to their next steps
  processObj3dArr.forEach((processObj3d) => {
    processObj3d.drawStepToOrgUnitConnectors(glModelObj3d);
  });
};

const drawUnitToUserConnectors = (rootOrgObj3d) => {
  // Let the steps to draw their connectors to their next steps
  rootOrgObj3d.drawUnitToUserConnectors(glModelObj3d);
};

const getBackgroundMesh = (height, width, radius) => {
  const shape = getRoundedRectShape(height, width, radius)
    const geometry = new ShapeGeometry(shape)
    geometry.name = "background mesh"
    geometry.center() 
    const material = new MeshBasicMaterial({ 
      color: '#eee', 
      side	: DoubleSide,
      opacity: 0.4,
      transparent: true, })
    return new Mesh(geometry, material);
}

onMounted(async () => {
  try {
    loadingText("Loading...");

    const agreementsObj3dArr = await drawAgreements(0);
    const processObj3dArr = await drawPropositions(-DEPTH * 30);
    const rootOrgObj3d = await drawOrgUnits(-DEPTH * 90);
    await drawMembers(-DEPTH * 120);
    
    drawAgreementConnectors(agreementsObj3dArr);
    drawStepToOrgUnitConnectors(processObj3dArr);
    drawUnitToUserConnectors(rootOrgObj3d);

    loadingText();
  } catch (err) {
    loadingText("");
    loadingText("Error :-(");
    ElMessage({
      showClose: true,
      message: err,
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
