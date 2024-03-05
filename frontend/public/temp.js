var camera, root, scene, renderer, renderer2, background;
var sphere;
var light

init();
animate(performance.now());

function init() {
    scene = new THREE.Scene()
    root = new THREE.Object3D()
    root.position.y = 20
    root.rotation.y = Math.PI / 3
    scene.add(root)

    background = makeElementObject('div', 200, 200)
    background.css3dObject.element.textContent = "I am an HTML <div> element mixed into the WebGL scene. This text is editable!"
    background.css3dObject.element.setAttribute('contenteditable', '')    
    background.position.z = 20
    background.css3dObject.element.style.opacity = "1"
    background.css3dObject.element.style.padding = '10px'
    const color1 = '#7bb38d'
    const color2 = '#71a381'
    background.css3dObject.element.style.background = `repeating-linear-gradient(
        45deg,
        ${color1},
        ${color1} 10px,
        ${color2} 10px,
        ${color2} 20px
    )`
    root.add( background );

    const button = makeElementObject('button', 75, 20)    
    button.css3dObject.element.style.border = '2px solid #fa5a85'
    button.css3dObject.element.textContent = "Click me!"
    button.css3dObject.element.addEventListener('click', () => alert('You clicked a <button> element in the DOM!'))
    button.position.y = 10
    button.position.z = 10
    button.css3dObject.element.style.background = '#e64e77'
    background.add(button)

    // make a geometry that we will clip with the DOM elememt.
    ~function() {
        var material = new THREE.MeshPhongMaterial({
            color: 0x991d65,
            emissive: 0x000000,
            specular: 0x111111,
            side: THREE.DoubleSide,
            flatShading: false,
            shininess: 30,
            vertexColors: true,
        })

        var geometry = new THREE.SphereBufferGeometry( 70, 32, 32 );

        // give the geometry custom colors for each vertex {{
        geometry = geometry.toNonIndexed(); // ensure each face has unique vertices

        position = geometry.attributes.position;
        var colors = [];

        const color = new THREE.Color
        for ( var i = 0, l = position.count; i < l; i ++ ) {
            color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.15 + 0.85 );
            colors.push( color.r, color.g, color.b );
        }

        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        // }}

        sphere = new THREE.Mesh( geometry, material );
        sphere.position.z = 20;
        sphere.position.y = -100;
        sphere.castShadow = true;
        sphere.receiveShadow = false;
        root.add( sphere );
    }()

    // light
    ~function() {
        var ambientLight = new THREE.AmbientLight( 0x999999, 1.5 );
        root.add( ambientLight );

        light = new THREE.PointLight( 0xffffff, 1, 0 );
        light.castShadow = true;
        light.position.z = 150;
        light.shadow.mapSize.width = 1024;  // default
        light.shadow.mapSize.height = 1024; // default
        light.shadow.camera.near = 1;       // default
        light.shadow.camera.far = 2000;      // default

        scene.add( new THREE.PointLightHelper( light, 10 ) )

        root.add( light );
    }()

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera = new THREE.PerspectiveCamera();
    camera.position.set( 0, 0, 500 );

    renderer2 = new THREE.CSS3DRenderer();
    renderer2.domElement.style.position = 'absolute';
    renderer2.domElement.style.top = 0;
    document.querySelector('#css').appendChild( renderer2.domElement );

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor( 0x000000, 0 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    document.querySelector('#webgl').appendChild( renderer.domElement );

    window.addEventListener('resize', resize)
    resize()
}

function resize() {
    camera.fov = 45
    camera.aspect = window.innerWidth / window.innerHeight
    camera.near = 1
    camera.far = 2000
    camera.updateProjectionMatrix()
    renderer2.setSize( window.innerWidth, window.innerHeight );
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate(time) {

    light.position.x = 30 * Math.sin(time * 0.003) + 30;
    light.position.y = 40 * Math.cos(time * 0.001) - 20;
    background.rotation.y = Math.PI/8 * Math.cos(time * 0.001) - Math.PI/6;
    background.rotation.x = Math.PI/10 * Math.sin(time * 0.001) - Math.PI/10;
    sphere.rotation.x += 0.005
    sphere.rotation.y += 0.005

    scene.updateMatrixWorld()

    renderer.render( scene, camera );
    renderer2.render( scene, camera );

    requestAnimationFrame( animate );
}

function makeElementObject(type, width, height) {
    const obj = new THREE.Object3D

    const element = document.createElement( type );
    element.style.width = width+'px';
    element.style.height = height+'px';
    element.style.opacity = 0.999;
    element.style.boxSizing = 'border-box'

    var css3dObject = new THREE.CSS3DObject( element );
    obj.css3dObject = css3dObject
    obj.add(css3dObject)

    // make an invisible plane for the DOM element to chop
    // clip a WebGL geometry with it.
    var material = new THREE.MeshPhongMaterial({
        opacity	: 0.15,
        color	: new THREE.Color( 0x111111 ),
        blending: THREE.NoBlending,
        // side	: THREE.DoubleSide,
    });
    var geometry = new THREE.BoxGeometry( width, height, 1 );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj.lightShadowMesh = mesh
    obj.add( mesh );

    return obj
}