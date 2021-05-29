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
import OrgObject3d from "../../lib/orgObject3d.js";
import UserObject3d from "../../lib/userObject3d.js";
import PoucdbServices from "../../services/pouchdbServices";
import SceneMixin from "../../lib/sceneMixin.js";
import WidgetMixin from "../../lib/widgetMixin";

// eslint-disable-next-line no-unused-vars
const WIDTH = 400, HEIGHT = 200, DEPTH = 100, RADIUS = 50

export default {
  name: "ar-organization-model",
  mixins: [SceneMixin, WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      skyboxArray: [
        "grass/sbox_px.jpg",
        "grass/sbox_nx.jpg",
        "grass/sbox_py.jpg",
        "grass/sbox_ny.jpg",
        "grass/sbox_pz.jpg",
        "grass/sbox_nz.jpg",
      ],
    };
  },
  methods: {
    // Tell the root class to draw itself, and each of it's subclasses, recursivily
    async drawOrganization() {
      // Get the root organization from the store

      // Get the viewObj
      const viewObj = await this.$pouch.get(this.viewId);

      // Execute the query
      let resArr = await PoucdbServices.executeQuery(viewObj.queryId, {
        _id: this.selectedObjId,
      });

      // Create the OrgObject3d (extends Object3d)
      let rootOrgObj3d = new OrgObject3d(resArr[0], true);
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
        userObj3d.translateZ(-DEPTH * 4);
        userObj3d.translateY(HEIGHT * 2);
        xPos += WIDTH * 2
      });

      // important! after you set positions, otherwise obj3d matrixes will be incorrect
      this.glModelObject3D.updateMatrixWorld(true);

      rootOrgObj3d.drawToUserAssocs(this.glModelObject3D);

      return rootOrgObj3d;
    },
  },

  mounted: async function () {
    // If we've been here before, assume no redraw nessesary
    //if(this.glScene) return

    this.addLoadingText();

    try {
      await this.drawOrganization();

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