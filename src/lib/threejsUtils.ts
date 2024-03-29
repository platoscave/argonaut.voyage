import {
  Object3D, CylinderGeometry,
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
  ShapeGeometry,
  Shape,
  TextureLoader,
  MeshBasicMaterial,
  ExtrudeGeometry,
  Group
} from 'three'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import threejsColors from '~/config/threejsColors'
import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
//import fontJson from '../../../../assets/helvetiker_regular.typeface.json'
import fontJson from '~/assets/helvetiker_regular.typeface.json'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"


export const drawBeam = <Mesh>(points: Vector3[], colorName: string, name: string, arrow: boolean) => {

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
    const lastPoint = points[points.length - 1]
    let coneGeometry = new CylinderGeometry(DEPTH * 0.05, DEPTH * 0.3, DEPTH, 40, 40, false)
    coneGeometry.translate(lastPoint.x, lastPoint.y, lastPoint.z)
    geometries.push(coneGeometry)
  }


  let mergedGeometry = mergeBufferGeometries(geometries);
  //mergedGeometry.mergeVertices() //doesn't work

  const { [colorName]: colorProp = { color: 0xEFEFEF } } = threejsColors
  const material = new MeshLambertMaterial({ color: colorProp.color })

  const mesh = new Mesh(mergedGeometry, material)

  // TODO only two points
  if (name) mesh.add(drawLabel(name, points[1], points[2]))

  return mesh

}


export const drawTubeBackSideToFrontSide = <Mesh>(
  sourceObj3d: Object3D, 
  destObj3d: Object3D,  
  colorName: string, 
  name: string, 
  arrow: boolean = true, 
  opacity: number = 1) => {

  // Get sourcePos in world coordinates
  let sourcePos = new Vector3()
  sourceObj3d.getWorldPosition(sourcePos)

  // Get destPos in world coordinates
  let destPos = new Vector3()
  destObj3d.getWorldPosition(destPos)

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

  return drawTube(points, colorName, name, arrow, opacity)

}

export const drawTube = <Mesh>(
  points: Vector3[], 
  colorName: string, 
  name: string, 
  arrow: boolean = true, 
  opacity: number = 1) => {

  const beforeLastPoint = points[points.length - 2]
  const lastPoint = points[points.length - 1]
  let direction = new Vector3()
  direction.subVectors(lastPoint, beforeLastPoint).normalize()


  // Shorten the last vector to make room for the arrow
  if (arrow) {
    let offset = direction.clone()
    offset.multiplyScalar(DEPTH)
    points[points.length - 1].sub(offset)
  }

  let path = new CatmullRomCurve3(straightenPoints(points))
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
    const radiansVec = new Vector3().setFromEuler(euler)
    //let radiansVec = euler.toVector3()

    coneGeometry.rotateX(radiansVec.x)
    coneGeometry.rotateY(radiansVec.y)
    coneGeometry.rotateZ(radiansVec.z)

    coneGeometry.translate(lastPoint.x, lastPoint.y, lastPoint.z)
    geometries.push(coneGeometry)
  }

  let mergedGeometry = mergeBufferGeometries(geometries);
  //mergedGeometry.mergeVertices() //doesn't work for buffer geometry

  const { [colorName]: colorProp = { color: 0xEFEFEF } } = threejsColors
  const material = new MeshLambertMaterial({
    color: colorProp.color,
    opacity: opacity,
    transparent: true,
    depthWrite: false // prevent tranparency from making other objects (patially) transparent
  })

  let mesh = new Mesh(mergedGeometry, material)
  mesh.name = 'tube - ' + name

  if (name) mesh.add(drawLabel(name, points[1], points[2], opacity))

  return mesh

}

const straightenPoints = <Vector3>(points: Vector3[]) => {
  let newPoints: Vector3[] = []
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
}

export const getSidePos = <Vector3>(side: string, pos: Vector3) => {
  // TODO replace with .raycast ( raycaster : Raycaster, intersects : Array ) : null

  if (side === 'top') return new Vector3(pos.x, pos.y + HEIGHT / 2, pos.z)
  if (side === 'right') return new Vector3(pos.x + WIDTH / 2, pos.y, pos.z)
  if (side === 'bottom') return new Vector3(pos.x, pos.y - HEIGHT / 2, pos.z)
  if (side === 'left') return new Vector3(pos.x - WIDTH / 2, pos.y, pos.z)
  if (side === 'front') return new Vector3(pos.x, pos.y, pos.z + DEPTH / 2)
  if (side === 'back') return new Vector3(pos.x, pos.y, pos.z - DEPTH / 2)
  return pos
}

const drawLabel = <Mesh>(name: string, pt1: Vector3, pt2: Vector3, opacity: number = 1) => {

  let labelMesh = getTextMesh(name, null, opacity)
  let textPos = new Vector3()
  if (pt2) textPos.lerpVectors(pt1, pt2, 0.5)
  else textPos = pt1
  labelMesh.translateX(textPos.x)
  labelMesh.translateY(textPos.y)
  labelMesh.translateZ(textPos.z + DEPTH * 0.1)

  return labelMesh
}

export const getTextMesh = <Mesh>(name: string = 'unnamed', size: number = HEIGHT / 6, opacity: number = 1) => {
  const font = new Font(fontJson)

  const { name: colorProp = { color: 0xEFEFEF } } = threejsColors
  let textMaterial = new MeshLambertMaterial({ 
    color: colorProp.color,
    opacity: opacity,
    transparent: true, 
    depthWrite: false // prevent tranparency from making other objects (patially) transparent
  })
  textMaterial.side = DoubleSide

  const shapes = font.generateShapes(name, size);

  const geometry = new ShapeGeometry(shapes);
  geometry.name = name + " - text geometry"
  geometry.center()

  let textMesh = new Mesh(geometry, textMaterial);
  textMesh.name = name + ' - text mesh'
  return textMesh
}



export const getRoundedRectShape = (height: number, width: number, radius: number) => {
  const x = 0, y = 0

  // Rounded rect
  let shape = new Shape()
  shape.moveTo(x, y + radius)
    .lineTo(x, y + height - radius)
    .quadraticCurveTo(x, y + height, x + radius, y + height)
    .lineTo(x + width - radius, y + height)
    .quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
    .lineTo(x + width, y + radius)
    .quadraticCurveTo(x + width, y, x + width - radius, y)
    .lineTo(x + radius, y)
    .quadraticCurveTo(x, y, x, y + radius)

  return shape
}

export const getAvatarMesh = <Mesh>(icon: string) => {

  const shape = getRoundedRectShape(HEIGHT * .5, HEIGHT * .5, HEIGHT / 16)
  const texture = new TextureLoader().load('icons/' + icon);
  const material = new MeshBasicMaterial({ map: texture });

  // extruded shape
  let extrudeSettings = { depth: DEPTH * .1, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
  let geometry = new ExtrudeGeometry(shape, extrudeSettings)
  geometry.scale(1.5, 1.5, 1)
  const imageMaterial = new MeshBasicMaterial({ map: texture });
  const { 'object': colorProp = { color: 0xEFEFEF } } = threejsColors
  const material2 = new MeshLambertMaterial({ color: colorProp.color })

  const materials = [
    imageMaterial, // back front
    material2, // side
  ]
  return new Mesh(geometry, materials);

}

//TODO doesn't work yet
export const getSvgAvatar = <Object3D>(icon: string) => {
  // instantiate a loader
  const loader = new SVGLoader();

  // load a SVG resource
  loader.load(
    // resource URL
    'icons/' + icon,
    // called when the resource is loaded
    function (data) {

      const paths = data.paths;
      const group = new Object3D();

      for (let i = 0; i < paths.length; i++) {

        const path = paths[i];

        const material = new MeshBasicMaterial({
          color: path.color,
          side: DoubleSide,
          depthWrite: false
        });

        const shapes = SVGLoader.createShapes(path);

        for (let j = 0; j < shapes.length; j++) {

          const shape = shapes[j];
          // const geometry = new ShapeGeometry(shape);
          // extruded shape
          let extrudeSettings = { depth: DEPTH * .1, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
          let geometry = new ExtrudeGeometry(shape, extrudeSettings)
          const mesh = new Mesh(geometry, material);
          group.add(mesh);

        }

      }

      return group;

    }
  )
}
