import {
  Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh,
  MeshBasicMaterial, BufferGeometry, CylinderGeometry, TextureLoader,
  ShapeGeometry, MeshPhongMaterial, Color, NoBlending,
  DoubleSide, BoxGeometry, PlaneGeometry,  Vector3
} from 'three'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { db } from "~/services/dexieServices";
import { drawTube, getSidePos } from "~/lib/threejsUtils"

import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"

/* HTML in 3D is hard
Combining WebGLRenderer & CSS3DRenderer
uses iframe: https://github.com/pmndrs/react-three-fiber/discussions/820?sort=new#discussioncomment-135336
HTML <div> element with shadow and shine. (DOM + WebGL "mixed mode" with Three.js):
cant get this to work https://codepen.io/trusktr/pen/RjzKJx?editors=0110
Alternatives: SVG with embedded HTML to canvas, then use the canvas as texture. the links won't work
http://man.hubwiz.com/docset/JavaScript.docset/Contents/Resources/Documents/developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas.html
and: https://robert.ocallahan.org/2011/11/drawing-dom-content-to-canvas.html
Wonky solution:
https://r105.threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
Doesn't work. cant do html: https://github.com/canvg/canvg
*/

export default class AgreementObject3d extends Object3D {

  constructor(userData) {
    super()

    this._id = userData._id
    this.name = userData.name + ' - object3d'
    this.userData = userData



    const geometry = new PlaneGeometry(WIDTH, WIDTH * 1.41)
    const material = new MeshBasicMaterial({ color: '#F00', side	: DoubleSide, })
    const mesh = new Mesh(geometry, material);
    this.add(mesh)

    this.getCSS3DObject()

  }


  async getCSS3DObject() {

    const idsToGetArr = [
      'class', 'provider', 'asset', 'consumer', 'proposition', 'process', 'currentStep'
    ]
    // Get the objects corresponding to the names above
    const objectPromisesArr = idsToGetArr.map(idName => {
      if (this.userData[idName + 'Id']) return db.state.get(this.userData[idName + 'Id'])
      else return Promise.resolve({ name: undefined })
    })
    const objectsArr = await Promise.all(objectPromisesArr)

    // Get the location string for the links
    const locationStr =
      window.location.protocol + '//' +
      window.location.hostname + ':' +
      window.location.port + '/#/'
    const agreementClass = objectsArr[0]
    let contractStr = agreementClass.properties.recardianContract.const.replaceAll('${locationStr}', locationStr);

    // Replace ids and names in the contract string
    idsToGetArr.forEach((idName, idx) => {
      contractStr = contractStr.replaceAll('${' + idName + 'Id}', this.userData[idName + 'Id']);
      contractStr = contractStr.replaceAll('${' + idName + 'Name}', objectsArr[idx].name);
    })

    // Replace amount, currency
    contractStr = contractStr.replaceAll('${amount}', this.userData.amount);
    contractStr = contractStr.replaceAll('${currency}', this.userData.currency);

    // Replace expirationDate with long date
    const locale = window.navigator.userLanguage || window.navigator.language;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    const dateStr = (new Date(this.userData.expirationDate)).toLocaleDateString(locale, options);
    contractStr = contractStr.replaceAll('${expirationDate}', dateStr);

    // Make the element
    const element = document.createElement('div');
    element.innerHTML = contractStr
    const width = WIDTH * 100
    element.style.width = width + 'px';
    element.style.height = width * 1.41 + 'px';
    element.style.opacity = 0.95;
    element.style.boxSizing = 'border-box'
    element.style.padding = '10px'
    element.style.background = '#eee'
    element.style.color = '#000'

    // Add css3dobject
    this.add(new CSS3DObject(element))

  }

  drawAgreementConnectors(glModelObject3D) {

    const idsToGetArr = [
      'provider', 'asset', 'consumer', 'proposition', 'process', 'currentStep'
    ]

    idsToGetArr.forEach( idName => {
      const destObj3d = glModelObject3D.getObjectByProperty('_id', this.userData[idName+'Id'])
      debugger
      if(destObj3d) this.drawTubeBackSideToFrontSide(destObj3d)
    })

  }


  drawTubeBackSideToFrontSide(destProcessObj3d) {

    // Get sourcePos in world coordinates
    let sourcePos = new Vector3()
    this.getWorldPosition(sourcePos)

    // Get destPos in world coordinates
    let destPos = new Vector3()
    destProcessObj3d.getWorldPosition(destPos)

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

    this.add(drawTube(points, 'active', 'processId', true))

  }
}
