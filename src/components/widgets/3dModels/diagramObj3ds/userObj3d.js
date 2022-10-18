import { Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh, MeshBasicMaterial, BufferGeometry, CylinderGeometry, TextureLoader, ShapeGeometry } from 'three'
import { getTextMesh, getAvatarMesh, getRoundedRectShape, getSvgAvatar } from "~/lib/threejsUtils"
import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"


export default class UserObject3d extends Object3D {

  constructor(userData) {
    super()

    this._id = userData._id
    this.name = userData.name + ' - object3d'
    this.userData = userData

    let objectMesh = this.getMesh()
    objectMesh.name = userData.name + ' - 3d mesh'
    this.add(objectMesh)

    if(userData.treeVars.icon) {
      // if(userData.treeVars.icon.endsWith('.svg')){
      //   const group = getSvgAvatar(userData.treeVars.icon)
      //   this.add(group)
      // } 
      // else {
        const avatarMesh = getAvatarMesh(userData.treeVars.icon)
        avatarMesh.translateZ(DEPTH * 0.2)
        avatarMesh.translateX(-WIDTH * .60)
        avatarMesh.translateY(HEIGHT * .25)
        this.add(avatarMesh)
      //}
    }

    let textMesh = getTextMesh(userData.name)
    textMesh.translateZ(DEPTH * 0.6)
    //textMesh.translateY(-HEIGHT / 4)
    objectMesh.add(textMesh)


  }


  getMesh() {

    const shape = getRoundedRectShape(HEIGHT, WIDTH, RADIUS)

    // extruded shape
    let extrudeSettings = { depth: DEPTH * .45, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.name + " - 3d geometry"
    geometry.center()

    const { 'object': colorProp = { color: 0xEFEFEF } } = threejsColors
    const material = new MeshLambertMaterial({ color: colorProp.color })
    return new Mesh(geometry, material)
  }


}
