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
import ClassObject3d from "../../lib/classObject3d.js";
import PoucdbServices from "../../services/pouchdbServices"
import SceneMixin from "../../lib/sceneMixin.js";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-class-model",
  mixins: [SceneMixin, WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      skyboxArray: [
        "milkyway/posx.jpg",
        "milkyway/negx.jpg",
        "milkyway/posy.jpg",
        "milkyway/negy.jpg",
        "milkyway/posz.jpg",
        "milkyway/negz.jpg",
      ]
    }
  },
  methods: {
    
    // Tell the root class to draw itself, and each of it's subclasses, recursivily
    async drawClasses() {
      // Get the root class from the store

      // Get the viewObj
      const viewObj = await this.$pouch.get(this.viewId);

      // Execute the query
      let resArr = await PoucdbServices.executeQuery(viewObj.queryId);

      // Create the ClassObject3d (extends Object3d)
      let rootClassObj3d = new ClassObject3d(resArr[0], true);
      this.glModelObject3D.add(rootClassObj3d);
      this.selectableMeshArr.push(rootClassObj3d.children[0]);

      // Tell root class to draw the subclasses
      await rootClassObj3d.drawSubclasses(
        this.selectableMeshArr,
        PoucdbServices.executeQuery,
        '2jfs4is4icct'
      );

      // Set the x positions
      const clidrenMaxX = rootClassObj3d.setPositionX(0);
      rootClassObj3d.translateX(-clidrenMaxX / 2); // move route obj to the center

      // important! after you set positions, otherwise obj3d matrixes will be incorrect
      this.glModelObject3D.updateMatrixWorld(true);

      rootClassObj3d.drawClassAssocs(this.glModelObject3D);

      // Tell root class and its subclasses to draw the objects
      await rootClassObj3d.drawObjects(
        this.selectableMeshArr,
        PoucdbServices.executeQuery,
        'x1lrv2xdq2tu'
      );

      // important! after you set positions, otherwise obj3d matrixes will be incorrect
      this.glModelObject3D.updateMatrixWorld(true);

      rootClassObj3d.drawObjectAssocs(this.glModelObject3D);

      return rootClassObj3d;
    },
  },

  mounted: async function () {
    // If we've been here before, assume no redraw nessesary
    //if(this.glScene) return

    this.addLoadingText();

    try {
      await this.drawClasses();

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