let scene, camera, renderer, controls;
let character;
let keys = {};

// Initialize scene
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 5);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();

    // Lights
    addLights();

    // Load models
    loadModels();

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', (e) => keys[e.key] = true);
    window.addEventListener('keyup', (e) => keys[e.key] = false);

    animate();
}

function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
}

function loadModels() {
    const loader = new THREE.GLTFLoader();

    // Load world with character inside
    loader.load('/assets/new-world.glb', (gltf) => {
        const world = gltf.scene;

        // Enable shadows for all meshes in the world
        world.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Find the character by name
        character = world.getObjectByName('character'); // Reemplaza 'character' con el nombre de tu objeto
        if (character) {
            console.log('Character found:', character);
        } else {
            console.error('Character not found in the model.');
        }

        scene.add(world);
    });
}

function handleMovement() {
    if (!character) return;

    const speed = 0.1;
    const rotationSpeed = 0.05;

    // Forward/Backward (W/S or ArrowUp/ArrowDown)
    if (keys['w'] || keys['ArrowUp']) {
        character.position.z -= speed;
        character.rotation.y = Math.PI / 2;
        
    }
    if (keys['s'] || keys['ArrowDown']) {
        character.position.z += speed;
        character.rotation.y = -Math.PI / 2;
    }

    // Left/Right (A/D or ArrowLeft/ArrowRight)
    if (keys['a'] || keys['ArrowLeft']) {
        character.position.x -= speed;
        character.rotation.y = Math.PI;
    }
    if (keys['d'] || keys['ArrowRight']) {
        character.position.x += speed;
        character.rotation.y = 0;
        
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    handleMovement();
    controls.update();
    renderer.render(scene, camera);
}

init();