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
import Scene from "../../lib/sceneMixin.js";
import ClassObject3d from "../../lib/classObject3d.js";

export default {
  name: "ar-class-model",
  mixins: [Scene],
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      // skyboxArray: ['grass/sbox_px.jpg','grass/sbox_nx.jpg','grass/sbox_py.jpg','grass/sbox_ny.jpg','grass/sbox_pz.jpg','grass/sbox_nz.jpg']
      skyboxArray: [
        "milkyway/posx.jpg",
        "milkyway/negx.jpg",
        "milkyway/posy.jpg",
        "milkyway/negy.jpg",
        "milkyway/posz.jpg",
        "milkyway/negz.jpg",
      ],
      // skyboxArray: ['jupiter/space_3_right.jpg','jupiter/space_3_left.jpg','jupiter/space_3_top.jpg','jupiter/space_3_bottom.jpg','jupiter/space_3_front.jpg','jupiter/space_3_back.jpg']
    };
  },
  methods: {
    async dawClasses() {

      // Get the root class from the store

      // Get the viewObj
      const viewObj = await this.$pouch.get(this.viewId)

      // Get the queryObj
      let queryObj = await this.$pouch.get(viewObj.queryId)

      // Replace variables in the mongoQuery
      let selector = queryObj.mongoQuery.selector
      for (var key in selector) {
        let cond = selector[key];
        if (cond === "$fk") selector[key] = this.selectedObjId
      }

      // Execute the mongoQuery
      const result = await this.$pouch.find(queryObj.mongoQuery)
      let rootClass = result.docs[0];
      let userData = {
        _id: rootClass._id,
        label: rootClass.title ? rootClass.title : rootClass.name,
        subQueryIds: queryObj.subQueryIds,
        pageId: rootClass.pageId ? rootClass.pageId : queryObj.pageId,
        docType: rootClass.docType,
      };

      // Create the ClassObject3d (extends Object3d)
      let rootClassObj3d = new ClassObject3d(userData, 0, this.selectableMeshArr);
      this.glModelObject3D.add(rootClassObj3d);
      this.selectableMeshArr.push(rootClassObj3d.children[0]);

      // Get the subclasses queryObj
      const subclassesQueryObj = await this.$pouch.get('2jfs4is4icct') 
      await rootClassObj3d.drawChildren(this.selectableMeshArr, subclassesQueryObj, this.$pouch)

      // Set the x positions
      const clidrenMaxX = rootClassObj3d.setPositionX(0) 
      rootClassObj3d.translateX(-clidrenMaxX / 2) // move route obj to the center

      // important! after you set positions, otherwise obj3d matrises will be wrong
      this.glModelObject3D.updateMatrixWorld(true) 

      rootClassObj3d.drawClassAssocs(this.glModelObject3D) 

      return rootClassObj3d;
    },
    
  },

  mounted: async function () {
    this.addLoadingText();

    try {

      // Tell the root class to draw itself, and each of it's subclasses, recursivily
      await this.dawClasses();

      this.removeLoadingText();
    } catch (err) {

      console.error(err);
      this.removeLoadingText();

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