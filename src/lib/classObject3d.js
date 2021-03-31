/* eslint-disable no-unused-vars */
import * as THREE from 'three'
import classModelColors from '../config/classModelColors'
import object3dMixin from '../lib/object3dMixin'

const WIDTH = 400, HEIGHT = 200, DEPTH = 100, RADIUS = 50

export default class ClassObject3d extends THREE.Object3D {
  constructor(userData, yPos, selectableMeshArr) {
    super()
    Object.assign(this, object3dMixin);

    this._id = userData._id
    this.name = userData.label
    this.userData = userData

    let classMesh = this.getMeshForDocType(userData.docType)
    classMesh.name = userData.label + ' - 3d mesh'
    this.add(classMesh)
    selectableMeshArr.push(classMesh)

    let textPosition = new THREE.Vector3(0, 0, DEPTH * 0.6)
    this.addTextMesh(this.name, textPosition)


    // Draw up beam from here to middle
    if (yPos !== 0) {
      let points = []
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, HEIGHT * 2, 0))
      this.add(this.drawBeam(points, 'classConnectors'))
    }

    this.position.setY(yPos);

    //console.log('    ', this._id, this.name, yPos)

  }

  async drawSubclasses(selectableMeshArr, queryObj, pouch) {

    // Create a deep clone of the queryObj to operate on
    let queryObjClone = JSON.parse(JSON.stringify(queryObj))

    // Replace variables in the mongoQuery
    let selector = queryObjClone.mongoQuery.selector
    for (var key in selector) {
      let cond = selector[key];
      if (cond === "$fk") selector[key] = this.userData._id;
    }
    delete queryObjClone.mongoQuery.sort; // temp hack: https://github.com/pouchdb/pouchdb/issues/6399

    // Execute the mongoQuery
    const result = await pouch.find(queryObjClone.mongoQuery);

    // Collect userData for use durring creation
    const userDataArr = result.docs.map((item) => {
      let assocs = []
      for (let key in item.properties) {
        const prop = item.properties[key]
        if (prop.mongoQuery) assocs.push({ name: key, destId: prop.mongoQuery.selector.classId })
      }
      return {
        _id: item._id,
        label: item.title ? item.title : item.name,
        subQueryIds: queryObjClone.subQueryIds,
        pageId: item.pageId ? item.pageId : queryObjClone.pageId,
        docType: item.docType,
        assocs: assocs
      };
    });

    // If this class has children, draw down beam from here to middle
    if (userDataArr.length) {
      let points = []
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, -HEIGHT * 2, 0))
      this.add(this.drawBeam(points, 'classConnectors'))
    }

    let childrenPronmises = []
    userDataArr.forEach(userData => {

      // Create the child
      let classObj3d = new ClassObject3d(userData, -HEIGHT * 4, selectableMeshArr);
      this.add(classObj3d)

      // Tell the child to draw its children
      if (classObj3d._id !== '5jdnjqxsqmgn') // skip everything under Balance Sheet
        childrenPronmises.push(classObj3d.drawSubclasses(selectableMeshArr, queryObj, pouch))
    })


    return Promise.all(childrenPronmises);

  }

  setPositionX(xPos) {

    this.translateX(xPos)

    // Position the children.
    // The child x position is relative to this, so we start with 0
    let childX = 0, childrenMaxX = 0
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        childrenMaxX = subClassObj3d.setPositionX(childX)
        childX = childrenMaxX + WIDTH * 2
      }
    });

    // Shift all the children to the left by 50%
    const leftShift = (childrenMaxX) / 2
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        subClassObj3d.translateX(-leftShift)
      }
    });
    // Shift this to the right by the same value
    this.translateX(leftShift)

    // Find the first and last children x values after left shift
    let firstX = -1, lastX = -1
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        if (firstX === -1) firstX = subClassObj3d.position.x
        lastX = subClassObj3d.position.x
      }
    });

    // Draw the horizontal beam, based on the positions of the first and last child
    if (firstX !== -1) {
      let points = []
      points.push(new THREE.Vector3(firstX, -HEIGHT * 2, 0))
      points.push(new THREE.Vector3(lastX, -HEIGHT * 2, 0))
      this.add(this.drawBeam(points, 'classConnectors'))
    }

    // return the original x plus our children max, so that the parent can center itself
    return xPos + childrenMaxX
  }

  drawClassAssocs(glModelObject3D) {

    for (let key in this.userData.assocs) {

      const assoc = this.userData.assocs[key]

      const { [assoc.name]: assocProps } = classModelColors
      if (!assocProps) continue
      const depth = - ( DEPTH * 2 + assocProps.depth * DEPTH / 2 )

      const destObj3d = glModelObject3D.getObjectByProperty('_id', assoc.destId)
      if (!destObj3d) console.log('Assoc destination not found: ' + assoc)
      if (!destObj3d) continue

      // Get positions in world coordinates
      let sourcePos = new THREE.Vector3()
      this.getWorldPosition(sourcePos)
      let destPos = new THREE.Vector3()
      destObj3d.getWorldPosition(destPos)

      // Get the difference vector
      let difVec = destPos.clone()
      difVec.sub(sourcePos)

      const sourceBack = this.getSidePos('back', new THREE.Vector3())
      const destBack = this.getSidePos('back', difVec)

      let points = []
      points.push(sourceBack) // move startpoint to the edge
      points.push(new THREE.Vector3(0, 0, depth))
      let beforeLastPos = destBack.clone()
      beforeLastPos.z = depth
      points.push(beforeLastPos)
      points.push(destBack)

      this.add(this.drawTube(points, assoc.name, assoc.name, true))

    }
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        subClassObj3d.drawClassAssocs(glModelObject3D)
      }
    });

  }


  async drawObjects(selectableMeshArr, queryObj, pouch) {

    // Create a deep clone of the queryObj to operate on
    let queryObjClone = JSON.parse(JSON.stringify(queryObj))

    // Replace variables in the mongoQuery
    let selector = queryObjClone.mongoQuery.selector
    for (var key in selector) {
      let cond = selector[key];
      if (cond === "$fk") selector[key] = this.userData._id;
    }
    delete queryObjClone.mongoQuery.sort; // temp hack: https://github.com/pouchdb/pouchdb/issues/6399

    // Execute the mongoQuery
    const result = await pouch.find(queryObjClone.mongoQuery);

    // Collect userData for use durring creation
    const userDataArr = result.docs.map((item) => {
      let assocs = []
      for (let key in item.properties) {
        const prop = item.properties[key]
        if (prop.mongoQuery) assocs.push({ name: key, destId: prop.mongoQuery.selector.classId })
      }
      return {
        _id: item._id,
        label: item.title ? item.title : item.name,
        subQueryIds: queryObjClone.subQueryIds,
        pageId: item.pageId ? item.pageId : queryObjClone.pageId,
        docType: item.docType,
        assocs: assocs
      };
    });



    userDataArr.forEach(userData => {

      // Create the object
      let classObj3d = new ClassObject3d(userData, -HEIGHT * 4, selectableMeshArr);
      this.add(classObj3d)

    })

    // If this class has children, draw down beam from here to middle
    if (userDataArr.length) {
      let points = []
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, -HEIGHT * 2, 0))
      this.add(this.drawBeam(points, 'classConnectors'))
    }


    let objectPronmises = []
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        //objectPronmises.push(this.drawObjects(selectableMeshArr, queryObj, pouch))
      }
    });
    return Promise.all(objectPronmises);

  }
  
}
