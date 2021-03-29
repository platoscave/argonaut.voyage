/* eslint-disable no-unused-vars */
import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import Vue from 'vue' // need this for underscore
import classModelColors from '../config/classModelColors'
import fontJson from '../assets/helvetiker_regular.typeface.json'
const font = new THREE.Font(fontJson)

const WIDTH = 400, HEIGHT = 200, DEPTH = 100, RADIUS = 50

export default class ClassObject3d extends THREE.Object3D {
  constructor(userData, yPos, selectableMeshArr) {
    super()


    this._id = userData._id
    this.name = userData.label
    this.userData = userData

    const { class: assocProps } = classModelColors
    const material = new THREE.MeshLambertMaterial({ color: assocProps.color })

    let mesh = new THREE.Mesh(this.getGeometry(this.userData.docType), material)
    mesh.name = userData.label + ' - 3d mesh'
    this.add(mesh)
    selectableMeshArr.push(mesh)

    let textPosition = new THREE.Vector3(0, 0, DEPTH * 0.6)
    this.addTextMesh(this.name, textPosition)


    // Draw up beam from here to middle
    if (yPos !== 0) {
      let points = []
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, HEIGHT * 2, 0))
      this.add(this.drawBeam(points, 'classConnectors'))
    }

    this.position.setY(yPos);

    //console.log('    ', this._id, this.name, yPos)

  }

  async drawChildren(selectableMeshArr, queryObj, pouch) {

    // Create a deep clone of the queryObj to operate on
    let queryObjClone = JSON.parse(JSON.stringify(queryObj))

    // Replace variables in the mongoQuery
    let selector = queryObjClone.mongoQuery.selector
    for (var key in selector) {
      let cond = selector[key];
      if (cond === "$fk") selector[key] = this.userData._id;
    }
    delete queryObjClone.mongoQuery.sort; // temp hack: https://github.com/pouchdb/pouchdb/issues/6399

    // Execute the mongoQuery
    const result = await pouch.find(queryObjClone.mongoQuery);

    // Collect userData for use durring creation
    const userDataArr = result.docs.map((item) => {
      let assocs = []
      for (let key in item.properties) {
        const prop = item.properties[key]
        if (prop.mongoQuery) assocs.push({ name: key, destId: prop.mongoQuery.selector.classId })
      }
      return {
        _id: item._id,
        label: item.title ? item.title : item.name,
        subQueryIds: queryObjClone.subQueryIds,
        pageId: item.pageId ? item.pageId : queryObjClone.pageId,
        docType: item.docType,
        assocs: assocs
      };
    });

    // If this class has children, draw down beam from here to middle
    if (userDataArr.length) {
      let points = []
      points.push(new THREE.Vector3(0, 0, 0))
      points.push(new THREE.Vector3(0, -HEIGHT * 2, 0))
      this.add(this.drawBeam(points, 'classConnectors'))
    }

    let childrenPronmises = []
    userDataArr.forEach(userData => {

      // Create the child
      let classObj3d = new ClassObject3d(userData, -HEIGHT * 4, selectableMeshArr);
      this.add(classObj3d)

      // Tell the child to draw its children
      if (classObj3d._id !== '5jdnjqxsqmgn') // skip everything under Balance Sheet
        childrenPronmises.push(classObj3d.drawChildren(selectableMeshArr, queryObj, pouch))
    })


    return Promise.all(childrenPronmises);

  }


  setPositionX(xPos) {

    this.translateX(xPos)

    // Position the children.
    // The child x position is relative to this, so we start with 0
    let childX = 0, childrenMaxX = 0
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        childrenMaxX = subClassObj3d.setPositionX(childX)
        childX = childrenMaxX + WIDTH * 2
      }
    });

    // Shift all the children to the left by 50%
    const leftShift = (childrenMaxX) / 2
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        subClassObj3d.translateX(-leftShift)
      }
    });
    // Shift this to the right by the same value
    this.translateX(leftShift)

    // Find the first and last children x values after left shift
    let firstX = -1, lastX = -1
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        if (firstX === -1) firstX = subClassObj3d.position.x
        lastX = subClassObj3d.position.x
      }
    });

    // Draw the horizontal beam, based on the positions of the first and last child
    if (firstX !== -1) {
      let points = []
      points.push(new THREE.Vector3(firstX, -HEIGHT * 2, 0))
      points.push(new THREE.Vector3(lastX, -HEIGHT * 2, 0))
      this.add(this.drawBeam(points, 'classConnectors'))
    }

    // return the original x plus our children max, so that the parent can center itself
    return xPos + childrenMaxX
  }

  drawClassAssocs(glModelObject3D) {

    for (let key in this.userData.assocs) {

      const assoc = this.userData.assocs[key]

      const { [assoc.name]: assocProps } = classModelColors
      if (!assocProps) continue
      const depth = assocProps.depth * -DEPTH - DEPTH

      const destObj3d = glModelObject3D.getObjectByProperty('_id', assoc.destId)
      if (!destObj3d) console.log('Assoc destination not found: ' + assoc)
      if (!destObj3d) continue
      // translate toPosition to our local coordinates
      let destPos = destObj3d.position.clone()
      destPos.applyMatrix4(new THREE.Matrix4().invert(this.matrix))


      let points = []
      points.push(new THREE.Vector3(0, 0, -DEPTH / 2)) // move startpoint to the edge
      points.push(new THREE.Vector3(0, 0, depth))
      let beforeLastPos = destPos.clone()
      beforeLastPos.z = depth
      points.push(beforeLastPos)
      destPos.z = -DEPTH / 2 // move endpoint to the edge
      points.push(destPos)

      this.add(this.drawTube(points, assoc.name, assoc.name, true))

    }
    this.children.forEach((subClassObj3d) => {
      if (subClassObj3d.type === 'Object3D') {
        subClassObj3d.drawClassAssocs(glModelObject3D)
      }
    });

  }

  drawBeam(points, colorName, label, arrow) {

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
    
    if (label) this.addTextMeshBetween(label, points[1], points[2])
    
    
    let mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    //mergedGeometry.mergeVertices() //doesn't work
        
    const { [colorName]: assocProps = { color: 0xEFEFEF } } = classModelColors
    const material = new THREE.MeshLambertMaterial({ color: assocProps.color })

    return new THREE.Mesh(mergedGeometry, material)

  }
  drawTube(points, colorName, label, arrow) {

    let geometries = []

    let path = new THREE.CatmullRomCurve3(this.straightenPoints(points))
    // path.curveType = 'centripetal';
    geometries.push(new THREE.TubeGeometry(path, 300, 7, 8, false))

    if (arrow) {
      const lastPoint = points[points.length -1]
      let coneGeometry = new THREE.CylinderGeometry(0, 40, 100, 40, 40, false)
      coneGeometry.translate(lastPoint.x, lastPoint.y, lastPoint.z)
      //coneGeometry.rotateZ(Math.PI / 2)
      geometries.push(coneGeometry)
    }
    
    if (label) this.addTextMeshBetween(label, points[1], points[2])
    
    
    let mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    //mergedGeometry.mergeVertices() //doesn't work
        
    const { [colorName]: assocProps = { color: 0xEFEFEF } } = classModelColors
    const material = new THREE.MeshLambertMaterial({ color: assocProps.color })

    return new THREE.Mesh(mergedGeometry, material)

  }

  getGeometry(docType) {
    const x = 0, y = 0

    let shape = new THREE.Shape()
    if (docType === 'class')
      shape.moveTo(x, y + HEIGHT / 3)
        .lineTo(x, (y + HEIGHT / 3) * 2)
        .lineTo(x + WIDTH / 2, y + HEIGHT)
        .lineTo(x + WIDTH, (y + HEIGHT / 3) * 2)
        .lineTo(x + WIDTH, y + HEIGHT / 3)
        .lineTo(x + WIDTH / 2, y)
    else
      shape.moveTo(x, y)
        .lineTo(x, y + HEIGHT / 2)
        .lineTo(x + WIDTH / 2, y + HEIGHT)
        .lineTo(x + WIDTH, y + HEIGHT / 2)
        .lineTo(x + WIDTH, y)

    // extruded shape
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
    let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.title + " - 3d geometry"
    geometry.center()

    return geometry
  }

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
  }

  addTextMeshBetween(name, pointA, pointB) {
    if (!name) name = 'unnamed'
    let textPosition = new THREE.Vector3()
    textPosition.subVectors(pointB, pointA).divideScalar(2)
    textPosition.add(pointA)
    textPosition.setZ(textPosition.z + 20)
    this.addTextMesh(name, textPosition)
  }
  
  addTextMesh(name, textPosition) {
    if (!name) name = 'unnamed'
    let textMaterial = new THREE.MeshLambertMaterial({ color: 0xEFEFEF })
    const shapes = font.generateShapes(name, HEIGHT / 6);
    const geometry = new THREE.ShapeGeometry(shapes);
    geometry.name = name + " - text geometry"
    geometry.center()
    let textMesh = new THREE.Mesh(geometry, textMaterial);
    textMesh.name = name + ' - text mesh'
    textMesh.position.set(textPosition.x, textPosition.y, textPosition.z)
    this.add(textMesh);
  }

//Old
//Old
//Old
//Old
//Old
//Old
//Old

drawTubeTopSideToBottom(toObj3d, name) {
  // translate toPosition to our local coordinates
  let toPosition = toObj3d.position.clone()
  toPosition.applyMatrix4(new THREE.Matrix4().getInverse(this.matrix))

  let material = this.mapAssocNameToMaterial(name)

  let coneGeometry = new THREE.CylinderGeometry(0, 40, 100, 40, 40, false)
  let coneMesh = new THREE.Mesh(coneGeometry, material)

  let fromPos, toPos
  let points = []

  if (toObj3d.userData.docType === 'class') {
    fromPos = this.getSidePos('back', new THREE.Vector3())
    toPos = this.getSidePos('back', toPosition)
    let endPos = toPos.clone()
    endPos.setZ(endPos.z - 60)

    let assocDepth = (this.mapAssocNameToDepth(name) * DEPTH * 2) + (DEPTH * 2)

    points.push(fromPos)
    points.push(new THREE.Vector3(fromPos.x, fromPos.y, fromPos.z - assocDepth))
    if (toPos.y !== fromPos.y) points.push(new THREE.Vector3(fromPos.x, toPos.y, fromPos.z - assocDepth))
    points.push(new THREE.Vector3(toPos.x, toPos.y, toPos.z - assocDepth))
    points.push(endPos)

    coneMesh.rotation.x = Math.PI / 2
    coneMesh.position.set(toPos.x, toPos.y, toPos.z - 40)
  } else if (toPosition.y < 0) {
    fromPos = this.getSidePos('bottom', new THREE.Vector3())
    toPos = this.getSidePos('top', toPosition)
    let endPos = toPos.clone()
    endPos.setY(endPos.y + 60)

    points.push(fromPos)
    points.push(new THREE.Vector3(fromPos.x, fromPos.y - HEIGHT * 1.5, fromPos.z))
    if (toPos.x !== fromPos.x) points.push(new THREE.Vector3(toPos.x, fromPos.y - HEIGHT * 1.5, fromPos.z))
    points.push(new THREE.Vector3(toPos.x, toPos.y + HEIGHT * 1.5, toPos.z))
    points.push(endPos)

    coneMesh.rotation.z = -Math.PI
    coneMesh.position.set(toPos.x, toPos.y + 40, toPos.z)
  } else if (toPosition.y > 0) {
    fromPos = this.getSidePos('top', new THREE.Vector3())
    toPos = this.getSidePos('bottom', toPosition)
    let endPos = toPos.clone()
    endPos.setY(endPos.y - 60)

    points.push(fromPos)
    points.push(new THREE.Vector3(fromPos.x, fromPos.y + HEIGHT * 1.5, fromPos.z))
    if (toPos.x !== fromPos.x) points.push(new THREE.Vector3(toPos.x, fromPos.y + HEIGHT * 1.5, fromPos.z))
    points.push(new THREE.Vector3(toPos.x, toPos.y - HEIGHT * 1.5, toPos.z))
    points.push(endPos)

    coneMesh.position.set(toPos.x, toPos.y - 40, toPos.z)
  } else {
    fromPos = this.getSidePos('bottom', new THREE.Vector3())
    toPos = this.getSidePos('bottom', toPosition)
    let endPos = toPos.clone()
    endPos.setY(endPos.y - 60)

    points.push(fromPos)
    points.push(new THREE.Vector3(fromPos.x, fromPos.y - HEIGHT * 1.5, fromPos.z))
    if (toPos.x !== fromPos.x) points.push(new THREE.Vector3(toPos.x, fromPos.y - HEIGHT * 1.5, fromPos.z))
    points.push(new THREE.Vector3(toPos.x, toPos.y - HEIGHT * 1.5, toPos.z))
    points.push(endPos)

    coneMesh.position.set(toPos.x, toPos.y - 40, toPos.z)
  }

  let path = new THREE.CatmullRomCurve3(this.straightenPoints(points))
  // path.curveType = 'centripetal';
  let geometry = new THREE.TubeGeometry(path, 300, 7, 8, false)
  let mesh = new THREE.Mesh(geometry, material)
  this.add(mesh)

  this.add(coneMesh)

  this.addTextMeshBetween(name, points[1], points[2])
}
  drawObjectToClassBeam(length) {
    let fomPos = new THREE.Vector3(0, -HEIGHT / 4, 0)
    let toPos = fomPos.clone()
    toPos.setZ(length)
    let connectorMaterial = new THREE.MeshLambertMaterial({ color: 0xEFEFEF })
    this.add(this.drawBeam(fomPos, toPos, connectorMaterial))
  }
  drawObjectAssocs(placeholderObj3d) {
    const getAssocs = (properties) => {
      let resultsArr = []
      Object.keys(properties).forEach(key => {
        let obj = properties[key]
        if (key !== 'ownerId') {
          let nameColor = classModelColors.nameColor[key]
          // if (nameColor) console.log('obj.constructor', obj.constructor, obj)
          if (nameColor && nameColor !== 'ownerId' && obj.constructor === String) resultsArr.push({ name: key, key: obj })
        }
        if (Array.isArray(obj)) {
          obj.forEach(subObj => {
            resultsArr = resultsArr.concat(getAssocs(subObj))
          })
        }
      })
      return resultsArr
    }
    if (!this.userData) return
    let assocsArr = getAssocs(this.userData)
    assocsArr.forEach(assoc => {
      let assocToObj3d = placeholderObj3d.getObjectByProperty('_id', assoc._id)
      if (!assocToObj3d) console.warn('Cant find ' + assoc._id + ' from ' + this.name + ': ' + this._id)
      else this.drawTubeTopSideToBottom(assocToObj3d, assoc.name)
    })
  }
}
