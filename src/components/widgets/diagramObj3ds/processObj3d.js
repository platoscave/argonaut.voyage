import { argoQuery } from "../../../services/dexieServices";
import { take } from 'rxjs/operators';
import { Object3D, Vector3, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh, SphereGeometry, MeshBasicMaterial } from 'three'
import StepObject3d from "./stepObj3d";
import object3dMixin from './object3dMixin'
import modelColors from '../../../config/modelColors'

const WIDTH = 4, HEIGHT = 2, DEPTH = 1, RADIUS = .5

export default class ProcessObject3d extends Object3D {

  constructor(userData) {
    super()

    // Mixin utility methodes: Beam, Tube, Text etc
    Object.assign(this, object3dMixin);

    this._id = userData._id
    this.name = userData.name + ' - object3d'
    this.userData = userData

    let classMesh = this.getMesh()
    classMesh.name = userData.name + ' - 3d mesh'
    this.add(classMesh)

    let textMesh = this.getTextMesh(userData.name)
    textMesh.translateZ(DEPTH * 0.6)
    classMesh.add(textMesh)

  }

  drawEndStates(processWidth) {
    /* const destVec = this.getSidePos('left')
    let points = []
    points.push(destVec.clone().add(new Vector3(-WIDTH * 4, HEIGHT, 0)))
    points.push(destVec.clone().add(new Vector3(-WIDTH * 3, HEIGHT, 0)))
    points.push(destVec.clone().add(new Vector3(-WIDTH * 1, 0, 0)))
    points.push(destVec)
    this.add(this.drawTube(points, 'happy', '', true)) */

    const endX = processWidth / 2 + WIDTH

    const sourceVec = this.getSidePos('right')
    let height = 0
    this.userData.returnActions.forEach(item => {
      let points = []
      points.push(sourceVec)
      points.push(sourceVec.clone().add(new Vector3((endX - WIDTH / 2) * .2, 0, 0)))
      points.push(sourceVec.clone().add(new Vector3((endX - WIDTH / 2) * .7, height, 0)))
      points.push(sourceVec.clone().add(new Vector3((endX - WIDTH / 2 -WIDTH * 0.1), height, 0)))
      this.add(this.drawTube(points, item, item, true))

      const geometry = new SphereGeometry(HEIGHT / 4, 32, 16);
      geometry.translate(endX, height, 0)
      const { [item]: colorProp = { color: 0xEFEFEF } } = modelColors
      const material = new MeshLambertMaterial({ color: colorProp.color })
      const sphere = new Mesh(geometry, material);
      this.add(sphere);

      height += HEIGHT
    })
  }

  async drawSteps(selectableMeshArr, glModelObject3D) {
  
    // Execute the query
    const stepObjArr = await argoQuery.executeQuery("aiw54neadp14", this.userData).pipe(take(1)).toPromise() // First step queryId
    const firstStepObj = stepObjArr[0]
    if(!firstStepObj) return []
    
    // Draw the first step
    let stepObj3d = new StepObject3d(firstStepObj);
    selectableMeshArr.push(stepObj3d.children[0])
    this.add(stepObj3d)

    // Tell it to draw next steps
    return stepObj3d.drawSteps(selectableMeshArr, glModelObject3D)

  }

  drawStepToUserConnectors(glModelObject3D) {

    // Find the first step
    const stepObj = this.children.find(item => {
      return item.constructor.name === 'StepObject3d' // WARNING may not work after mimify
    })
    stepObj.drawStepToUserConnectors(glModelObject3D)
  }

  setPositionY() {
    // Find the first step
    const stepObj = this.children.find(item => {
      return item.constructor.name === 'StepObject3d' // WARNING may not work after mimify
    })
    let maxXYVec
    if (stepObj) {
      // Tell first step to position its children
      maxXYVec = stepObj.setPositionY(0);
      stepObj.translateX(-maxXYVec.x / 2); // move first step to the left
      stepObj.translateY(-HEIGHT * 4); // move first step down
      return maxXYVec
    }
    return new Vector3(0, 0, 0);
  }


  drawStepConnectors(glModelObject3D) {

    // Find the first step
    const stepObj3d = this.children.find(item => {
      return item.constructor.name === 'StepObject3d'  // WARNING may not work after mimify
    })

    if (!stepObj3d) return

    // Get positions in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)
    let destPos = new Vector3()
    stepObj3d.getWorldPosition(destPos)

    // Get the difference vector
    let difVec = destPos.clone()
    difVec.sub(sourcePos)

    const sourceBottom = this.getSidePos('bottom', new Vector3())
    sourceBottom.setX(sourceBottom.x - WIDTH / 4)
    const destLeft = this.getSidePos('left', difVec)

    let points = []
    points.push(sourceBottom) // move startpoint to the edge
    points.push(new Vector3(sourceBottom.x, sourceBottom.y - HEIGHT, sourceBottom.z))
    points.push(new Vector3(destLeft.x - WIDTH / 2, sourceBottom.y - HEIGHT, destLeft.z))
    points.push(new Vector3(destLeft.x - WIDTH / 2, destLeft.y, destLeft.z))
    points.push(destLeft)

    this.add(this.drawTube(points, 'happy', 'initial step', true))

    // Tell first step to draw its connectors
    stepObj3d.drawStepConnectors(glModelObject3D, this)

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
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.name + " - 3d geometry"
    geometry.center()

    const { [this.userData.classId]: colorProp = { color: 0xEFEFEF } } = modelColors
    const material = new MeshLambertMaterial({ color: colorProp.color })

    return new Mesh(geometry, material)
  }
}
