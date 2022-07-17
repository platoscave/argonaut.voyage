import { Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh, MeshBasicMaterial, MeshFaceMaterial, BufferGeometry, Geometry, CylinderGeometry, TextureLoader } from 'three'
import object3dMixin from './object3dMixin'
import modelColors from '../../../config/modelColors'

// eslint-disable-next-line no-unused-vars
const WIDTH = 4, HEIGHT = 2, DEPTH = 1, RADIUS = .5

export default class UserObject3d extends Object3D {

  constructor(userData) {
    super()

    // Mixin utility methods: Beam, Tube, Text etc
    Object.assign(this, object3dMixin);

    this._id = userData._id
    this.name = userData.name + ' - object3d'
    this.userData = userData

    let objectMesh = this.getMesh()
    objectMesh.name = userData.name + ' - 3d mesh'
    this.add(objectMesh)
    let avatarMesh = this.getAvatar()
    //avatarMesh.name = userData.name + ' - 3d mesh'
    this.add(avatarMesh)

    let textMesh = this.getTextMesh(userData.name)
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
    let extrudeSettings = { depth: DEPTH* .45, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.name + " - 3d geometry"
    geometry.center()

    const { 'object': colorProp = { color: 0xEFEFEF } } = modelColors
    const material = new MeshLambertMaterial({ color: colorProp.color })
    return new Mesh(geometry, material) 
  }
  
  getAvatar() {

    // Avatar
    const cylindergeometry = new CylinderGeometry( HEIGHT/2, HEIGHT/2, DEPTH/2, 32 );
    cylindergeometry.rotateX(Math.PI/2)
    cylindergeometry.rotateZ(Math.PI/2)
    cylindergeometry.translate(-WIDTH / 2, HEIGHT / 2, 0)

    const texture = new TextureLoader().load( 'avatar1.jpg' );
    //texture.rotation  = Math.PI/2
    const cylinderMaterial = new MeshBasicMaterial( { map: texture } );
    const { 'object': colorProp = { color: 0xEFEFEF } } = modelColors
    const material = new MeshLambertMaterial({ color: colorProp.color })

    const materials = [
      material, // side
      cylinderMaterial, // top
      cylinderMaterial // bottom
    ]
    return new Mesh( cylindergeometry, materials );

  }

}
