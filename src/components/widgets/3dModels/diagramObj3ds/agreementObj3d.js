import { Object3D, Shape, ExtrudeGeometry, MeshLambertMaterial, Mesh, 
  MeshBasicMaterial, BufferGeometry, CylinderGeometry, TextureLoader, 
  ShapeGeometry, MeshPhongMaterial, Color, NoBlending, 
  DoubleSide, BoxGeometry } from 'three'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

import { getTextMesh, getAvatarMesh, getRoundedRectShape } from "~/lib/threejsUtils"
import threejsColors from '~/config/threejsColors'
import { WIDTH, HEIGHT, DEPTH, RADIUS } from "~/config/threejsGridSize"


export default class AgreementObject3d extends Object3D {

  constructor(userData) {
    super()

    this._id = userData._id
    this.name = userData.name + ' - object3d'
    this.userData = userData



    const shape = getRoundedRectShape(4, 4, .1)
    const material = new MeshBasicMaterial({color: '#F00'})
    const geometry = new ShapeGeometry(shape);
    const mesh = new Mesh(geometry, material);
    this.add(mesh)

    const content = `<div>` +
      `<h1>Purchase Agreement</h1>` +
      `<p>${userData.providerId} promisses to deliver ${userData.assestId} to ${userData.consumerId} by ` +
      `${userData.expirationDate} for the ammount of ${userData.amount} ${userData.currency}</p>` +
      `<p>Proposition: ${userData.processId} </p>` +
      `<p>Process: ${userData.processId} </p>` +
      `<p>Current Step: ${userData.currentStepId} </p>` +
      `</div>`;


    // convert the string to dome elements
    const wrapper = document.createElement('div');
    wrapper.innerHTML = content;
    const div = wrapper.firstChild;

    // set some values on the div to style it.
    // normally you do this directly in HTML and 
    // CSS files.
    div.name = 'css div';
    div.style.width = '400px';
    div.style.height = '400px';
    div.style.opacity = .8;
    div.style.background = '#eee'
    div.style['border-radius'] = '10px';
    div.style.padding = '10px';
    div.style.color = 'black';

        // create a CSS3Dobject and return it.
        const object = new CSS3DObject(div);
        this.add( object)

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
    let extrudeSettings = { depth: DEPTH * .45, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: DEPTH * 0.01, bevelThickness: DEPTH * 0.01 }
    let geometry = new ExtrudeGeometry(shape, extrudeSettings)
    geometry.name = this.userData.name + " - 3d geometry"
    geometry.center()

    const { 'object': colorProp = { color: 0xEFEFEF } } = threejsColors
    const material = new MeshLambertMaterial({ color: colorProp.color })
    return new Mesh(geometry, material)
  }


  makeElementObject = (content, width, height) => {
    const obj = new Object3D()

    // See https://codepen.io/trusktr/details/RjzKJx


    // convert the string to dome elements
    const wrapper = document.createElement('div');
    wrapper.name = 'Css div';
    wrapper.innerHTML = content;
    const div = wrapper.firstChild;

    // set some values on the div to style it.
    // normally you do this directly in HTML and 
    // CSS files.
    div.style.width = '370px';
    div.style.height = '370px';
    div.style.opacity = 1;
    div.style.background = 'rgba(238,238,238,.5)'

    // create a CSS3Dobject and return it.
    const object = new CSS3DObject(div);
    obj.add( object)

    // make an invisible plane for the DOM element to chop
    // clip a WebGL geometry with it.
    const material = new MeshPhongMaterial({
      opacity: 0.15,
      color: new Color(0x111111),
      blending: NoBlending,
      // side : DoubleSide,
    });
    const geometry = new BoxGeometry(width, height, .01);
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj.lightShadowMesh = mesh
    obj.add(mesh);

    return obj
  }


}
