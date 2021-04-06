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
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import fontJson from '../assets/helvetiker_regular.typeface.json'
const font = new Font(fontJson)

let camera, controls, skyBox, glRenderer, cssRenderer, glScene, cssScene, axesHelper

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
      skyboxArray: [],
      orbit: false,
      glModelObject3D: null,
      cssModelObject3D: null,
      selectableMeshArr: [],
      heighlight: false
      glScene: null

    }
  },
  methods: {
    loadScene() {
    
      //if(glScene) alert('destroy')
      // world
      glScene = new Scene()
      this.glModelObject3D = new Object3D()
      glScene.add(this.glModelObject3D)

      cssScene = new Scene();
      this.cssModelObject3D = new Object3D()
      cssScene.add(this.cssModelObject3D)


      // camera
      camera = new PerspectiveCamera(60, 3 / 2, 1, 100000)
      camera.position.z = 4000

      // glRenderer
      glRenderer = this.createGlRenderer()
      // cssRenderer
      cssRenderer = this.createCssRenderer()
      this.$el.appendChild(cssRenderer.domElement);
      cssRenderer.domElement.appendChild(glRenderer.domElement);

      // controls
      controls = new OrbitControls(camera, this.$el)
      controls.autoRotateSpeed = 0.1245
      controls.minPolarAngle = Math.PI / 4
      controls.maxPolarAngle = Math.PI / 1.5
      controls.screenSpacePanning = true;
      controls.enableDamping = true;

      // lights
      let light1 = new DirectionalLight(0xffffff, 0.8)
      light1.position.set(-1, 1, 1).normalize()
      glScene.add(light1)
      glScene.add(new AmbientLight(0x969696, 0.8))

      // axesHelper
      axesHelper = new AxesHelper(100)
      glScene.add(axesHelper)

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
        skyBox = new Mesh(skyGeometry, materialArray)
        glScene.add(skyBox)
      }

      // see http://threejs.org/examples/webgl_multiple_views.html for rendering on 3d tv

      glScene.name = 'glScene'
      this.$el.addEventListener('click', this.onClick, false)

      //this.$nextTick(() => this.$nextTick(() => this.onResize()))
      this.render()
      this.animate()
    },

    render() {
      glRenderer.render(glScene, camera)
      cssRenderer.render(cssScene, camera)
    },

    animate() {
      requestAnimationFrame(this.animate.bind(this))
      TWEEN.update()
      skyBox.position.set(camera.position.x, camera.position.y, camera.position.z) // keep skybox centred around the camera
      controls.update()
      axesHelper.position.set(controls.target.x, controls.target.y, controls.target.z)
      glRenderer.render(glScene, camera)
      cssRenderer.render(cssScene, camera)
    },

    onOrbit() {
      this.orbit = !this.orbit
      controls.autoRotate = this.orbit
    },

    onResize() {
      // add event liteners https://stackoverflow.com/questions/49380830/vue-js-how-to-get-window-size-whenever-it-changes
      if (!glRenderer) return
      if (this.width === undefined || this.height === undefined) {
        // console.log('this.$el', this.$el)
        let rect = this.$el.getBoundingClientRect()
        //console.log(rect)
        camera.aspect = rect.width / rect.height
        camera.updateProjectionMatrix()
        glRenderer.setSize(rect.width, rect.height)
        cssRenderer.setSize(rect.width, rect.height)
        this.render()
      } else {
        glRenderer.setSize(this.width, this.height)
        cssRenderer.setSize(this.width, this.height)
      }
    },

    onClick(event) {
      // see https://threejs.org/docs/#api/core/Raycaster.setFromCamera
      event.preventDefault()

      // get 2D coordinates of the mouse, in normalized device coordinates (NDC)
      let box = event.target.getBoundingClientRect()
      let x = (event.offsetX / box.width) * 2 - 1
      let y = -(event.offsetY / box.height) * 2 + 1
      let mouse = new Vector2(x, y)

      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera(mouse, camera)
      let intersects = this.raycaster.intersectObjects(this.selectableMeshArr)
      if (intersects.length > 0) {
        let selectedMesh = intersects[0].object
        this.updateNextLevelHashSelectedObjId(selectedMesh.parent.userData)
      }
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
      if (!glScene) return

      glScene.updateMatrixWorld()
      let newTargetPos = new Vector3()
      newTargetPos.setFromMatrixPosition(selectedModelObj.matrixWorld)

      new TWEEN.Tween(controls.target).easing(TWEEN.Easing.Quadratic.Out).to(newTargetPos, 1500).start()

      let cameraPos = controls.object.position.clone()

      // Make camera pos in front of and slightly higher than center, relative to the first child mesh. 
      // Apply the mesh's world matrix to translate to world coords
      var newCameraPos = new Vector3(0, 300, 2000).applyMatrix4(selectedModelObj.children[0].matrixWorld)

      let cameraTween = new TWEEN.Tween(cameraPos).to(newCameraPos, 1500)
      cameraTween.easing(TWEEN.Easing.Quadratic.Out)
      cameraTween.onUpdate(() => {
        // console.log('cameraPos', cameraPos)
        controls.object.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
      })
      cameraTween.start()
    },

    addLoadingText(text) {
      let textMaterial = new MeshLambertMaterial({ color: 0xEFEFEF })
      let text3d = new TextGeometry(text || 'Loading...', { size: 200, font: font })
      text3d.center()
      let textMesh = new Mesh(text3d, textMaterial)
      textMesh.name = 'Loading Message'
      textMesh.position.set(0, 400, 0)
      glScene.add(textMesh)
    },

    removeLoadingText() {
      let mesh = glScene.getObjectByName('Loading Message')
      glScene.remove(mesh)
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

      var glRenderer = new WebGLRenderer({ antialias: true, alpha: true });

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

      var cssRenderer = new CSS3DRenderer();

      //cssRenderer.setSize(window.innerWidth, window.innerHeight);

      cssRenderer.domElement.style.position = 'absolute';
      //cssRenderer.domElement.style.zIndex = 0;
      cssRenderer.domElement.style.top = 0;
      //cssRenderer.domElement.style.pointerEvents	= 'auto'
      cssRenderer.domElement.setAttribute("name", "CSSRENDERER");



      return cssRenderer;
    },

    // Insert selectObjId and pageId into next level hash
    updateNextLevelHashSelectedObjId(userData) {
      let hashArr = window.location.hash.split("/");
      let nextPageStateStr = hashArr[this.hashLevel + 2];
      if (!nextPageStateStr) nextPageStateStr = "";
      let nextPageStateArr = nextPageStateStr.split(".");
      nextPageStateArr[0] = userData._id;
      if (userData.pageId && nextPageStateArr[1] !== userData.pageId) {
        nextPageStateArr[1] = userData.pageId;
        // Remove tab if there is one. Page will find its own tab
        nextPageStateArr.splice(2);
        // Remove erveything that come after the next level as it no longer valid
        hashArr.splice(this.hashLevel + 3);
      }
      nextPageStateStr = nextPageStateArr.join(".");
      hashArr[this.hashLevel + 2] = nextPageStateStr;

      let hash = hashArr.join("/");
      window.location.hash = hash;
    },

    handleHashChange: function () {
      const ourLevelArr = window.location.hash.split("/")[this.hashLevel + 2];
      if (!ourLevelArr) return;
      const levelStates = ourLevelArr.split(".");
      let selectedObjId = levelStates[0]
      this.highlight(selectedObjId)
      this.moveCameraToPos(selectedObjId)
    },
  },

  mounted() {

    // If we've been here before, assume no redraw nessesary
    if(glScene) return

    this.loadScene()

    window.addEventListener("hashchange", this.handleHashChange, false);
    this.handleHashChange();

    window.addEventListener("resize", this.onResize);
    this.onResize()
  },
  beforeDestroy() {
    window.removeEventListener("hashchange", this.handleHashChange, false)
    window.removeEventListener("resize", this.onResize)
  },
}
