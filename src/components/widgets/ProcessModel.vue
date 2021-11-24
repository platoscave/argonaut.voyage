<template>
  <div>
    <el-button
      class="fab"
      icon="el-icon-refresh"
      circle
      @click="onOrbit"
    ></el-button>
  </div>
</template>

<script>
import ProcessObject3d from "./3dDiagrams/processObject3d.js";
import OrgObject3d from "./3dDiagrams/orgObject3d.js";
import UserObject3d from "./3dDiagrams/userObject3d.js";
import PoucdbServices from "../../services/pouchdbServices";
import SceneMixin from "../../lib/sceneMixin.js";
import WidgetMixin from "../../lib/widgetMixin";

// eslint-disable-next-line no-unused-vars
const HEIGHT = 200,
  WIDTH = 400,
  DEPTH = 100;

export default {
  name: "ar-process-model",
  mixins: [SceneMixin, WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      skyboxArray: [
        "islands/skybox_e.jpg",
        "islands/skybox_w.jpg",
        "islands/skybox_t.jpg",
        "islands/skybox_b.jpg",
        "islands/skybox_n.jpg",
        "islands/skybox_s.jpg",
      ],
    };
  },
  methods: {
    async drawPropositions( zPos ) {

    },
    async drawProcesses( zPos ) {

      // Get the viewObj so we can use its query
      const viewObj = await this.$pouch.get(this.viewId);

      // Get the processes from the store
      let resArr = await PoucdbServices.executeQuery(viewObj.queryId, {
        _id: this.selectedObjId,
      });

      // Create the ProcessObject3ds (extends Object3d)
      let processArr = [];
      resArr.forEach((item) => {
        let rootProcessObj3d = new ProcessObject3d(item, true);
        rootProcessObj3d.translateZ( zPos);
        processArr.push(rootProcessObj3d);
        this.glModelObject3D.add(rootProcessObj3d);
        this.selectableMeshArr.push(rootProcessObj3d.children[0]);
      });

      // Tell processes to draw the first step, which will then draw their next steps
      let promisesArr = [];
      processArr.forEach((rootProcessObj3d) => {
        promisesArr.push(
          rootProcessObj3d.drawSteps(
            this.selectableMeshArr,
            PoucdbServices.executeQuery,
            this.glModelObject3D,
            "aiw54neadp14" // First step queryId
          )
        );
      });
      await Promise.all(promisesArr);

      // Set the Y positions of the steps
      let maxXArr = [];
      let totalWidth = 0;
      processArr.forEach((rootProcessObj3d) => {
        let maxXYVec = rootProcessObj3d.setPositionY();
        maxXArr.push(maxXYVec.x);
        totalWidth += maxXYVec.x;
      });

      // Arrange Processes side by side, now that we know how wide they are
      let xPos = -totalWidth / 2;
      processArr.forEach((rootProcessObj3d, idx) => {
        rootProcessObj3d.translateX(xPos);
        xPos += maxXArr[idx] + maxXArr[idx + 1] / 2 + WIDTH * 4;
      });

      // Draw the end states
      processArr.forEach((rootProcessObj3d, idx) => {
        rootProcessObj3d.drawEndStates(maxXArr[idx]);
      });

      // Important! Must update world matrixes, after you change positions, otherwise obj3d matrixes will be incorrect
      this.glModelObject3D.updateMatrixWorld(true);

      // Let the steps draaw their connectors
      processArr.forEach((rootProcessObj3d) => {
        rootProcessObj3d.drawStepConnectors(this.glModelObject3D);
      });
    },


    async drawOrgUnits( zPos ) {

      // Execute the Organization Query
      let resArr = await PoucdbServices.executeQuery('vbinebvkz1sq', {
        _id: this.selectedObjId,
      });

      // Create the OrgObject3d (extends Object3d)
      let rootOrgObj3d = new OrgObject3d(resArr[0], true);
      rootOrgObj3d.translateZ( zPos);
      this.glModelObject3D.add(rootOrgObj3d);
      this.selectableMeshArr.push(rootOrgObj3d.children[0]);

      // Tell root class to draw the organizational units
      await rootOrgObj3d.drawOrgUnits(
        this.selectableMeshArr,
        PoucdbServices.executeQuery,
        "o4jhldcqvbep"
      );

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
        PoucdbServices.executeQuery,
        "1dbriehwtyyp",
        activePermAccArr
      );

      // Create the userObj3d
      let xPos = -(activePermAccArr.length - 1) * WIDTH * 2 / 2
      activePermAccArr.forEach((item) => {
        // Create the UserObject3d (extends Object3d)
        let userObj3d = new UserObject3d(item);
        this.glModelObject3D.add(userObj3d);
        this.selectableMeshArr.push(userObj3d.children[0]);
        userObj3d.translateX(xPos);
        userObj3d.translateZ(zPos -DEPTH * 10);
        userObj3d.translateY(HEIGHT * 4);
        xPos += WIDTH * 2
      });

      // important! after you set positions, otherwise obj3d matrixes will be incorrect
      this.glModelObject3D.updateMatrixWorld(true);

      rootOrgObj3d.drawToUserAssocs(this.glModelObject3D);
    },

  },

  mounted: async function() {

    try {
      this.addLoadingText();
      

      await this.drawPropositions(0);

      await this.drawProcesses( -DEPTH * 30 );

      await this.drawOrgUnits( -DEPTH * 60 );


      this.removeLoadingText();

      if (this.nextLevelSelectedObjId) {
        this.highlight(this.nextLevelSelectedObjId);
        this.moveCameraToPos(this.nextLevelSelectedObjId);
      }
    } catch (err) {
      this.removeLoadingText();

      console.error(err);
      this.$message({ message: err, type: "error" });
    }
  },
};
</script>

<style scoped>
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
