import argoQueryPromise from "~/lib/argoQueryPromise";
import { Object3D, Vector3, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh } from 'three'
import ObjectObject3d from "./objectObj3d";
import { drawBeam, drawTube, getSidePos, getTextMesh } from "~/lib/threejsUtils"
import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"


export default class ClassObject3d extends Object3D {

  constructor(userData, isRoot) {
    super()

    this.key = userData.key
    this.name = userData.title + ' - object3d'
    this.userData = userData

    let classMesh = this.getMesh()
    classMesh.name = userData.title + ' - 3d mesh'
    this.add(classMesh)

    let textMesh = getTextMesh(userData.title)
    textMesh.translateZ(DEPTH * 0.6)
    classMesh.add(textMesh)


    // Draw up beam from here to middle if this is not the root class
    if (!isRoot) {
      let points = []
      points.push(new Vector3(0, 0, 0))
      points.push(new Vector3(0, HEIGHT * 2, 0))
      this.add(drawBeam(points, 'classConnectors'))
    }
  }

  async drawSubclasses(addSelectable) {

    // Execute the query
    const resArr = await argoQueryPromise("2jfs4is4icct", this.userData)

    // Enrich items with an array of assocs that need to be drawn
    resArr.map((item) => {
      item.assocs = []
      for (let key in item.properties) {
        const prop = item.properties[key]
        if (prop.argoQuery) item.assocs.push({ name: key, destId: prop.argoQuery.where.classId })
      }
      return item;
    })

    // If this class has children, draw down beam from here to middle
    if (resArr.length) {
      let points = []
      points.push(new Vector3(0, 0, 0))
      points.push(new Vector3(0, -HEIGHT * 2, 0))
      this.add(drawBeam(points, 'classConnectors'))
    }

    let childrenPronmises = []
    resArr.forEach(userData => {

      // Create the child
      let classObj3d = new ClassObject3d(userData)
      addSelectable(classObj3d.children[0])
      classObj3d.translateY(-HEIGHT * 4)
      this.add(classObj3d)

      // Tell the child to draw its children
      if (classObj3d.key !== '5jdnjqxsqmgn') // skip everything under Balance Sheet
        childrenPronmises.push(classObj3d.drawSubclasses(addSelectable))
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
      points.push(new Vector3(firstX, -HEIGHT * 2, 0))
      points.push(new Vector3(lastX, -HEIGHT * 2, 0))
      this.add(drawBeam(points, 'classConnectors'))
    }

    // return the original x plus our children max, so that the parent can center itself
    return xPos + childrenMaxX
  }

  drawClassAssocs(glModelObject3D) {

    for (let key in this.userData.assocs) {

      const assoc = this.userData.assocs[key]

      const depth = - DEPTH * 4

      const destObj3d = glModelObject3D.getObjectByProperty('key', assoc.destId)
      if (!destObj3d) console.log('Assoc destination not found: ' + assoc.destId)
      if (!destObj3d) continue

      // Get positions in world coordinates
      let sourcePos = new Vector3()
      this.getWorldPosition(sourcePos)
      let destPos = new Vector3()
      destObj3d.getWorldPosition(destPos)

      // Get the difference vector
      let difVec = destPos.clone()
      difVec.sub(sourcePos)

      const sourceBack = getSidePos('back', new Vector3())
      const destBack = getSidePos('back', difVec)

      let points = []
      points.push(sourceBack) // move startpoint to the edge
      points.push(new Vector3(0, 0, depth))
      let beforeLastPos = destBack.clone()
      beforeLastPos.z = depth
      points.push(beforeLastPos)
      points.push(destBack)

      this.add(drawTube(points, assoc.name, assoc.name, true))

    }
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        subClassObj3d.drawClassAssocs(glModelObject3D)
      }
    });

  }


  async drawObjects(addSelectable) {

    // Execute the query
    const resArr = await argoQueryPromise("x1lrv2xdq2tu", this.userData)


    // Create the objects
    //let objectsArr = []
    let zPos = WIDTH * 4
    resArr.forEach(userData => {
      let objectObj3d = new ObjectObject3d(userData);
      //objectsArr.push(objectObj3d)
      addSelectable(objectObj3d.children[0])
      objectObj3d.translateZ(zPos)
      this.add(objectObj3d)
      zPos += WIDTH * 2
    })

    // If this class has objects, draw beam from here to the end
    if (resArr.length) {
      let points = []
      points.push(new Vector3(0, 0, 0))
      points.push(new Vector3(0, 0, WIDTH * 2 * (resArr.length + 1)))
      let beam = drawBeam(points, 'classConnectors')
      beam.translateY(-HEIGHT / 4)
      this.add(beam)
    }


    let objectPronmises = []
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        // TODO whats going on here?
        //if(!subClassObj3d.drawObjects) console.warn('no drawObjects -', this.name, this.userData.docType)
        //if(!subClassObj3d.drawObjects) console.log(this)
        if (subClassObj3d.drawObjects)
          objectPronmises.push(subClassObj3d.drawObjects(addSelectable))
      }
    });
    return Promise.all(objectPronmises);

  }

  drawObjectAssocs(glModelObject3D) {
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        if (subClassObj3d.drawObjectAssocs)
          subClassObj3d.drawObjectAssocs(glModelObject3D)
      }
    });
  }

  getMesh() {
    const x = 0, y = 0

    let shape = new Shape()
    shape.moveTo(x, y + HEIGHT / 3)
      .lineTo(x, (y + HEIGHT / 3) * 2)
      .lineTo(x + WIDTH / 2, y + HEIGHT)
      .lineTo(x + WIDTH, (y + HEIGHT / 3) * 2)
      .lineTo(x + WIDTH, y + HEIGHT / 3)
      .lineTo(x + WIDTH / 2, y)

    // extruded shape
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.title + " - 3d geometry"
    geometry.center()

    const { class: colorProp = { color: 0xEFEFEF } } = threejsColors
    const material = new MeshLambertMaterial({ color: colorProp.color })

    return new Mesh(geometry, material)
  }
}
