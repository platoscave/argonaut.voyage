import { Vector3, Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh } from 'three'
import object3dMixin from './object3dMixin'
import modelColors from '../../../config/modelColors'

// eslint-disable-next-line no-unused-vars
const WIDTH = 400, HEIGHT = 200, DEPTH = 100, RADIUS = 50

export default class UserObject3d extends Object3D {

  constructor(userData) {
    super()

    // Mixin utility methods: Beam, Tube, Text etc
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


  }


  getMesh() {
    const x = 0, y = 0

    // Rounded rect
    let shape = new Shape()
    shape.moveTo(x, y + RADIUS)
      .lineTo(x, y + HEIGHT - RADIUS)
      .quadraticCurveTo(x, y + HEIGHT, x + RADIUS, y + HEIGHT)
      .lineTo(x + WIDTH - RADIUS, y + HEIGHT)
      .quadraticCurveTo(x + WIDTH, y + HEIGHT, x + WIDTH, y + HEIGHT - RADIUS)
      .lineTo(x + WIDTH, y + RADIUS)
      .quadraticCurveTo(x + WIDTH, y, x + WIDTH - RADIUS, y)
      .lineTo(x + RADIUS, y)
      .quadraticCurveTo(x, y, x, y + RADIUS)

    // extruded shape
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: 2, bevelThickness: 2 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.name + " - 3d geometry"
    geometry.center()

    const { 'object': colorProp = { color: 0xEFEFEF }  } = modelColors
    const material = new MeshLambertMaterial({ color: colorProp.color })

    return new Mesh(geometry, material)
  }
}
