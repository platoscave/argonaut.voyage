import { Vector3, Vector2, Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh } from 'three'
import object3dMixin from './object3dMixin'
import modelColors from '../../../config/modelColors'

// eslint-disable-next-line no-unused-vars
const WIDTH = 400, HEIGHT = 200, DEPTH = 100, RADIUS = 50

export default class StepObject3d extends Object3D {

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
    textMesh.translateX(WIDTH / 16)
    objectMesh.add(textMesh)
  }


  async drawSteps(selectableMeshArr, executeQuery, glModelObject3D, queryId) {

    // Execute the query
    let resArr = await executeQuery(queryId, this.userData)

    // Create the next steps
    let propmisesArr = []
    resArr.forEach(userData => {

      // If the stepObj already exists, make sure it is to the right of us
      let stepObj3d = glModelObject3D.getObjectByProperty('_id', userData._id)
      if (stepObj3d) {
        // TODO not sure this always works
        if (stepObj3d.position.x < this.position.x * 1.1) stepObj3d.translateX(WIDTH * 2)
      }
      else {
        // Create the step
        stepObj3d = new StepObject3d(userData);
        selectableMeshArr.push(stepObj3d.children[0])
        stepObj3d.translateX(WIDTH * 2)
        this.add(stepObj3d)

        // Tell it to draw it's next steps
        // TODO recursion check
        propmisesArr.push(stepObj3d.drawSteps(selectableMeshArr, executeQuery, glModelObject3D, queryId))
      }

    })

    return Promise.all(propmisesArr)
  }


  // Set the Y positions
  setPositionY(yPos) {
    this.translateY(yPos)

    let childYPos = yPos
    let smallestY = yPos
    var target = new Vector3(); // create once an reuse it
    this.getWorldPosition(target);

    let greatestX = target.x // NOT GOOD


    this.children.forEach(item => {
      if (item.constructor.name === 'StepObject3d') { // WARNING may not work after mimify
        let vec = item.setPositionY(childYPos)
        smallestY = vec.y
        greatestX = Math.max(greatestX, vec.x)
        childYPos = smallestY - HEIGHT * 4
      }
    })

    // We return a vector2 with the greatest X until now so that the processObject can center everything (shift to left by half),
    // and smallest Y so that the parent step can place the next step one position lower
    return new Vector2(greatestX, smallestY)
  }


  drawStepConnectors(glModelObject3D, returnProcessObj3d) {

    if (!this.userData.nextStepIds) return
    this.userData.nextStepIds.forEach(nextStepActionId => {

      if (nextStepActionId.stepId) {

        let destStepObj3d = glModelObject3D.getObjectByProperty('_id', nextStepActionId.stepId)
        this.drawTubeRightSideToLeftSide(destStepObj3d, nextStepActionId.action)

        // Tell the step to draw its connectors
        destStepObj3d.drawStepConnectors(glModelObject3D, returnProcessObj3d)

      } else {
        // No stateId means return to process object
        this.drawTubeRightSideToBottom(returnProcessObj3d, nextStepActionId.action)
      }
    })
  }


  drawTubeRightSideToLeftSide(stepObj3d, label) {

    // Get sourcePos in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)

    // Get destPos in world coordinates
    let destPos = new Vector3()
    stepObj3d.getWorldPosition(destPos)

    // Get the difference vector
    let difVec = destPos.clone()
    difVec.sub(sourcePos)

    const sourceRightPos = this.getSidePos('right', new Vector3())
    const destLeftPos = this.getSidePos('left', difVec)

    let points = []
    if (difVec.length < WIDTH * 1.1) {
      points.push(sourceRightPos)
      points.push(destLeftPos)
    } else {
      points.push(sourceRightPos)
      points.push(new Vector3(sourceRightPos.x + WIDTH / 2, sourceRightPos.y, sourceRightPos.z))
      points.push(new Vector3(destLeftPos.x - WIDTH / 2, destLeftPos.y, destLeftPos.z))
      points.push(destLeftPos)
    }

    this.add(this.drawTube(points, label, label, true))

  }

  drawTubeRightSideToBottom(returnProcessObj3d, label) {

    // Get sourcePos in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)

    // Get destPos in world coordinates
    let destPos = new Vector3()
    returnProcessObj3d.getWorldPosition(destPos)

    // Get the difference vector
    let difVec = destPos.clone()
    difVec.sub(sourcePos)

    const sourceRightPos = this.getSidePos('right', new Vector3())
    const destBottomPos = this.getSidePos('bottom', difVec)
    destBottomPos.setX(destBottomPos.x + WIDTH / 4)


    let points = []
    points.push(sourceRightPos) // move startpoint to the edge
    points.push(new Vector3(sourceRightPos.x + WIDTH / 2, sourceRightPos.y, sourceRightPos.z))
    points.push(new Vector3(sourceRightPos.x + WIDTH / 2, destBottomPos.y - HEIGHT * 2, destBottomPos.z))
    points.push(new Vector3(destBottomPos.x, destBottomPos.y - HEIGHT * 2, destBottomPos.z))
    points.push(destBottomPos)

    this.add(this.drawTube(points, label, label, true))
  }


  drawStepToUserConnectors(glModelObject3D) {

    console.log(this.userData)
    if (this.userData.authorizedOrgUnitId) {
      let destUserObj3d = glModelObject3D.getObjectByProperty('_id', this.userData.authorizedOrgUnitId)
      this.drawTubeBackSideToFrontSide(destUserObj3d, 'authorizedOrgUnitId')
    }

    this.userData.nextStepIds.forEach(nextStepActionId => {

      if (nextStepActionId.stepId) {

        let destStepObj3d = glModelObject3D.getObjectByProperty('_id', nextStepActionId.stepId)

        // Tell the step to draw its user connectors
        destStepObj3d.drawStepToUserConnectors(glModelObject3D)

      }
    })
  }

  drawTubeBackSideToFrontSide(userObj3d) {

    // Get sourcePos in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)

    // Get destPos in world coordinates
    let destPos = new Vector3()
    userObj3d.getWorldPosition(destPos)

    // Get the difference vector
    let difVec = destPos.clone()
    difVec.sub(sourcePos)

    const sourceBackPos = this.getSidePos('back', new Vector3())
    const destFrontPos = this.getSidePos('front', difVec)

    let points = []

    points.push(sourceBackPos)
    points.push(new Vector3(sourceBackPos.x, sourceBackPos.y, sourceBackPos.z - DEPTH * 4))
    points.push(new Vector3(destFrontPos.x, destFrontPos.y, destFrontPos.z + DEPTH * 4))
    points.push(destFrontPos)

    this.add(this.drawTube(points, 'active', 'authorizedOrgUnitId', true))

  }


  getMesh() {
    const x = 0, y = 0

    // Chervron
    let shape = new Shape()
    shape.moveTo(x, y)
      .lineTo(x + WIDTH / 8, y + HEIGHT / 2)
      .lineTo(x, y + HEIGHT)
      .lineTo(x + WIDTH * 7 / 8, y + HEIGHT)
      .lineTo(x + WIDTH, y + HEIGHT / 2)
      .lineTo(x + WIDTH * 7 / 8, y)

    // extruded shape
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.label + " - 3d geometry"
    geometry.center()

    const { [this.userData.classId]: colorProp = { color: 0xEFEFEF } } = modelColors
    const material = new MeshLambertMaterial({ color: colorProp.color })

    return new Mesh(geometry, material)
  }
}
