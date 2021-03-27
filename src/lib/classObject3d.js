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


    let mesh = new THREE.Mesh(this.getGeometry(), this.getMaterial())
    mesh.name = userData.label + ' - 3d mesh'
    this.add(mesh)
    selectableMeshArr.push(mesh)

    let textPosition = new THREE.Vector3(0, 0, DEPTH * 0.6)
    this.addTextMesh(this.name, textPosition)


    // Draw up beam from here to middle
    if (yPos !== 0) {
      let p2 = new THREE.Vector3(0, HEIGHT * 2, 0)
      const parentBeamMesh = this.drawBeam(new THREE.Vector3(0, 0, 0), p2, this.mapAssocNameToMaterial())
      this.add(parentBeamMesh)
    }

    this.position.setY(yPos);
    this.updateMatrix()

    console.log('    ', this._id, this.name, yPos)

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
      //console.log("item - " +idx, item);
      return {
        _id: item._id,
        label: item.title ? item.title : item.name,
        subQueryIds: queryObjClone.subQueryIds,
        pageId: item.pageId ? item.pageId : queryObjClone.pageId,
        docType: item.docType,
      };
    });

    // If this class has children, draw down beam from here to middle
    if (userDataArr.length) {
      let p2 = new THREE.Vector3(0, -HEIGHT * 2, 0)
      const childrenBeamMesh = this.drawBeam(new THREE.Vector3(0, 0, 0), p2, this.mapAssocNameToMaterial())
      this.add(childrenBeamMesh)
    }

    let childrenPronmises = []
    userDataArr.forEach(userData => {

      // Create the child
      let classObj3d = new ClassObject3d(userData, -HEIGHT * 4, selectableMeshArr);
      this.add(classObj3d)

      // Tell the child to draw its children
      if(classObj3d._id !== '5jdnjqxsqmgn') // skip everything under Balance Sheet
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
        if(firstX === -1) firstX = subClassObj3d.position.x
        lastX = subClassObj3d.position.x
      }
    });

    // Draw the horizontal beam, based on the positions of the first and last child
    let q1 = new THREE.Vector3(firstX, -HEIGHT * 2, 0)
    let q2 = new THREE.Vector3(lastX, -HEIGHT * 2, 0)
    const horizontalBeamMesh = this.drawBeam(q1, q2, this.mapAssocNameToMaterial(), true)
    this.add(horizontalBeamMesh)

    // return the original x plus our children max, so that the parent can 
    return xPos + childrenMaxX
  }

  drawClassBeams() {
    if (this.subclassesObj3ds.length > 0) {
      let connectorMaterial = this.mapAssocNameToMaterial()

      // matrix to translate positions to our local coordinates
      let ourInverseMatrix = new THREE.Matrix4().getInverse(this.matrix)

      // vertical beam from parent class to horizontal beam
      let parentEndPosition = new THREE.Vector3(0, HEIGHT * -2, 0)
      this.add(this.drawBeam(new THREE.Vector3(), parentEndPosition, connectorMaterial))

      // horizontal beam
      let beamStartPos = this.subclassesObj3ds[0].position.clone()
      beamStartPos.applyMatrix4(ourInverseMatrix)
      beamStartPos.setY(HEIGHT * -2)
      let beamEndPos = this.subclassesObj3ds[this.subclassesObj3ds.length - 1].position.clone()
      beamEndPos.applyMatrix4(ourInverseMatrix)
      beamEndPos.setY(HEIGHT * -2)
      this.add(this.drawBeam(beamStartPos, beamEndPos, connectorMaterial))

      // sphere at the left end
      let sphereGeometryLeft = new THREE.SphereGeometry(15)
      let sphereMeshLeft = new THREE.Mesh(sphereGeometryLeft, connectorMaterial)
      sphereMeshLeft.position.set(beamStartPos.x, beamStartPos.y, beamStartPos.z)
      this.add(sphereMeshLeft)
      // sphere at the right end
      let sphereGeometry = new THREE.SphereGeometry(15)
      let sphereMesh = new THREE.Mesh(sphereGeometry, connectorMaterial)
      sphereMesh.position.set(beamEndPos.x, beamEndPos.y, beamEndPos.z)
      this.add(sphereMesh)

      // for each of the subclasses
      this.subclassesObj3ds.forEach(childObj3d => {
        // beam from child class to horizontal beam
        let childBeamStartPos = childObj3d.position.clone()
        childBeamStartPos.applyMatrix4(ourInverseMatrix)
        childBeamStartPos.setY(HEIGHT * -2)
        let childBeamEndPos = childObj3d.position.clone()
        childBeamEndPos.applyMatrix4(ourInverseMatrix)
        childBeamEndPos.setY(HEIGHT * -4)
        this.add(this.drawBeam(childBeamStartPos, childBeamEndPos, connectorMaterial))

        // tell the subclass to draw it's class beams
        childObj3d.drawClassBeams()
      })
    }
  }
  drawClassAssocs(placeholderObj3d) {
    const getAssocs = (properties) => {
      let resultsArr = []
      Object.keys(properties).forEach(key => {
        let obj = properties[key]
        let toKey = ''//_.get(obj, 'query.from')
        if (toKey && toKey !== 'classes') resultsArr.push({ _id: _id, name: obj.title, XXXkey: toKey })
        let subProperties = ''//_.get(obj, 'items.properties')
        if (subProperties) resultsArr = resultsArr.concat(getAssocs(subProperties))
      })
      return resultsArr
    }

    let properties = this.userData.properties
    if (!properties) return
    let assocsArr = getAssocs(properties)
    console.log('assocsArr', assocsArr)

    assocsArr.forEach(assoc => {
      let assocToObj3d = placeholderObj3d.getObjectByProperty('_id', assoc._id)

      if (!assocToObj3d) console.error('Assoc destination mot found', assoc)
      else this.drawTubeTopSideToBottom(assocToObj3d, assoc._id)
    })
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
  drawBeam(p1, p2, material, caps) {
    let geometries = []

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

    if (caps) {
      // sphere at the left end
      let sphereGeometryLeft = new THREE.SphereGeometry(15)
      sphereGeometryLeft.translate(p1.x, p1.y, p1.z);
      geometries.push(sphereGeometryLeft)

      // sphere at the right end
      let sphereGeometryRight = new THREE.SphereGeometry(15)
      sphereGeometryRight.translate(p2.x, p2.y, p2.z);
      geometries.push(sphereGeometryRight)
    }

    let mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    return new THREE.Mesh(mergedGeometry, material)

  }
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
  mapAssocNameToMaterial(name) {
    let nameColor = classModelColors.nameColor[name]
    if (nameColor) return new THREE.MeshLambertMaterial({ color: nameColor.color })
    if (name) console.warn('Add color to classModelColors', name)
    return new THREE.MeshLambertMaterial({ color: 0xEFEFEF }) // grey, class connectors
  }
  mapAssocNameToDepth(name) {
    let nameColor = classModelColors.nameColor[name]
    if (nameColor) return nameColor.depth
    return 0
  }
  getMaterial() {
    let nameColor = classModelColors.nameColor[this.userData.docType]
    if (nameColor) return new THREE.MeshLambertMaterial({ color: nameColor.color })
    return new THREE.MeshLambertMaterial({ color: 0x00A300 }) // green
  }
  getSidePos(side, pos) {
    if (side === 'top') return new THREE.Vector3(pos.x, pos.y + HEIGHT / 2, pos.z)
    if (side === 'right') return new THREE.Vector3(pos.x + WIDTH / 2, pos.y, pos.z)
    if (side === 'bottom') return new THREE.Vector3(pos.x, pos.y - HEIGHT / 2, pos.z)
    if (side === 'left') return new THREE.Vector3(pos.x - WIDTH / 2, pos.y, pos.z)
    if (side === 'front') return new THREE.Vector3(pos.x, pos.y, pos.z + DEPTH / 2)
    if (side === 'back') return new THREE.Vector3(pos.x, pos.y, pos.z - DEPTH / 2)
    return pos
  }
  getGeometry() {
    const x = 0, y = 0

    let shape = new THREE.Shape()
    if (this.userData.docType === 'class')
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
}
