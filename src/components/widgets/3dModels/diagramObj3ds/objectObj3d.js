import { Vector3, Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh } from 'three'
import { drawTube, getSidePos, getTextMesh } from "~/lib/threejsUtils"
import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"


export default class StepObject3d extends Object3D {

  constructor(userData) {
    super()

    this._id = userData._id
    this.name = userData.name + ' - object3d'
    this.userData = userData

    let objectMesh = this.getMesh()
    objectMesh.name = userData.name + ' - 3d mesh'
    this.add(objectMesh)

    let textMesh = getTextMesh(userData.name)
    textMesh.translateZ(DEPTH * 0.6)
    textMesh.translateY(-HEIGHT / 4)
    objectMesh.add(textMesh)

    objectMesh.rotateY(Math.PI / 2)

  }


  drawObjectAssocs(glModelObject3D) {

    //if(this._id !== '4caczktyxzm5') return

    const fks = ['stepId', 'firstStepId', 'updaterId', 'processId', 'assetId', 'consumerId', 'providerId', 'sellerProcessId', /* 'ownerId',  */'agreementClassId', 'viewId', /* 'pageId',  */'queryId', 'baseClassId', 'menuId']

    const drawAssocs = properties => {
      for (let key in properties) {
        const destId = properties[key]
        if (destId && fks.includes(key)) {

          const destObj3d = glModelObject3D.getObjectByProperty('_id', destId)
          if (!destObj3d) console.log('Assoc destination not found: ', this._id, key, destId)
          //if (!destObj3d) console.log(this)
          if (!destObj3d) continue

          // Get positions in world coordinates
          let sourcePos = new Vector3()
          this.getWorldPosition(sourcePos)
          let destPos = new Vector3()
          destObj3d.getWorldPosition(destPos)

          const points = this.addCorners(sourcePos, destPos)

          this.add(drawTube(points, key, key, true))
        }
        if (key === 'tabs') destId.forEach(tabObj => {
          tabObj.widgets.forEach(widgetObj => {
            drawAssocs(widgetObj)
          })
        })
        if (key === 'nextStepIds') destId.forEach(nextStepObj => {
          drawAssocs(nextStepObj)
        })
      }
    }

    drawAssocs(this.userData)

  }

  addCorners(sourcePos, destPos) {
    let points = []

    const similar = (a, b) => {
      return Math.round(parseFloat(a) * 100) === Math.round(parseFloat(b) * 100)
    }
    const straighten = (destPos) => {
      let lastPoint = new Vector3()

      lastPoint.copy(points[points.length - 1])
      if (!similar(lastPoint.x, destPos.x)) points.push(lastPoint.clone().setX(destPos.x))

      lastPoint.copy(points[points.length - 1])
      if (!similar(lastPoint.z, destPos.z)) points.push(lastPoint.clone().setZ(destPos.z))

      //lastPoint.copy(points[points.length -1])
      //if( !similar(lastPoint.y, destPos.y )) points.push(lastPoint.clone().setY(destPos.y))

    }

    // Get the difference vector
    let difVec = destPos.clone().sub(sourcePos)
    if (similar(difVec.y, 0)) { // same level, go down then up
      let sourceBottomPos = getSidePos('bottom', new Vector3())
      let sourceBusPos = new Vector3(0, -HEIGHT * 2, 0)
      let destBottomPos = getSidePos('bottom', difVec)
      let destBusPos = difVec.clone().setY(difVec.y - HEIGHT * 2)

      points.push(sourceBottomPos)
      points.push(sourceBusPos)
      straighten(destBusPos)
      points.push(destBusPos)
      points.push(destBottomPos)
    }
    else if (difVec.y > 0) { // higher level, go up then up
      let sourceTopPos = getSidePos('top', new Vector3())
      let sourceBusPos = new Vector3(0, HEIGHT * 2, 0)
      let destBottomPos = getSidePos('bottom', difVec)
      let destBusAPos = difVec.clone().setY(difVec.y - HEIGHT * 2) //TODO not coorect should be less
      let destBusBLength = sourceBusPos.x > destBusAPos.x ? - WIDTH : WIDTH
      let destBusBPos = destBusAPos.clone().setX(destBusAPos.x - destBusBLength)

      points.push(sourceTopPos)
      points.push(sourceBusPos)
      straighten(destBusBPos)
      points.push(destBusBPos)
      points.push(destBusAPos)
      points.push(destBottomPos)
    }
    else { // lower level, go down then down
      let sourceBottomPos = getSidePos('bottom', new Vector3())
      let sourceBusPos = new Vector3(0, -HEIGHT * 2, 0)
      let destTopPos = getSidePos('top', difVec)
      let destBusAPos = difVec.clone().setY(difVec.y + HEIGHT * 2) //TODO not coorect should be less
      let destBusBLength = sourceBusPos.x > destBusAPos.x ? - WIDTH : WIDTH
      let destBusBPos = destBusAPos.clone().setX(destBusAPos.x - destBusBLength)

      points.push(sourceBottomPos)
      points.push(sourceBusPos)
      straighten(destBusBPos)
      points.push(destBusBPos)
      points.push(destBusAPos)
      points.push(destTopPos)
    }

    return points

  }

  getMesh() {
    const x = 0, y = 0

    let shape = new Shape()

    shape.moveTo(x, y)
      .lineTo(x, y + HEIGHT / 2)
      .lineTo(x + WIDTH / 2, y + HEIGHT)
      .lineTo(x + WIDTH, y + HEIGHT / 2)
      .lineTo(x + WIDTH, y)

    // extruded shape
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01}
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.name + " - 3d geometry"
    geometry.center()

    const { 'object': colorProp = { color: 0xEFEFEF }  } = threejsColors
    const material = new MeshLambertMaterial({ color: colorProp.color })

    return new Mesh(geometry, material)
  }
}
