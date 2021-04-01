import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import classModelColors from '../config/classModelColors'
import fontJson from '../assets/helvetiker_regular.typeface.json'
const font = new THREE.Font(fontJson)

const WIDTH = 400, HEIGHT = 200, DEPTH = 100, RADIUS = 50
export default {

  drawBeam(points, colorName = 'default', label = 'unnamed', arrow) {

    let geometries = []

    for (let idx = 1; idx < points.length; idx++) {
      const p1 = points[idx - 1], p2 = points[idx]

      // https://stackoverflow.com/questions/15139649/three-js-two-points-one-cylinder-align-issue/15160850#15160850
      let HALF_PI = Math.PI * 0.5
      let distance = p1.distanceTo(p2)
      let position = p2.clone().add(p1).divideScalar(2)
      let cylinder = new THREE.CylinderGeometry(15, 15, distance, 10, 10, false)
      let orientation = new THREE.Matrix4()// a new orientation matrix to offset pivot
      let offsetRotation = new THREE.Matrix4()// a matrix to fix pivot rotation
      // let offsetPosition = new THREE.Matrix4()// a matrix to fix pivot position
      orientation.lookAt(p1, p2, new THREE.Vector3(0, 1, 0))// look at destination
      offsetRotation.makeRotationX(HALF_PI)// rotate 90 degs on X
      orientation.multiply(offsetRotation)// combine orientation with rotation transformations
      cylinder.applyMatrix4(orientation)
      cylinder.translate(position.x, position.y, position.z);
      geometries.push(cylinder)

      // sphere at the left end
      let sphereGeometryLeft = new THREE.SphereGeometry(15)
      sphereGeometryLeft.translate(p1.x, p1.y, p1.z);
      geometries.push(sphereGeometryLeft)

      // sphere at the right end
      let sphereGeometryRight = new THREE.SphereGeometry(15)
      sphereGeometryRight.translate(p2.x, p2.y, p2.z);
      geometries.push(sphereGeometryRight)
    }

    if (arrow) {
      const lastPoint = points[points.length -1]
      let coneGeometry = new THREE.CylinderGeometry(0, 40, 100, 40, 40, false)
      coneGeometry.translate(lastPoint.x, lastPoint.y, lastPoint.z)
      geometries.push(coneGeometry)
    }
        
    
    let mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    //mergedGeometry.mergeVertices() //doesn't work
        
    const { [colorName]: assocProps = { color: 0xEFEFEF } } = classModelColors
    const material = new THREE.MeshLambertMaterial({ color: assocProps.color })

    return new THREE.Mesh(mergedGeometry, material)

  },

  drawTube(points, colorName = 'default', label = 'unnamed', arrow) {

    const beforeLastPoint = points[points.length -2]
    const lastPoint = points[points.length -1]
    let direction = new THREE.Vector3()
    direction.subVectors(lastPoint, beforeLastPoint).normalize()
    
    // Shorten the last vector to make room for the arrow
    if (arrow) {
      let offset = direction.clone()
      offset.multiplyScalar(100)
      points[points.length -1].sub(offset)
    }

    let path = new THREE.CatmullRomCurve3(this.straightenPoints(points))
    // path.curveType = 'centripetal';
    let geometries = []
    geometries.push(new THREE.TubeGeometry(path, 300, 7, 8, false))

    if (arrow) {
      let coneGeometry = new THREE.CylinderGeometry(0, 40, 100, 40, 40, false)
      coneGeometry.translate(0, 50, 0)
      coneGeometry.rotateX(Math.PI / 2 * direction.z)
      coneGeometry.rotateZ(Math.PI / 2 * direction.x)
      //coneGeometry.rotateY(Math.PI / 2 * direction.y) // TODO
      coneGeometry.translate(lastPoint.x, lastPoint.y, lastPoint.z)
      geometries.push(coneGeometry)
    }
    
    let mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    //mergedGeometry.mergeVertices() //doesn't work for buffer geometry
    
    const { [colorName]: assocProps = { color: 0xEFEFEF } } = classModelColors
    const material = new THREE.MeshLambertMaterial({ color: assocProps.color })

    return new THREE.Mesh(mergedGeometry, material)

  },

  straightenPoints(points) {
    let newPoints = []
    points.forEach((point, i) => {
      if (i === 0) newPoints.push(point)
      else {
        let direction = new THREE.Vector3()
        direction.subVectors(point, points[i - 1])
        direction.setLength(RADIUS)
        let newPoint = new THREE.Vector3()
        newPoint.subVectors(point, direction)
        newPoints.push(newPoint)
        if (i < points.length - 1) {
          let direction = new THREE.Vector3()
          direction.subVectors(point, points[i + 1])
          direction.setLength(RADIUS)
          let newPoint = new THREE.Vector3()
          newPoint.subVectors(point, direction)
          newPoints.push(newPoint)
        } else newPoints.push(point)
      }
    })
    return newPoints
  },

  getSidePos (side, pos = new THREE.Vector3()) {
    if (side === 'top') return new THREE.Vector3(pos.x, pos.y + HEIGHT / 2, pos.z)
    if (side === 'right') return new THREE.Vector3(pos.x + WIDTH / 2, pos.y, pos.z)
    if (side === 'bottom') return new THREE.Vector3(pos.x, pos.y - HEIGHT / 2, pos.z)
    if (side === 'left') return new THREE.Vector3(pos.x - WIDTH / 2, pos.y, pos.z)
    if (side === 'front') return new THREE.Vector3(pos.x, pos.y, pos.z + DEPTH / 2)
    if (side === 'back') return new THREE.Vector3(pos.x, pos.y, pos.z - DEPTH / 2)
    return pos
  },

  getTextMesh( name = 'unnamed', size = HEIGHT / 6 ) {

    const { label: assocProps } = classModelColors
    let textMaterial = new THREE.MeshLambertMaterial({ color: assocProps.color })
    textMaterial.side = THREE.DoubleSide

    const shapes = font.generateShapes(name, size);

    const geometry = new THREE.ShapeGeometry(shapes);
    geometry.name = name + " - text geometry"
    geometry.center()

    let textMesh = new THREE.Mesh(geometry, textMaterial);
    textMesh.name = name + ' - text mesh'
    return textMesh
  }

}
