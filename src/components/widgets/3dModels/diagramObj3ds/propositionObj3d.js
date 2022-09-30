import { Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh,  Vector3 } from 'three'
import { drawTube, getSidePos, getTextMesh } from "~/lib/threejsUtils"
import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"


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

  drawPropositionToProcessConnectors(glModelObject3D) {

    if (this.userData.processId) {
      let destProcessObj3d = glModelObject3D.getObjectByProperty('_id', this.userData.processId)
      this.drawTubeBackSideToFrontSide(destProcessObj3d)
    }

    if (this.userData.subprocessId) {
      let destProcessObj3d = glModelObject3D.getObjectByProperty('_id', this.userData.subprocessId)
      this.drawTubeBackSideToFrontSide(destProcessObj3d)
    }
  }

  drawTubeBackSideToFrontSide(destProcessObj3d) {

    // Get sourcePos in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)

    // Get destPos in world coordinates
    let destPos = new Vector3()
    destProcessObj3d.getWorldPosition(destPos)

    // Get the difference vector
    let difVec = destPos.clone()
    difVec.sub(sourcePos)

    const sourceBackPos = getSidePos('back', new Vector3())
    const destFrontPos = getSidePos('front', difVec)

    let points = []

    points.push(sourceBackPos)
    points.push(new Vector3(sourceBackPos.x, sourceBackPos.y, sourceBackPos.z - DEPTH * 4))
    points.push(new Vector3(destFrontPos.x, destFrontPos.y, destFrontPos.z + DEPTH * 4))
    points.push(destFrontPos)

    this.add(drawTube(points, 'active', 'processId', true))

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

    const { 'object': colorProp = { color: 0xEFEFEF } } = threejsColors
    const material = new MeshLambertMaterial({ color: colorProp.color })
    return new Mesh(geometry, material) 
  }
  

}
