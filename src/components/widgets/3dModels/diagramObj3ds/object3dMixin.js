import { 
  Font, 
  CylinderGeometry, 
  Matrix4, 
  Vector3, 
  SphereGeometry, 
  MeshLambertMaterial, 
  MeshPhongMaterial,
  MultiplyOperation,
  Mesh, 
  CatmullRomCurve3, 
  TubeGeometry, 
  Quaternion, 
  Euler,
  DoubleSide,
  ShapeGeometry
} from 'three'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import modelColors from '../../../../config/modelColors'
import fontJson from '../../../../assets/helvetiker_regular.typeface.json'
const font = new Font(fontJson)

const WIDTH = 4, HEIGHT = 2, DEPTH = 1, RADIUS = .5
export default {

  drawBeam(points, colorName, name, arrow) {

    let geometries = []

    for (let idx = 1; idx < points.length; idx++) {
      const p1 = points[idx - 1], p2 = points[idx]

      // https://stackoverflow.com/questions/15139649/three-js-two-points-one-cylinder-align-issue/15160850#15160850
      let HALF_PI = Math.PI * 0.5
      let distance = p1.distanceTo(p2)
      let position = p2.clone().add(p1).divideScalar(2)
      let cylinder = new CylinderGeometry(DEPTH * 0.15, DEPTH * 0.15, distance, 10, 10, false)
      let orientation = new Matrix4()// a new orientation matrix to offset pivot
      let offsetRotation = new Matrix4()// a matrix to fix pivot rotation
      // let offsetPosition = new Matrix4()// a matrix to fix pivot position
      orientation.lookAt(p1, p2, new Vector3(0, 1, 0))// look at destination
      offsetRotation.makeRotationX(HALF_PI)// rotate 90 degs on X
      orientation.multiply(offsetRotation)// combine orientation with rotation transformations
      cylinder.applyMatrix4(orientation)
      cylinder.translate(position.x, position.y, position.z);
      geometries.push(cylinder)

      // sphere at the left end
      let sphereGeometryLeft = new SphereGeometry(DEPTH * 0.15)
      sphereGeometryLeft.translate(p1.x, p1.y, p1.z);
      geometries.push(sphereGeometryLeft)

      // sphere at the right end
      let sphereGeometryRight = new SphereGeometry(DEPTH * 0.15)
      sphereGeometryRight.translate(p2.x, p2.y, p2.z);
      geometries.push(sphereGeometryRight)
    }

    // TODO See drawTube arrow
    if (arrow) {
      const lastPoint = points[points.length -1]
      let coneGeometry = new CylinderGeometry(DEPTH * 0.05, DEPTH * 0.3, DEPTH, 40, 40, false)
      coneGeometry.translate(lastPoint.x, lastPoint.y, lastPoint.z)
      geometries.push(coneGeometry)
    }
        
    
    let mergedGeometry = mergeBufferGeometries(geometries);
    //mergedGeometry.mergeVertices() //doesn't work
        
    const { [colorName]: colorProp = { color: 0xEFEFEF } } = modelColors
    const material = new MeshLambertMaterial({ color: colorProp.color })

    // Anyone know how to make reflective material?
    /* const material = new MeshPhongMaterial( {
      color: 0xffffff,
      specular:0xffffff,
      envMap: this.skyBox,
      combine: MultiplyOperation,
      shininess: 50,
      reflectivity: 1.0
    } ); */

    const mesh = new Mesh(mergedGeometry, material)

    // TODO only two points
    if(name) mesh.add(this.drawLabel(name, points[1], points[2]))

    return mesh

  },

  drawTube(points, colorName, name, arrow) {

    const beforeLastPoint = points[points.length -2]
    const lastPoint = points[points.length -1]
    let direction = new Vector3()
    direction.subVectors(lastPoint, beforeLastPoint).normalize()

    
    // Shorten the last vector to make room for the arrow
    if (arrow) {
      let offset = direction.clone()
      offset.multiplyScalar(DEPTH)
      points[points.length -1].sub(offset)
    }

    let path = new CatmullRomCurve3(this.straightenPoints(points))
    // path.curveType = 'centripetal';
    let geometries = []
    geometries.push(new TubeGeometry(path, 300, DEPTH * 0.07, 16, false))

    if (arrow) {
      let coneGeometry = new CylinderGeometry(DEPTH * 0.05, DEPTH * 0.3, DEPTH, 40, 40, false)
      coneGeometry.translate(0, DEPTH * 0.5, 0)

      // Cone is currently pointing upwards
      var coneVector = new Vector3(0, 1, 0);

      // Create a quaternion, and apply coneVector, then desired direction vector
      var quaternion = new Quaternion();
      quaternion.setFromUnitVectors(coneVector, direction);

      // Quaternion now has rotation data within it. 
      // We'll need to get it out with a Euler()
      var euler = new Euler();
      euler.setFromQuaternion(quaternion);
      let radiansVec = euler.toVector3()

      coneGeometry.rotateX(radiansVec.x)
      coneGeometry.rotateY(radiansVec.y)
      coneGeometry.rotateZ(radiansVec.z)

      coneGeometry.translate(lastPoint.x, lastPoint.y, lastPoint.z)
      geometries.push(coneGeometry)
    }
    
    let mergedGeometry = mergeBufferGeometries(geometries);
    //mergedGeometry.mergeVertices() //doesn't work for buffer geometry
    
    const { [colorName]: colorProp = { color: 0xEFEFEF } } = modelColors
    const material = new MeshLambertMaterial({ 
      color: colorProp.color,
      opacity: 0.5,
      transparent: true,
     })

    let mesh = new Mesh(mergedGeometry, material)
    mesh.name = 'tube - ' + colorName

    if(name) mesh.add(this.drawLabel(name, points[1], points[2]))

    return mesh

  },

  straightenPoints(points) {
    let newPoints = []
    points.forEach((point, i) => {
      if (i === 0) newPoints.push(point)
      else {
        let direction = new Vector3()
        direction.subVectors(point, points[i - 1])
        direction.setLength(RADIUS)
        let newPoint = new Vector3()
        newPoint.subVectors(point, direction)
        newPoints.push(newPoint)
        if (i < points.length - 1) {
          let direction = new Vector3()
          direction.subVectors(point, points[i + 1])
          direction.setLength(RADIUS)
          let newPoint = new Vector3()
          newPoint.subVectors(point, direction)
          newPoints.push(newPoint)
        } else newPoints.push(point)
      }
    })
    return newPoints
  },

  getSidePos (side, pos = new Vector3()) {
    // TODO replace with .raycast ( raycaster : Raycaster, intersects : Array ) : null

    if (side === 'top') return new Vector3(pos.x, pos.y + HEIGHT / 2, pos.z)
    if (side === 'right') return new Vector3(pos.x + WIDTH / 2, pos.y, pos.z)
    if (side === 'bottom') return new Vector3(pos.x, pos.y - HEIGHT / 2, pos.z)
    if (side === 'left') return new Vector3(pos.x - WIDTH / 2, pos.y, pos.z)
    if (side === 'front') return new Vector3(pos.x, pos.y, pos.z + DEPTH / 2)
    if (side === 'back') return new Vector3(pos.x, pos.y, pos.z - DEPTH / 2)
    return pos
  },

  drawLabel(name, pt1, pt2) {

    let labelMesh = this.getTextMesh(name)
    let textPos = new Vector3()
    if (pt2) textPos.lerpVectors(pt1, pt2, 0.5)
    else textPos = pt1
    labelMesh.translateX(textPos.x)
    labelMesh.translateY(textPos.y)
    labelMesh.translateZ(textPos.z + DEPTH * 0.1)
    
    return labelMesh
  },

  getTextMesh( name = 'unnamed', size = HEIGHT / 6 ) {

    const { name: colorProp = { color: 0xEFEFEF }  } = modelColors
    let textMaterial = new MeshLambertMaterial({ color: colorProp.color })
    textMaterial.side = DoubleSide

    const shapes = font.generateShapes(name, size);

    const geometry = new ShapeGeometry(shapes);
    geometry.name = name + " - text geometry"
    geometry.center()

    let textMesh = new Mesh(geometry, textMaterial);
    textMesh.name = name + ' - text mesh'
    return textMesh
  }

}
