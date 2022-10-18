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
  Mesh,
  MeshLambertMaterial,
  Texture,
  WebGLRenderer,
  Layers,
  Vector2,
  ShaderMaterial,
  MeshBasicMaterial,
  RepeatWrapping
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
// OutlinePass
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

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
  let selectedObj3d = null


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
  const glRenderer = new WebGLRenderer({ antialias: true, alpha: true });
  glRenderer.domElement.style.background = ''
  glRenderer.setClearColor( 0x000000, 0 );
  glRenderer.setPixelRatio(window.devicePixelRatio);
  glRenderer.domElement.style.pointerEvents = 'none'
  glRenderer.domElement.setAttribute("name", "GLRENDERER");

  // css renderer
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.zIndex = '10';
  cssRenderer.domElement.style.top = '0';
  cssRenderer.domElement.style.pointerEvents	= 'auto'
  cssRenderer.domElement.setAttribute("name", "CSSRENDERER");

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
  let cursor = ref('default')
  let animationFrame = 0
  let movingMouse = 'default'
  const stats = Stats()

  // Outline postprocessing
  const composer = new EffectComposer( glRenderer );
  const renderPass = new RenderPass( glScene, camera );
  composer.addPass( renderPass );
  const outlinePass = new OutlinePass( new Vector2( window.innerWidth, window.innerHeight ), glScene, camera );
  composer.addPass( outlinePass );
  const effectFXAA = new ShaderPass( FXAAShader );
  effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
  composer.addPass( effectFXAA );
  /////////////////////////

  const animate = () => {
    animationFrame = requestAnimationFrame(animate)
    TWEEN.update()
    //skyBox.position.set(camera.position.x, camera.position.y, camera.position.z) // keep skyBox centred around the camera
    controls.update()
    axesHelper.position.set(controls.target.x, controls.target.y, controls.target.z)
    composer.render(); //glRenderer plus second pass for outline
    cssRenderer.render(cssScene, camera)

    if (statsOn) stats.update()
  }

  const onResize = useDebounceFn(() => {
    let rect = rootEl.value.getBoundingClientRect()
    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
    glRenderer.setSize(rect.width, rect.height)
    cssRenderer.setSize(rect.width, rect.height)
    composer.setSize( rect.width, rect.height );
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
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
      let localSelectedMesh = intersects[0].object
      const nodeData = localSelectedMesh.parent.userData
      updateNextLevelHash(hashLevel, nodeData._id, nodeData.treeVars.pageId)
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

  const addSelectable = (mesh: Mesh) => {
    // const idx = selectableMeshArr.find(item => mesh.parent._id === item._id)
    // if(!idx) selectableMeshArr.push(mesh)
    selectableMeshArr.push(mesh)
  }
  const removeSelectable = (mesh: Mesh) => {
    const idx = selectableMeshArr.find(item => mesh.parent._id === item._id)
    if (idx) selectableMeshArr.splice(idx, 1)
  }

  const highlight = (_id: string) => {
    const newlySelectedObj3d = glModelObj3d.getObjectByProperty('_id', _id)
    if(!newlySelectedObj3d) return
    // Make the associations of the previously selected obj3d invisible
    if(selectedObj3d && selectedObj3d.setAssocsOpacity) selectedObj3d.setAssocsOpacity(glModelObj3d, 0)
    // Make the associations of the newly selected obj3d visible
    if(newlySelectedObj3d.setAssocsOpacity) newlySelectedObj3d.setAssocsOpacity(glModelObj3d, 1) // visible
    // Save newly selected obj3d for next time
    selectedObj3d = newlySelectedObj3d
    // Highlight the mesh of the newly selected obj3d
    outlinePass.selectedObjects = [newlySelectedObj3d.children[0]];
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

  // Watchers

  // watch the size of rootEl
  useResizeObserver(rootEl, onResize)

  // watch autoRotate button
  watch(autoRotate, (autoRotate) => controls.autoRotate = autoRotate.value)

  // watch next level SelectedObjId
  watch(nextLevelSelectedObjId, (_id) => {
    highlight(_id)
    moveCameraToPos(_id)
  })




  onMounted(() => {

    // Anything that uses rootEl must be done in onMounted (and onBeforeUnmount)
    // since this reactive variable is undefined until the mount

    rootEl.value.appendChild(cssRenderer.domElement)
    rootEl.value.appendChild(glRenderer.domElement)


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
