import { Vector3, Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh } from 'three'
import object3dMixin from './object3dMixin'
import classModelColors from '../config/classModelColors'

const WIDTH = 400, HEIGHT = 200, DEPTH = 100, RADIUS = 50

export default class ObjectObject3d extends Object3D {

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

    objectMesh.rotateY(Math.PI / 2)

  }


  drawObjectAssocs(glModelObject3D) {

    //if(this._id !== '4caczktyxzm5') return

    for (let key in this.userData.assocs) {

      const assoc = this.userData.assocs[key]

      const destObj3d = glModelObject3D.getObjectByProperty('_id', assoc.destId)
      //if (!destObj3d) console.log('Assoc destination not found: ' + assoc.name, assoc.destId)
      //if (!destObj3d) console.log(this)
      if (!destObj3d) continue

      // Get positions in world coordinates
      let sourcePos = new Vector3()
      this.getWorldPosition(sourcePos)
      let destPos = new Vector3()
      destObj3d.getWorldPosition(destPos)

      const points = this.addCorners(sourcePos, destPos) 

      this.add(this.drawTube(points, assoc.name, assoc.name, true))

      let labelMesh = this.getTextMesh(assoc.name)
      let textPos = new Vector3()
      if (points[2]) textPos.lerpVectors(points[1], points[2], 0.5)
      else textPos.lerpVectors(points[0], points[1], 0.5)
      labelMesh.translateX(textPos.x)
      labelMesh.translateY(textPos.y)
      labelMesh.translateZ(textPos.z)
      this.add(labelMesh)

    }

  }

  addCorners(sourcePos, destPos) {
    let points = []

    const similar = (a, b) => {
      return Math.round(parseFloat(a)*100) === Math.round(parseFloat(b)*100)
    }
    const straighten = ( destPos) => {
      let lastPoint = new Vector3()

      lastPoint.copy(points[points.length -1])
      if( !similar(lastPoint.z, destPos.z )) points.push(lastPoint.clone().setZ(destPos.z))

      lastPoint.copy(points[points.length -1])
      if( !similar(lastPoint.x, destPos.x )) points.push(lastPoint.clone().setX(destPos.x))

      lastPoint.copy(points[points.length -1])
      //if( !similar(lastPoint.y, destPos.y )) points.push(lastPoint.clone().setY(destPos.y))

    }

    // Get the difference vector
    let difVec = destPos.clone().sub(sourcePos)
    if(similar(difVec.y, 0)) { // same level, go down then up
      let sourceBottomPos = this.getSidePos('bottom', new Vector3())
      let sourceBusPos = new Vector3( 0, -HEIGHT * 2, 0)
      let destBottomPos = this.getSidePos('bottom', difVec)
      let destBusPos = destBottomPos.clone().setY(destBottomPos.y -HEIGHT * 2)

      points.push(sourceBottomPos)
      points.push(sourceBusPos)
      straighten(destBusPos)
      points.push(destBusPos)
      points.push(destBottomPos)
    }
    else if (difVec.y > 0) { // higher level, go up then up
      let sourceTopPos = this.getSidePos('top', new Vector3())
      let sourceBusPos = new Vector3( 0, HEIGHT * 2, 0)
      let destBottomPos = this.getSidePos('bottom', difVec)
      let destBusAPos = destBottomPos.clone().setY( destBottomPos.y + HEIGHT * 2) //TODO not coorect should be less
      let destBusBLength = sourceBusPos.x > destBusAPos.x ? - WIDTH : WIDTH
      let destBusBPos = destBusAPos.clone().setX( destBusAPos.x - destBusBLength)
      
      points.push(sourceTopPos)
      points.push(sourceBusPos)
      points.push(destBusBPos)
      points.push(destBusAPos)
      points.push(destBottomPos)
    }
    else { // lower level, go down then down
      let sourceBottomPos = this.getSidePos('bottom', new Vector3())
      let sourceBusPos = new Vector3( 0, -HEIGHT * 2, 0)
      let destTopPos = this.getSidePos('top', difVec)
      let destBusAPos = destTopPos.clone().setY( destTopPos.y + HEIGHT * 2) //TODO not coorect should be less
      let destBusBLength = sourceBusPos.x > destBusAPos.x ? - WIDTH : WIDTH
      let destBusBPos = destBusAPos.clone().setX( destBusAPos.x - destBusBLength)

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
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.label + " - 3d geometry"
    geometry.center()

    const { object: assocProps } = classModelColors
    const material = new MeshLambertMaterial({ color: assocProps.color })

    return new Mesh(geometry, material)
  }
}
