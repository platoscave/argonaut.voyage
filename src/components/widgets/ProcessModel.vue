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
import ProcessObject3d from "../../lib/processObject3d.js";
import PoucdbServices from "../../dataServices/pouchdbServices"
import SceneMixin from "../../lib/sceneMixin.js";
import WidgetMixin from "../../lib/widgetMixin";

// eslint-disable-next-line no-unused-vars
const HEIGHT = 200, DEPTH = 100;

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
    // Tell the root class to draw itself, and each of it's subclasses, recursivily
    async drawProcess() {
      // Get the root class from the store

      // Get the viewObj
      const viewObj = await this.$pouch.get(this.viewId);

      // Execute the query
      let resArr = await PoucdbServices.getTheData(viewObj.queryId, { _id: this.selectedObjId});

      // Create the ProcessObject3d (extends Object3d)
      let zPos = 0;
      let processArr = [];
      resArr.forEach((item) => {
        let rootProcessObj3d = new ProcessObject3d(item, true);
        processArr.push(rootProcessObj3d)
        rootProcessObj3d.translateZ(zPos);
        this.glModelObject3D.add(rootProcessObj3d);
        this.selectableMeshArr.push(rootProcessObj3d.children[0]);
        zPos -= DEPTH * 20;
      });

      let promisesArr = [];
      processArr.forEach((rootProcessObj3d) => {
        // Tell root process to draw the first step, and tehn it's next steps
        promisesArr.push(
          rootProcessObj3d.drawSteps(
            this.selectableMeshArr,
            PoucdbServices.getTheData,
            this.glModelObject3D,
            "aiw54neadp14" // First step queryId
          )
        );
      });
      await Promise.all(promisesArr)


      // Set the Y positions
      processArr.forEach((rootProcessObj3d) => {
        rootProcessObj3d.setPositionY()
      })

      // important! after you set positions, otherwise obj3d matrixes will be incorrect
      this.glModelObject3D.updateMatrixWorld(true);

      processArr.forEach((rootProcessObj3d) => {
        rootProcessObj3d.drawStepConnectors(this.glModelObject3D)
      })
    },

  },


  mounted: async function () {

    this.addLoadingText();

    try {
      await this.drawProcess();

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