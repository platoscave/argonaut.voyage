import {
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
  Shape,
  Texture,
  PlaneGeometry,
  WebGLRenderer,
  Vector2,
  sRGBEncoding
} from 'three';
import { ref, reactive, toRefs, onMounted, onBeforeUnmount, watch } from 'vue'
import TWEEN from '@tweenjs/tween.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { CubeTextureLoader } from 'three/src/loaders/CubeTextureLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontJson from '~/assets/helvetiker_regular.typeface.json'
//import fontJson from 'three/examples/fonts/helvetiker_regular.typeface.json'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { useHashDissect, updateNextLevelHash } from "~/composables/useHashDissect";
import { useResizeObserver, useDebounceFn } from '@vueuse/core'


// by convention, composable function names start with "use"
export function useThreejsScene(
  rootEl: any,
  hashLevel: number = 0,
  skyBoxArray: string[],
  autoRotate: any,
  statsOn?: any) {

  // skyBoxArray: ['grass/sbox_px.jpg','grass/sbox_nx.jpg','grass/sbox_py.jpg','grass/sbox_ny.jpg','grass/sbox_pz.jpg','grass/sbox_nz.jpg']
  // skyBoxArray: ["milkyway/posx.jpg", "milkyway/posy.jpg", "milkyway/negy.jpg", "milkyway/posz.jpg", "milkyway/negz.jpg"],
  // skyBoxArray: ["islands/skyBox_e.jpg", "islands/skyBox_w.jpg", "islands/skyBox_t.jpg", "islands/skyBox_b.jpg", "islands/skyBox_n.jpg", "islands/skyBox_s.jpg", ],
  // skyBoxArray: ['jupiter/space_3_right.jpg','jupiter/space_3_left.jpg','jupiter/space_3_top.jpg','jupiter/space_3_bottom.jpg','jupiter/space_3_front.jpg','jupiter/space_3_back.jpg']     

  const { nextLevelSelectedObjId } = useHashDissect(hashLevel);
  const selectableMeshArr: Mesh[] = []

  // scenes
  const glScene = new Scene()
  glScene.name = 'glScene'
  const cssScene = new Scene()
  cssScene.name = 'cssScene'

  // models
  const glModelObj3d = new Object3D()
  glScene.add(glModelObj3d)
  const cssModelObj3d = new Object3D()
  cssScene.add(cssModelObj3d)

  // camera
  const camera = new PerspectiveCamera(60, 3 / 2, 1, 100000)
  camera.position.z = 40

  // webGl renderer
  //const glRenderer = createGlRenderer()
  const glRenderer = new WebGLRenderer({ antialias: true, alpha: true });
  glRenderer.setClearColor(0xECF8FF);
  glRenderer.setPixelRatio(window.devicePixelRatio);
  //glRenderer.setSize(window.innerWidth, window.innerHeight);
  glRenderer.domElement.style.position = 'absolute';
  //glRenderer.domElement.style.zIndex = -1;
  glRenderer.domElement.style.top = 0;
  glRenderer.domElement.style.pointerEvents = 'none'
  glRenderer.domElement.setAttribute("name", "GLRENDERER");

  // css renderer
  //const cssRenderer = createCssRenderer()
  const cssRenderer = new CSS3DRenderer();
  //cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.position = 'absolute';
  //cssRenderer.domElement.style.zIndex = 0;
  cssRenderer.domElement.style.top = 0;
  //cssRenderer.domElement.style.pointerEvents	= 'auto'
  cssRenderer.domElement.setAttribute("name", "CSSRENDERER");
  cssRenderer.domElement.appendChild(glRenderer.domElement)

  // controls
  let controls = new OrbitControls(camera, cssRenderer.domElement)
  controls.autoRotate = true
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
  const axesHelper = new AxesHelper(1)
  glScene.add(axesHelper)

  // raycaster
  const raycaster = new Raycaster()

  // skybox
  const loader = new CubeTextureLoader();
  //loader.setPath( 'textures/cubeMaps/' )
  const texture = loader.load(skyBoxArray);
  glScene.background = texture;

  // other
  let currentlySelectedObjProps = {}
  let cursor = ref('default')
  let animationFrame = 0
  let movingMouse = 'default'
  const stats = Stats()



  const animate = () => {
    animationFrame = requestAnimationFrame(animate)
    TWEEN.update()
    //skyBox.position.set(camera.position.x, camera.position.y, camera.position.z) // keep skyBox centred around the camera
    controls.update()
    axesHelper.position.set(controls.target.x, controls.target.y, controls.target.z)
    glRenderer.render(glScene, camera)
    cssRenderer.render(cssScene, camera)

    if (statsOn) stats.update()
  }

  const onResize = useDebounceFn(() => {
    // console.log('rootEl', rootEl)
    let rect = rootEl.value.getBoundingClientRect()
    // console.log('rect', rect)
    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
    glRenderer.setSize(rect.width, rect.height)
    cssRenderer.setSize(rect.width, rect.height)
  }, 100)

  

  const onClick = (event: any) => {
    // see https://threejs.org/docs/#api/core/Raycaster.setFromCamera
    //event.preventDefault()

    // get 2D coordinates of the mouse, in normalized device coordinates (NDC)
    let box = event.target.getBoundingClientRect()
    let x = (event.offsetX / box.width) * 2 - 1
    let y = -(event.offsetY / box.height) * 2 + 1
    let mouse = new Vector2(x, y)

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera)
    let intersects = raycaster.intersectObjects(selectableMeshArr)
    if (intersects.length > 0) {
      let selectedMesh = intersects[0].object
      const nodeData = selectedMesh.parent.userData
      updateNextLevelHash(hashLevel, nodeData._id, nodeData.pageId)
    }
  }

  const onMouseDown = (event: any) => {
    if (event.button === 0) movingMouse = 'grabbing'
    if (event.button === 2) movingMouse = 'move'
    cursor.value = movingMouse
  }

  const onMouseMove = (event: any) => {

    // get 2D coordinates of the mouse, in normalized device coordinates (NDC)
    let box = event.target.getBoundingClientRect()
    let x = (event.offsetX / box.width) * 2 - 1
    let y = -(event.offsetY / box.height) * 2 + 1
    let mouse = new Vector2(x, y)

    var raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(selectableMeshArr);

    if (intersects.length > 0) cursor.value = 'pointer'
    else cursor.value = movingMouse

  }

  const onMouseUp = () => {
    movingMouse = 'default'
    cursor.value = movingMouse
  }

  const addSelectable = (mesh) => {
    const idx = selectableMeshArr.find(item => mesh._id === item._id)
    if(!idx) selectableMeshArr.push(mesh)
  }
  const removeSelectable = (mesh) => {
    const idx = selectableMeshArr.find(item => mesh._id === item._id)
    if(idx) selectableMeshArr.splice(idx, 1) 
  }

  const highlight = (_id: string) => {
    //TODO don't need to lookup
    if (currentlySelectedObjProps) {
      let currentlySelected = glModelObj3d.getObjectByProperty('_id', currentlySelectedObjProps._id)
      if (currentlySelected) {
        currentlySelected.children[0].material = currentlySelectedObjProps.obj3d
        currentlySelected.children[0].children[0].material = currentlySelectedObjProps.label
      }
    }
    let newlySelected = glModelObj3d.getObjectByProperty('_id', _id)
    if (newlySelected) {
      currentlySelectedObjProps = {
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
  }

  const moveCameraToPos = (_id: string) => {
    let selectedModelObj = glModelObj3d.getObjectByProperty('_id', _id)
    if (!selectedModelObj) return
    if (!glScene) return
    if (!controls) return

    glScene.updateMatrixWorld()
    let newTargetPos = new Vector3()
    newTargetPos.setFromMatrixPosition(selectedModelObj.matrixWorld)

    new TWEEN.Tween(controls.target).easing(TWEEN.Easing.Quadratic.Out).to(newTargetPos, 1500).start()

    let cameraPos = controls.object.position.clone()

    // Make camera pos in front of and slightly higher than center, relative to the first child mesh. 
    // Apply the mesh's world matrix to translate to world coords
    var newCameraPos = new Vector3(0, 3, 20).applyMatrix4(selectedModelObj.children[0].matrixWorld)

    let cameraTween = new TWEEN.Tween(cameraPos).to(newCameraPos, 1500)
    cameraTween.easing(TWEEN.Easing.Quadratic.Out)
    cameraTween.onUpdate(() => {
      // console.log('cameraPos', cameraPos)
      controls.object.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
    })
    cameraTween.start()
  }

  const loadingText = (text?: string) => {

    if (text) {
      const font = new Font(fontJson)
      let textMaterial = new MeshLambertMaterial({ color: 0xEFEFEF })
      let text3d = new TextGeometry(text, { size: 2, font: font, height: 0.5 })
      text3d.center()
      let textMesh = new Mesh(text3d, textMaterial)
      textMesh.name = 'Loading Message'
      textMesh.position.set(0, 4, 0)
      glScene.add(textMesh)
    }
    else {
      let mesh = glScene.getObjectByName('Loading Message')
      glScene.remove(mesh)
      //mesh.dispose() how
    }
  }

  const getRoundedRectShape = (width: number, height: number, radius: number) => {
    const roundedRect = (ctx: any, width: number, height: number, radius: number) => {
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
  }

  // Watchers

  // watch the size of rootEl
  useResizeObserver(rootEl, onResize)

  // watch autoRotate button
  watch(autoRotate, (autoRotate) => controls.autoRotate = autoRotate.value)

  // watch next level SelectedObjId
  watch(nextLevelSelectedObjId, highlight)




  onMounted(() => {

    // Anything that uses rootEl must be done in onMouted (or onBeforeUnmount)
    // since this reactive variable is undefined until the mount

    rootEl.value.appendChild(cssRenderer.domElement)

    if (statsOn) rootEl.value.appendChild(stats.dom)

    // TODO change to touch events See https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent
    rootEl.value.addEventListener('click', onClick, false)
    rootEl.value.addEventListener('pointerdown', onMouseDown, false)
    rootEl.value.addEventListener('mousemove', onMouseMove, false)
    rootEl.value.addEventListener('pointerup', onMouseUp, false)

    animate()
  })

  onBeforeUnmount(() => {
    // Important: Must release animationFrame for garbage collection to work
    cancelAnimationFrame(animationFrame);// Stop the animation

    rootEl.value.removeEventListener('click', onClick, false)
    rootEl.value.removeEventListener('pointerdown', onMouseDown, false)
    rootEl.value.removeEventListener('mousemove', onMouseMove, false)
    rootEl.value.removeEventListener('pointerup', onMouseUp, false)
  })


  return {
    glModelObj3d, cssModelObj3d, cursor, addSelectable, removeSelectable, loadingText
  }
}
