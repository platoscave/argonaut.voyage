import TWEEN from '@tweenjs/tween.js'
import { 
  Font, 
  Scene, 
  Object3D, 
  PerspectiveCamera, 
  Vector3, 
  DirectionalLight, 
  AmbientLight, 
  AxesHelper, 
  Raycaster, 
  TextureLoader, 
  BoxGeometry, 
  MeshBasicMaterial, 
  BackSide, 
  Mesh, 
  MeshLambertMaterial, 
  TextGeometry, 
  Shape, 
  Texture, 
  PlaneGeometry, 
  WebGLRenderer,
  Vector2,
  sRGBEncoding
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import fontJson from '../assets/helvetiker_regular.typeface.json'
import Stats from 'three/examples/jsm/libs/stats.module.js';

const font = new Font(fontJson)

export default {

  name: 'Scene',
  props: {
    hashLevel: Number,
    viewId: String,
    width: {
      type: Number,
      default: undefined
    },
    height: {
      type: Number,
      default: undefined
    }
  },
  data() {
    return {
      skyBoxArray: [],
      // this.skyBoxArray: ['grass/sbox_px.jpg','grass/sbox_nx.jpg','grass/sbox_py.jpg','grass/sbox_ny.jpg','grass/sbox_pz.jpg','grass/sbox_nz.jpg']
      // this.skyBoxArray: ["milkyway/posx.jpg", "milkyway/posy.jpg", "milkyway/negy.jpg", "milkyway/posz.jpg", "milkyway/negz.jpg"],
      // this.skyBoxArray: ["islands/this.skyBox_e.jpg", "islands/this.skyBox_w.jpg", "islands/this.skyBox_t.jpg", "islands/this.skyBox_b.jpg", "islands/this.skyBox_n.jpg", "islands/this.skyBox_s.jpg", ],
      // this.skyBoxArray: ['jupiter/space_3_right.jpg','jupiter/space_3_left.jpg','jupiter/space_3_top.jpg','jupiter/space_3_bottom.jpg','jupiter/space_3_front.jpg','jupiter/space_3_back.jpg']     
      orbit: false,
      glModelObject3D: null,
      cssModelObject3D: null,
      selectableMeshArr: [],
      heighlight: false,
      nextLevelSelectedObjId: '',
      camera: null,
      controls: null,
      skyBox: null,
      glRenderer: null,
      cssRenderer: null,
      glScene: null,
      cssScene: null,
      axesHelper: null,
      cursor: 'default'
    }
  },
  methods: {
    loadScene() {
    
      //if(this.glScene) return
      // world
      this.glScene = new Scene()
      this.glModelObject3D = new Object3D()
      this.glScene.add(this.glModelObject3D)

      this.cssScene = new Scene();
      this.cssModelObject3D = new Object3D()
      this.cssScene.add(this.cssModelObject3D)


      // this.camera
      this.camera = new PerspectiveCamera(60, 3 / 2, 1, 100000)
      this.camera.position.z = 40

      // glRenderer
      this.glRenderer = this.createGlRenderer()
      // cssRenderer
      this.cssRenderer = this.createCssRenderer()
      this.$el.appendChild(this.cssRenderer.domElement);
      this.cssRenderer.domElement.appendChild(this.glRenderer.domElement);

      // this.controls
      this.controls = new OrbitControls(this.camera, this.$el)
      this.controls.autoRotateSpeed = 0.1245
      this.controls.minPolarAngle = Math.PI / 4
      this.controls.maxPolarAngle = Math.PI / 1.5
      this.controls.screenSpacePanning = true;
      this.controls.enableDamping = true;

      // lights
      let light1 = new DirectionalLight(0xffffff, 0.8)
      light1.position.set(-1, 1, 1).normalize()
      this.glScene.add(light1)
      this.glScene.add(new AmbientLight(0x969696, 0.8))

      // axesHelper
      this.axesHelper = new AxesHelper(1)
      this.glScene.add(this.axesHelper)

      // raycaster
      this.raycaster = new Raycaster()

      let loader = new TextureLoader();
      // See https://stemkoski.github.io/js/Skybox.html
      if (this.skyboxArray.length === 6) {
        let skyGeometry = new BoxGeometry(50000, 50000, 50000)
        let materialArray = []
        for (let i = 0; i < 6; i++) {
          materialArray.push(new MeshBasicMaterial({
            map: loader.load(this.skyboxArray[i]),
            side: BackSide
          }))
        }
        this.skyBox = new Mesh(skyGeometry, materialArray)
        this.glScene.add(this.skyBox)
      }

      /* this.skyBox = loader.load( this.skyboxArray );
      this.skyBox.encoding = sRGBEncoding;
			this.glScene.background = this.skyBox; */

      // see http://threejs.org/examples/webgl_multiple_views.html for rendering on 3d tv

      this.glScene.name = 'glScene'
      // TODO change to touch events
      // See https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent
      this.$el.addEventListener('click', this.onClick, false)
      this.$el.addEventListener('pointerdown', this.onMouseDown, false)
      this.$el.addEventListener('mousemove', this.onMouseMove, false)
      this.$el.addEventListener('pointerup', this.onMouseUp, false)

      //this.stats = Stats()
      //this.$el.appendChild(this.stats.dom)

      this.render()
      this.animate()
    },

    render() {
      this.glRenderer.render(this.glScene, this.camera)
      this.cssRenderer.render(this.cssScene, this.camera)
    },

    animate() {
      this.animationFrame = requestAnimationFrame(this.animate.bind(this))
      TWEEN.update()
      this.skyBox.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z) // keep this.skyBox centred around the this.camera
      this.controls.update()
      this.axesHelper.position.set(this.controls.target.x, this.controls.target.y, this.controls.target.z)
      this.glRenderer.render(this.glScene, this.camera)
      this.cssRenderer.render(this.cssScene, this.camera)

      if(this.stats) this.stats.update()
    },

    onOrbit() {
      this.orbit = !this.orbit
      this.controls.autoRotate = this.orbit
    },

    onResize() {
      // add event liteners https://stackoverflow.com/questions/49380830/vue-js-how-to-get-window-size-whenever-it-changes
      if (!this.glRenderer) return
      if (this.width === undefined || this.height === undefined) {
        // console.log('this.$el', this.$el)
        let rect = this.$el.getBoundingClientRect()
        //console.log(rect)
        this.camera.aspect = rect.width / rect.height
        this.camera.updateProjectionMatrix()
        this.glRenderer.setSize(rect.width, rect.height)
        this.cssRenderer.setSize(rect.width, rect.height)
        this.render()
      } else {
        this.glRenderer.setSize(this.width, this.height)
        this.cssRenderer.setSize(this.width, this.height)
      }
    },

    onClick(event) {
      // see https://threejs.org/docs/#api/core/Raycaster.setFromCamera
      //event.preventDefault()

      // get 2D coordinates of the mouse, in normalized device coordinates (NDC)
      let box = event.target.getBoundingClientRect()
      let x = (event.offsetX / box.width) * 2 - 1
      let y = -(event.offsetY / box.height) * 2 + 1
      let mouse = new Vector2(x, y)

      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera(mouse, this.camera)
      let intersects = this.raycaster.intersectObjects(this.selectableMeshArr)
      if (intersects.length > 0) {
        let selectedMesh = intersects[0].object
        this.updateNextLevelHash(selectedMesh.parent.userData)
      }
    },

    onMouseDown(event) {
      if (event.button === 0) this.cursor = 'grabbing'
      if (event.button === 2)  this.cursor = 'move'
    },

    onMouseMove(event) {

      // get 2D coordinates of the mouse, in normalized device coordinates (NDC)
      let box = event.target.getBoundingClientRect()
      let x = (event.offsetX / box.width) * 2 - 1
      let y = -(event.offsetY / box.height) * 2 + 1
      let mouse = new Vector2(x, y)
  
      var raycaster = new Raycaster();
      raycaster.setFromCamera( mouse, this.camera );
      var intersects = raycaster.intersectObjects( this.selectableMeshArr );

      if (intersects.length > 0) this.cursor = 'pointer'
      else this.cursor = 'default'
  
    },

    onMouseUp() {
      this.cursor = 'default'
    },

    highlight(_id) {
      //TODO don't need to lookup
      if(this.currentlySelectedObjProps) {
        let currentlySelected = this.glModelObject3D.getObjectByProperty('_id', this.currentlySelectedObjProps._id)
        if (currentlySelected) {
          currentlySelected.children[0].material = this.currentlySelectedObjProps.obj3d
          currentlySelected.children[0].children[0].material = this.currentlySelectedObjProps.label
        }
      }
      let newlySelected = this.glModelObject3D.getObjectByProperty('_id', _id)
      if (newlySelected) {
        this.currentlySelectedObjProps = {
          _id: _id,
          obj3d: newlySelected.children[0].material,
          label: newlySelected.children[0].children[0].material
        }
        newlySelected.children[0].material = new MeshLambertMaterial({ color: 0xEEEE00 })
        newlySelected.children[0].children[0].material = new MeshLambertMaterial({ color: 0x666666 })
        // TODO nice idea, find a way to undo
        /* newlySelected.children.forEach( child => {
          if(child.name.startsWith('tube'))
          child.material = new MeshLambertMaterial({ color: 0xEEEE00 })
        }) */
      }
    },

    moveCameraToPos(_id) {
      let selectedModelObj = this.glModelObject3D.getObjectByProperty('_id', _id)
      if (!selectedModelObj) return
      if (!this.glScene) return
      if (!this.controls) return

      this.glScene.updateMatrixWorld()
      let newTargetPos = new Vector3()
      newTargetPos.setFromMatrixPosition(selectedModelObj.matrixWorld)

      new TWEEN.Tween(this.controls.target).easing(TWEEN.Easing.Quadratic.Out).to(newTargetPos, 1500).start()

      let cameraPos = this.controls.object.position.clone()

      // Make camera pos in front of and slightly higher than center, relative to the first child mesh. 
      // Apply the mesh's world matrix to translate to world coords
      var newCameraPos = new Vector3(0, 3, 20).applyMatrix4(selectedModelObj.children[0].matrixWorld)

      let cameraTween = new TWEEN.Tween(cameraPos).to(newCameraPos, 1500)
      cameraTween.easing(TWEEN.Easing.Quadratic.Out)
      cameraTween.onUpdate(() => {
        // console.log('cameraPos', cameraPos)
        this.controls.object.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
      })
      cameraTween.start()
    },

    addLoadingText(text) {
      let textMaterial = new MeshLambertMaterial({ color: 0xEFEFEF })
      let text3d = new TextGeometry(text || 'Loading...', { size: 2, font: font, height: 0.5 })
      text3d.center()
      let textMesh = new Mesh(text3d, textMaterial)
      textMesh.name = 'Loading Message'
      textMesh.position.set(0, 4, 0)
      this.glScene.add(textMesh)
    },

    removeLoadingText() {
      let mesh = this.glScene.getObjectByName('Loading Message')
      this.glScene.remove(mesh)
      //mesh.dispose() how
    },

    getRoundedRectShape(width, height, radius) {
      const roundedRect = (ctx, width, height, radius) => {
        const x = 0
        const y = 0
        ctx.moveTo(x, y + radius)
        ctx.lineTo(x, y + height - radius)
        ctx.quadraticCurveTo(x, y + height, x + radius, y + height)
        ctx.lineTo(x + width - radius, y + height)
        ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
        ctx.lineTo(x + width, y + radius)
        ctx.quadraticCurveTo(x + width, y, x + width - radius, y)
        ctx.lineTo(x + radius, y)
        ctx.quadraticCurveTo(x, y, x, y + radius)
      }
      // Rounded rectangle
      let roundedRectShape = new Shape()
      roundedRect(roundedRectShape, width, height, radius) // negative numbers not allowed
      return roundedRectShape
    },

    ///////////////////////////////////////////////////////////////////
    // Create WebGL Renderer
    //
    ///////////////////////////////////////////////////////////////////
    createGlRenderer: function () {

      let glRenderer = new WebGLRenderer({ antialias: true, alpha: true });

      glRenderer.setClearColor(0xECF8FF);
      glRenderer.setPixelRatio(window.devicePixelRatio);
      //glRenderer.setSize(window.innerWidth, window.innerHeight);

      glRenderer.domElement.style.position = 'absolute';
      //glRenderer.domElement.style.zIndex = -1;
      glRenderer.domElement.style.top = 0;
      glRenderer.domElement.style.pointerEvents = 'none'
      glRenderer.domElement.setAttribute("name", "GLRENDERER");

      //window.addEventListener('mousemove', this.mouseMove, false);

      return glRenderer;
    },

    ///////////////////////////////////////////////////////////////////
    // Create CSS Renderer
    //
    ///////////////////////////////////////////////////////////////////
    createCssRenderer: function () {

      let cssRenderer = new CSS3DRenderer();

      //cssRenderer.setSize(window.innerWidth, window.innerHeight);

      cssRenderer.domElement.style.position = 'absolute';
      //cssRenderer.domElement.style.zIndex = 0;
      cssRenderer.domElement.style.top = 0;
      //cssRenderer.domElement.style.pointerEvents	= 'auto'
      cssRenderer.domElement.setAttribute("name", "CSSRENDERER");



      return cssRenderer;
    },

  },

  watch: {
    nextLevelSelectedObjId: function (val) {
      this.highlight(val)
      this.moveCameraToPos(val)
    },
  },
  
  mounted() {

    this.loadScene()

    window.addEventListener("resize", this.onResize);
    this.onResize()

    
  },
  beforeDestroy() {

    // Important: Must release animationFrame for garbage collection to work
    cancelAnimationFrame(this.animationFrame);// Stop the animation
    
    window.removeEventListener("resize", this.onResize)
    this.$el.removeEventListener('click', this.onClick, false)
    this.$el.removeEventListener('pointerdown', this.onMouseDown, false)
    this.$el.removeEventListener('mousemove', this.onMouseMove, false)
    this.$el.removeEventListener('pointerup', this.onMouseUp, false)
  },
}
