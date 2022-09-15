import argoQueryPromise from "~/lib/argoQueryPromise";
import { take } from 'rxjs/operators';
import { Object3D, Vector3, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh } from 'three'
import { drawBeam, drawTube, getSidePos, getTextMesh } from "~/lib/threejsUtils"
import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"


export default class OrgObject3d extends Object3D {

  constructor(userData, isRoot) {
    super()

    this._id = userData._id
    this.name = userData.name + ' - object3d'
    this.userData = userData

    let orgMesh = this.getMesh()
    orgMesh.name = userData.name + ' - 3d mesh'
    this.add(orgMesh)

    let textMesh = getTextMesh(userData.name)
    textMesh.translateZ(DEPTH * 0.6)
    orgMesh.add(textMesh)


    // Draw up beam from here to middle if this is not the root org
    if (!isRoot) {
      let points = []
      points.push(new Vector3(0, 0, 0))
      points.push(new Vector3(0, HEIGHT * 2, 0))
      this.add(drawBeam(points, 'orgConnectors'))
    }
  }

  async drawOrgUnits(addSelectable) {

    // Execute the query
    const resArr = await argoQueryPromise("o4jhldcqvbep", this.userData )

    // Enrich items with an array of assocs that need to be drawn
    resArr.map((item) => {
      item.assocs = []
      for (let key in item.properties) {
        const prop = item.properties[key]
        if (prop.argoQuery) item.assocs.push({ name: key, destId: prop.argoQuery.where.classId })
      }
      return item;
    })

    // If this org has children, draw down beam from here to middle
    if (resArr.length) {
      let points = []
      points.push(new Vector3(0, 0, 0))
      points.push(new Vector3(0, -HEIGHT * 2, 0))
      this.add(drawBeam(points, 'orgConnectors'))
    }

    let childrenPronmises = []
    resArr.forEach(userData => {

      // Create the child
      let orgObj3d = new OrgObject3d(userData)
      addSelectable(orgObj3d.children[0])
      orgObj3d.translateY(-HEIGHT * 4)
      this.add(orgObj3d)

      // Tell the child to draw its children
      if (orgObj3d._id !== '5jdnjqxsqmgn') // skip everything under Balance Sheet
        childrenPronmises.push(orgObj3d.drawOrgUnits(addSelectable))
    })


    return Promise.all(childrenPronmises);

  }

  setPositionX(xPos) {

    this.translateX(xPos)

    // Position the children.
    // The child x position is relative to this, so we start with 0
    let childX = 0, childrenMaxX = 0
    this.children.forEach((subOrgObj3d) => {
      if (subOrgObj3d.type === 'Object3D') {
        childrenMaxX = subOrgObj3d.setPositionX(childX)
        childX = childrenMaxX + WIDTH * 2
      }
    });

    // Shift all the children to the left by 50%
    const leftShift = (childrenMaxX) / 2
    this.children.forEach((subOrgObj3d) => {
      if (subOrgObj3d.type === 'Object3D') {
        subOrgObj3d.translateX(-leftShift)
      }
    });
    // Shift this to the right by the same value
    this.translateX(leftShift)

    // Find the first and last children x values after left shift
    let firstX = -1, lastX = -1
    this.children.forEach((subOrgObj3d) => {
      if (subOrgObj3d.type === 'Object3D') {
        if (firstX === -1) firstX = subOrgObj3d.position.x
        lastX = subOrgObj3d.position.x
      }
    });

    // Draw the horizontal beam, based on the positions of the first and last child
    if (firstX !== -1) {
      let points = []
      points.push(new Vector3(firstX, -HEIGHT * 2, 0))
      points.push(new Vector3(lastX, -HEIGHT * 2, 0))
      this.add(drawBeam(points, 'orgConnectors'))
    }

    // return the original x plus our children max, so that the parent can center itself
    return xPos + childrenMaxX
  }


  drawUnitToUserConnectors(glModelObject3D) {

    const drawAssocs = userAccId => {

      const destObj3d = glModelObject3D.getObjectByProperty('_id', userAccId)
      if (!destObj3d) console.log('Assoc destination not found: ', this._id, userAccId)
      //if (!destObj3d) console.log(this)
      if (!destObj3d) return

      // Get positions in world coordinates
      let sourcePos = new Vector3()
      this.getWorldPosition(sourcePos)
      let destPos = new Vector3()
      destObj3d.getWorldPosition(destPos)

      const points = this.addCorners(sourcePos, destPos)

      this.add(drawTube(points, 'active', 'active', true))

    }

    this.userData.permissions.forEach( permission => {
      if(permission.perm_name === 'active') {
        permission.required_auth.accounts.forEach( account => {
          drawAssocs(account.permission.actor)
        })
      }
    })


    this.children.forEach((subOrgObj3d) => {
      if (subOrgObj3d.type === 'Object3D') {
        if (subOrgObj3d.drawUnitToUserConnectors)
          subOrgObj3d.drawUnitToUserConnectors(glModelObject3D)
      }
    });


  }

  addCorners(sourcePos, destPos) {
    let points = []
    
    let difVec = destPos.clone().sub(sourcePos)

    let sourceBackPos = getSidePos('back', new Vector3())
    let sourceBusPos = new Vector3(0, 0, -DEPTH * 4)
    let destBottomPos = getSidePos('bottom', difVec)
    let destBusPos = difVec.clone().setY(sourceBackPos.y)

    points.push(sourceBackPos)
    points.push(sourceBusPos)
    points.push(destBusPos)
    points.push(destBottomPos)

    return points

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
    let extrudeSettings = { depth: DEPTH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.title + " - 3d geometry"
    geometry.center()

    //const { org: colorProp = { color: 0xEFEFEF }  } = threejsColors
    //console.log(this.userData.classId)
    const { [this.userData.classId]: colorProp = { color: 0xEFEFEF } } = threejsColors

    const material = new MeshLambertMaterial({ color: colorProp.color })

    return new Mesh(geometry, material)
  }
}
