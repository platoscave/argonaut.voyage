import argoQueryPromise from "~/lib/argoQueryPromise";
import { Vector3, Vector2, Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh } from 'three'
import { drawTube, getSidePos, getTextMesh } from "~/lib/threejsUtils"
import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"


export default class StepObject3d extends Object3D {

  constructor(userData) {
    super()

    this.key = userData.key
    this.name = userData.name + ' - object3d'
    this.userData = userData

    let objectMesh = this.getMesh()
    objectMesh.name = userData.name + ' - 3d mesh'
    this.add(objectMesh)

    let textMesh = getTextMesh(userData.name)
    textMesh.translateZ(DEPTH * 0.6)
    textMesh.translateX(WIDTH / 16)
    objectMesh.add(textMesh)
  }


  async drawSteps(addSelectable, glModelObject3D) {

    // Execute the query
    const resArr = await argoQueryPromise("ybjrgmdjybzl", this.userData)

    // Create the next steps
    let propmisesArr = []
    resArr.forEach(userData => {

      // If the stepObj already exists, make sure it is to the right of us
      let stepObj3d = glModelObject3D.getObjectByProperty('key', userData.key)
      if (stepObj3d) {
        // TODO not sure this always works
        if (stepObj3d.position.x < this.position.x * 1.1) stepObj3d.translateX(WIDTH * 2)
      }
      else {
        // Create the step
        stepObj3d = new StepObject3d(userData);
        addSelectable(stepObj3d.children[0])
        stepObj3d.translateX(WIDTH * 2)
        this.add(stepObj3d)

        // Tell it to draw it's next steps
        // TODO recursion check
        propmisesArr.push(stepObj3d.drawSteps(addSelectable, glModelObject3D))
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

        let destStepObj3d = glModelObject3D.getObjectByProperty('key', nextStepActionId.stepId)
        this.drawTubeRightSideToLeftSide(destStepObj3d, nextStepActionId.action)

        // Tell the step to draw its connectors
        destStepObj3d.drawStepConnectors(glModelObject3D, returnProcessObj3d)

      } else {
        // No stateId means return to process object
        this.drawTubeRightSideToBottom(returnProcessObj3d, nextStepActionId.action)
      }
    })
  }


  drawTubeRightSideToLeftSide(stepObj3d, name) {

    // Get sourcePos in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)

    // Get destPos in world coordinates
    let destPos = new Vector3()
    stepObj3d.getWorldPosition(destPos)

    // Get the difference vector
    let difVec = destPos.clone()
    difVec.sub(sourcePos)

    const sourceRightPos = getSidePos('right', new Vector3())
    const destLeftPos = getSidePos('left', difVec)

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

    this.add(drawTube(points, name, name, true))

  }

  drawTubeRightSideToBottom(returnProcessObj3d, name) {

    // Get sourcePos in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)

    // Get destPos in world coordinates
    let destPos = new Vector3()
    returnProcessObj3d.getWorldPosition(destPos)

    // Get the difference vector
    let difVec = destPos.clone()
    difVec.sub(sourcePos)

    const sourceRightPos = getSidePos('right', new Vector3())
    const destBottomPos = getSidePos('bottom', difVec)
    destBottomPos.setX(destBottomPos.x + WIDTH / 4)


    let points = []
    points.push(sourceRightPos) // move startpoint to the edge
    points.push(new Vector3(sourceRightPos.x + WIDTH / 2, sourceRightPos.y, sourceRightPos.z))
    points.push(new Vector3(sourceRightPos.x + WIDTH / 2, destBottomPos.y - HEIGHT * 2, destBottomPos.z))
    points.push(new Vector3(destBottomPos.x, destBottomPos.y - HEIGHT * 2, destBottomPos.z))
    points.push(destBottomPos)

    this.add(drawTube(points, name, name, true))
  }


  drawStepToOrgUnitConnectors(glModelObject3D) {

    if (this.userData.authorizedOrgUnitId) {
      let destUserObj3d = glModelObject3D.getObjectByProperty('key', this.userData.authorizedOrgUnitId)
      this.drawTubeBackSideToBottom(destUserObj3d, 'authorizedOrgUnitId')
    }

    this.userData.nextStepIds.forEach(nextStepActionId => {

      if (nextStepActionId.stepId) {

        let destStepObj3d = glModelObject3D.getObjectByProperty('key', nextStepActionId.stepId)

        // Tell the step to draw its user connectors
        destStepObj3d.drawStepToOrgUnitConnectors(glModelObject3D)

      }
    })

  }


  drawTubeBackSideToBottom(userObj3d) {

    // Get sourcePos in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)

    // Get destPos in world coordinates
    let destPos = new Vector3()
    userObj3d.getWorldPosition(destPos)

    // Get the difference vector
    let difVec = destPos.clone()
    difVec.sub(sourcePos)

    const sourceBackPos = getSidePos('back', new Vector3())
    const destBottomPos = getSidePos('bottom', difVec)

    let points = []

    points.push(sourceBackPos)
    points.push(new Vector3(sourceBackPos.x, sourceBackPos.y, sourceBackPos.z - DEPTH * 4))
    points.push(new Vector3(destBottomPos.x, sourceBackPos.y, destBottomPos.z + DEPTH * 4))
    points.push(destBottomPos)

    this.add(drawTube(points, 'active', 'authorizedOrgUnitId', true))

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
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.name + " - 3d geometry"
    geometry.center()

    const { [this.userData.classId]: colorProp = { color: 0xEFEFEF } } = threejsColors
    const material = new MeshLambertMaterial({ color: colorProp.color })

    return new Mesh(geometry, material)
  }
}
