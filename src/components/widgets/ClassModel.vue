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
import * as THREE from "three";
import Scene from "../../lib/sceneMixin.js";
import ClassObject3d from "../../lib/classObject3d.js";

const WIDTH = 400;
const HEIGHT = 200;

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
    async collectAndDrawClasses(placeholderObj3d, userData) {

      // Create the ClassObject3d (extends Object3d)
      let rootClassObj3d = new ClassObject3d(userData, 0, this.selectableMeshArr);
      placeholderObj3d.add(rootClassObj3d);
      this.selectableMeshArr.push(rootClassObj3d.children[0]);

      const queryObj = await this.$pouch.get('2jfs4is4icct') // Get the subclasses queryObj
      await rootClassObj3d.drawChildren(this.selectableMeshArr, queryObj, this.$pouch)

      rootClassObj3d.setPositionX(0) 

      return rootClassObj3d;
    },
    collectAndDrawObjects(placeholderObj3d, classObj3d) {
      let queryObj = {
        query: {
          sortBy: "name",
          where: [
            {
              docProp: "classId",
              operator: "eq",
              value: classObj3d.key,
            },
          ],
        },
      };
      return this.$store.dispatch("query", queryObj).then((resultsArr) => {
        classObj3d.userData.resultsArr = resultsArr; // TODO not needed?
        classObj3d.instancesObj3d = [];
        let z = classObj3d.position.z + WIDTH * 4;
        resultsArr.forEach((objectObj) => {
          let objectObj3d = new ClassObject3d(objectObj, this.font);
          objectObj3d.position.set(
            classObj3d.position.x,
            classObj3d.position.y,
            z
          );
          objectObj3d.rotateY(Math.PI * 0.5);
          placeholderObj3d.add(objectObj3d);
          this.selectableMeshArr.push(objectObj3d.children[0]);
          classObj3d.instancesObj3d.push(objectObj3d);
          z += WIDTH * 2;
        });

        if (resultsArr.length > 0)
          classObj3d.drawObjectToClassBeam(
            (resultsArr.length - 1) * WIDTH * 2 + WIDTH * 4
          );

        let promises = [];
        classObj3d.subclassesObj3ds.forEach((subClassObj3d) => {
          promises.push(
            this.collectAndDrawObjects(placeholderObj3d, subClassObj3d)
          );
        });
        return Promise.all(promises);
      });
    },
    /**
     * Recusrive function to traverse the class hierarchy using the subclassesObj3ds array.
     * On the current class, set the x value, then iterate the subclasses
     * Call ourselves on each of these subclasses.
     * The x and max x returned from the subcalsses, is used to center our class
     * The max x returned from the subcalsses, is also used to ensure the next class is positioned beyond it,
     * so that it has enough room for it's subclasses
     *
     * @param {ClassObject3d} classObj3d - An object3d instance. The current class.
     * @param {number} x - the x value that represents the minimum x for this class.
     * @return {number} - the hightest x value used sofar.
     */
    setPositionX(classObj3d, x) {
      let minX = x;
      let maxX = x;
      classObj3d.subclassesObj3ds.forEach((subClassObj3d) => {
        maxX = Math.max(x, this.setPositionX(subClassObj3d, x));
        x = maxX + WIDTH * 2;
      });
      let subclassesLength = classObj3d.subclassesObj3ds.length;
      /* if (subclassesLength > 0) {
        let lastSubclassPosX = classObj3d.subclassesObj3ds[subclassesLength - 1].position.x
        classObj3d.position.setX(minX + (lastSubclassPosX - minX) / 2)
      } */
      classObj3d.position.setX(minX + (maxX - minX) / 2);
      return maxX;
    },

    /**
     * Recusrive function to traverse the class hierarchy using the subclassesObj3ds array.
     * On each of these classes, set the y value, then iterate the subclasses
     * Call ourselves on each of these subclasses.
     *
     * @param {ClassObject3d} classObj3d - An object3d instance. The current class.
     * @param {number} y - the y value that this class will be positioned at.
     * @return {number} - the lowest y value used sofar (not actually used yet).
     */
    setPositionY(classObj3d, y) {
      classObj3d.position.setY(y);
      let minY = y;
      classObj3d.subclassesObj3ds.forEach((subClassObj3d) => {
        minY = Math.min(y, this.setPositionY(subClassObj3d, y - HEIGHT * 4));
      });
      return minY;
    },

    /**
     * Recusrive function to traverse the class hierarchy using the subclassesObj3ds array.
     * On each of these classes, iterate over its instances using the instancesObj3d array.
     * Call drawObjectAssocs on each of these instances.
     *
     * @param {ClassObject3d} placeholderObj3d - An object3d instance. Used to find associated objects by key.
     * @param {ClassObject3d} classObj3d - An object3d instance. The current class
     */
    drawObjectAssocs(placeholderObj3d, classObj3d) {
      classObj3d.subclassesObj3ds.forEach((subClassObj3d) => {
        subClassObj3d.instancesObj3d.forEach((instanceObj3d) => {
          instanceObj3d.drawObjectAssocs(placeholderObj3d);
        });
        this.drawObjectAssocs(placeholderObj3d, subClassObj3d);
      });
    },

    /**
     * Recusrive function to traverse the class hierarchy using the subclassesObj3ds array.
     *
     * @param {ClassObject3d} placeholderObj3d - An object3d instance. Used to find associated objects by key.
     * @param {ClassObject3d} classObj3d - An object3d instance. The current class
     */
    drawClassAssocs(placeholderObj3d, classObj3d) {
      classObj3d.subclassesObj3ds.forEach((subClassObj3d) => {
        subClassObj3d.drawClassAssocs(placeholderObj3d);
        this.drawClassAssocs(placeholderObj3d, subClassObj3d);
      });
    },
  },

  mounted: async function () {
    this.addLoadingText();

    // placeholderObj3d holds all of our 3d objects. Mostly used for lookup by key.
    let placeholderObj3d = new THREE.Object3D();
    this.glModelObject3D.add(placeholderObj3d);

    // Get the root class from the store
    try {
      // Get the viewObj
      const viewObj = await this.$pouch.get(this.viewId);
      // Get the queryObj
      let queryObj = await this.$pouch.get(viewObj.queryId);
      // Replace variables in the mongoQuery
      let selector = queryObj.mongoQuery.selector;
      for (var key in selector) {
        let cond = selector[key];
        if (cond === "$fk") selector[key] = this.selectedObjId;
      }
      // Execute the mongoQuery
      const result = await this.$pouch.find(queryObj.mongoQuery);
      let rootClass = result.docs[0];
      let userData = {
        _id: rootClass._id,
        label: rootClass.title ? rootClass.title : rootClass.name,
        subQueryIds: queryObj.subQueryIds,
        pageId: rootClass.pageId ? rootClass.pageId : queryObj.pageId,
        docType: rootClass.docType,
      };

      // Tell the root class to draw itself, and each of it's subclasses, recursivily
      let rootClassObj3d = await this.collectAndDrawClasses(
        placeholderObj3d,
        userData
      );

      rootClassObj3d.subclassesObj3ds = [];
      // Position the classes
      let maxX = this.setPositionX(rootClassObj3d, 0);
      this.setPositionY(rootClassObj3d, 0);

      // Shift placeholder to the left so that the root is at the center of the universe
      placeholderObj3d.position.setX(-maxX / 2);
      placeholderObj3d.updateMatrixWorld(true);

      rootClassObj3d.drawClassBeams();

      this.drawClassAssocs(placeholderObj3d, rootClassObj3d);

      // Tell the root class and each of it's subclasses to draw its objects, recursivily
      //      await this.collectAndDrawObjects(placeholderObj3d, rootClassObj3d);
      placeholderObj3d.updateMatrixWorld(true);

      // TODO takes awhile. find a way to filter.
      this.drawObjectAssocs(placeholderObj3d, rootClassObj3d);

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