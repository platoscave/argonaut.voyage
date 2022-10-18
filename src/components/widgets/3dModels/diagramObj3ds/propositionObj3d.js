import { Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh,  Vector3, Group } from 'three'
import { drawTube, getSidePos, getTextMesh, drawTubeBackSideToFrontSide } from "~/lib/threejsUtils"
import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"
import { getRoundedRectShape } from "~/lib/threejsUtils"


export default class ProbositionObject3d extends Object3D {

  constructor(userData) {
    super()

    this._id = userData._id
    this.name = userData.name + ' - object3d'
    this.userData = userData

    let objectMesh = this.getMesh()
    objectMesh.name = userData.name + ' - 3d mesh'
    this.add(objectMesh)
    
    let textMesh = getTextMesh(userData.name)
    textMesh.translateZ(DEPTH * 0.4)
    objectMesh.add(textMesh)

  }

  drawPropositionToProcessConnectors(glModelObj3d) {

    const assocsGroup = new Group()
    assocsGroup.name = 'assocsGroup'
    this.add(assocsGroup)
    
    const idsToGetArr = [
      'processId', 'subprocessId'
    ]

    idsToGetArr.forEach( idName => {
      const destObj3d = glModelObj3d.getObjectByProperty('_id', this.userData[idName])
      console.log('destObj3d',destObj3d)
      if(destObj3d) assocsGroup.add(drawTubeBackSideToFrontSide(
        this, destObj3d, 'active', idName, true, 0)) // initially invisible
    })
  }


  setAssocsOpacity( glModelObj3d, opacity ) {

    // Find our assocs group
    const assocsGroup = this.children.find(item => item.isGroup && item.name === 'assocsGroup')
    // Set their opacity
    if(assocsGroup) {
      assocsGroup.children.forEach( item => {
        item.material.opacity = opacity
        item.children.forEach( item2 => item2.material.opacity = opacity)// Label mesh
      })
    }
  }
  getMesh() {

    const shape = getRoundedRectShape(HEIGHT, WIDTH, RADIUS)

    // extruded shape
    let extrudeSettings = { depth: DEPTH* .45, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.name + " - 3d geometry"
    geometry.center()

    const { 'object': colorProp = { color: 0xEFEFEF } } = threejsColors
    const material = new MeshLambertMaterial({ color: colorProp.color })
    return new Mesh(geometry, material) 
  }
  

}
