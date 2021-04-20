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
import SceneMixin from "../../lib/sceneMixin.js";
import QueryMixin from "../../lib/queryMixin";
import WidgetMixin from "../../lib/widgetMixin";

const DEPTH = 100

export default {
  name: "ar-process-model",
  mixins: [SceneMixin, WidgetMixin, QueryMixin],
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
      ]
    }
  },
  methods: {
    // Tell the root class to draw itself, and each of it's subclasses, recursivily
    async drawProcess() {
      // Get the root class from the store

      // Get the viewObj
      const viewObj = await this.$pouch.get(this.viewId);

      // Execute the query
      let resArr = await this.getTheData(viewObj.queryId);

      // Create the ProcessObject3d (extends Object3d)
      let zPos = 0
      resArr.forEach(item =>{
        let rootProcessObj3d = new ProcessObject3d(item, true)
        rootProcessObj3d.translateZ( zPos)
        this.glModelObject3D.add(rootProcessObj3d)
        this.selectableMeshArr.push(rootProcessObj3d.children[0])
        zPos -= DEPTH * 20
      })




    


/* 
      // Tell root process to draw the subclasses
      await rootProcessObj3d.drawSubclasses(
        this.selectableMeshArr,
        this.getTheData,
        '2jfs4is4icct'
      );

      // Set the x positions
      const clidrenMaxX = rootProcessObj3d.setPositionX(0);
      rootProcessObj3d.translateX(-clidrenMaxX / 2); // move route obj to the center

      // important! after you set positions, otherwise obj3d matrixes will be incorrect
      this.glModelObject3D.updateMatrixWorld(true);

      rootProcessObj3d.drawClassAssocs(this.glModelObject3D);

      // Tell root process and its subclasses to draw the objects
      await rootProcessObj3d.drawObjects(
        this.selectableMeshArr,
        this.getTheData,
        'x1lrv2xdq2tu'
      );

      // important! after you set positions, otherwise obj3d matrixes will be incorrect
      this.glModelObject3D.updateMatrixWorld(true);

      rootProcessObj3d.drawObjectAssocs(this.glModelObject3D);
 */
       
    },
  },

  mounted: async function () {
    // If we've been here before, assume no redraw nessesary
    //if(this.glScene) return

    this.addLoadingText();

    try {
      await this.drawProcess();

      this.removeLoadingText();

      if(this.nextLevelSelectedObjId) {
        this.highlight(this.nextLevelSelectedObjId)
        this.moveCameraToPos(this.nextLevelSelectedObjId)
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