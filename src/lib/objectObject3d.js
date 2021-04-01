/* eslint-disable no-unused-vars */
import * as THREE from 'three'
import { Vector3 } from 'three'
import object3dMixin from './object3dMixin'
import classModelColors from '../config/classModelColors'

const WIDTH = 400, HEIGHT = 200, DEPTH = 100, RADIUS = 50

export default class ObjectObject3d extends THREE.Object3D {

  constructor(userData, isRoot) {
    super()

    // Mixin utility methodes: Beam, Tube, Text etc
    Object.assign(this, object3dMixin);

    this._id = userData._id
    this.name = userData.label + ' - object3d'
    this.userData = userData

    let objectMesh = this.getMesh()
    objectMesh.name = userData.label + ' - 3d mesh'
    this.add(objectMesh)

    let textMesh = this.getTextMesh(userData.label)
    textMesh.translateZ(DEPTH * 0.6)
    textMesh.translateY(-HEIGHT / 4)
    objectMesh.add(textMesh)

    objectMesh.rotateY(Math.PI / 2)

  }


  drawObjectAssocs(glModelObject3D) {

    for (let key in this.userData.assocs) {

      const assoc = this.userData.assocs[key]

      const { [assoc.name]: assocProps } = classModelColors
      if (!assocProps) console.log('No assoc props for: ' + assoc.name)
      if (!assocProps) continue
      const depth = - (DEPTH * 2 + assocProps.depth * DEPTH / 2)

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

      let labelMesh = this.getTextMesh(assoc.name)
      let textPos = new Vector3()
      textPos.lerpVectors(points[1], points[2], 0.5)
      labelMesh.translateX(textPos.x)
      labelMesh.translateY(textPos.y)
      labelMesh.translateZ(textPos.z)
      this.add(labelMesh)

    }

  }

  getMesh() {
    const x = 0, y = 0

    let shape = new THREE.Shape()
    shape.moveTo(x, y)
      .lineTo(x, y + HEIGHT / 2)
      .lineTo(x + WIDTH / 2, y + HEIGHT)
      .lineTo(x + WIDTH, y + HEIGHT / 2)
      .lineTo(x + WIDTH, y)

    // extruded shape
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
    let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.title + " - 3d geometry"
    geometry.center()

    const { object: assocProps } = classModelColors
    const material = new THREE.MeshLambertMaterial({ color: assocProps.color })

    return new THREE.Mesh(geometry, material)
  }
}
