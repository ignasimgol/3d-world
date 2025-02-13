import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from 'gsap';

let scene, camera, renderer, controls;
let character;
let keys = {};
let light, sun;
let isJumping = false;

const JUMP_FORCE = 1.0;
const GRAVITY = 0.05;
const INITIAL_Y = 15.0;

let courtObject = null;
let pokeballs = [];

const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const modal = document.querySelector(".modal");
const modalBgOverlay = document.querySelector(".modal-bg-overlay");
const modalExitButton = document.querySelector(".modal-exit-button");
const pokeballModal = document.querySelector(".pokeball-modal");
const pokeballModalOverlay = document.querySelector(".pokeball-modal-overlay");
const pokeballModalExitButton = document.querySelector(".pokeball-modal-exit-button");

const introScreen = document.getElementById('intro-screen');
const enterButton = document.getElementById('enter-button');
const gameContainer = document.getElementById('game-container');

enterButton.addEventListener('click', () => {
    introScreen.style.display = 'none';
    gameContainer.classList.remove('hidden');
    init(); // Start the game
});

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const cameraOffset = new THREE.Vector3(52, 156, 268);

// Raycaster setup
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let intersectObject = "";

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.7;
    document.getElementById('game-container').appendChild(renderer.domElement);

    modalExitButton.addEventListener('click', hideModal);
    pokeballModalExitButton.addEventListener('click', hidePokeballModal);

    const aspect = sizes.width / sizes.height;
    camera = new THREE.OrthographicCamera(
        -aspect * 50,
        aspect * 50,
        50,
        -50,
        1,
        1000
    );
    camera.position.set(52, 156, 268);
    camera.zoom = 0.8;
    camera.updateProjectionMatrix();

    const cameraHelper = new THREE.CameraHelper(camera);
    scene.add(cameraHelper);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();

    addLights();
    loadModels();

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', (e) => keys[e.key] = true);
    window.addEventListener('keyup', (e) => keys[e.key] = false);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);
    modalExitButton.addEventListener('click', hideModal);

    animate();
}

function addLights() {
    light = new THREE.AmbientLight(0x505050, 2.7);
    scene.add(light);

    sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.castShadow = true;
    sun.position.set(280, 200, -80);
    sun.target.position.set(100, 0, -10);
    sun.shadow.mapSize.width = 4096;
    sun.shadow.mapSize.height = 4096;
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 300;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -100;
    sun.shadow.normalBias = 0.2;
    scene.add(sun.target);
    scene.add(sun);

    const sunHelper = new THREE.DirectionalLightHelper(sun, 10);
    scene.add(sunHelper);
}

function toggleTheme() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');

    if (sunIcon.style.display === 'none') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    gsap.to(light.color, {
        r: isDarkTheme ? 1.0 : 0.25,
        g: isDarkTheme ? 1.0 : 0.31,
        b: isDarkTheme ? 1.0 : 0.78,
        duration: 1,
        ease: "power2.inOut",
    });

    gsap.to(light, {
        intensity: isDarkTheme ? 0.8 : 0.9,
        duration: 1,
        ease: "power2.inOut",
    });

    gsap.to(sun, {
        intensity: isDarkTheme ? 1 : 0.8,
        duration: 1,
        ease: "power2.inOut",
    });

    gsap.to(sun.color, {
        r: isDarkTheme ? 1.0 : 0.25,
        g: isDarkTheme ? 1.0 : 0.41,
        b: isDarkTheme ? 1.0 : 0.88,
        duration: 1,
        ease: "power2.inOut",
    });

    gsap.to(scene.background, {
        r: isDarkTheme ? 0.63 : 0.25,
        g: isDarkTheme ? 0.63 : 0.31,
        b: isDarkTheme ? 0.63 : 0.78,
        duration: 1,
        ease: "power2.inOut",
    });
}

themeToggle.addEventListener('click', toggleTheme);

function loadModels() {
    const loader = new GLTFLoader();

    loader.load('/assets/new-world.glb', (gltf) => {
        const world = gltf.scene;

        world.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Añadir log para debug
                console.log("Mesh name:", child.name, "Parent name:", child.parent?.name);
                
                if (child.parent && child.parent.name.toLowerCase().includes('court')) {
                    console.log('Court found:', child.parent);
                    courtObject = child.parent;
                }

                // Modificar la detección de pokeballs
                if (child.parent && child.parent.name.toLowerCase().includes('pokeball')) {
                    console.log('Pokeball found:', child.parent);
                    pokeballs.push(child.parent);
                }
            }
        });

        console.log('Final courtObject:', courtObject);
        setTimeout(() => {
            console.log("Testing courtObject after load:", courtObject);
        }, 3000);

        console.log("Objects in scene:");
            world.traverse(child => {
                console.log(child.name);
        });

        character = world.getObjectByName('character');
        if (character) {
            console.log('Character found:', character);
            character.velocity = 0;
            character.position.y = INITIAL_Y;
        }

        scene.add(world);
    });
}

function handleMovement() {
    if (!character) return;

    const speed = 0.6;

    if (keys[' '] && !isJumping) {
        isJumping = true;
        character.velocity = JUMP_FORCE;
    }

    if (isJumping) {
        character.position.y += character.velocity;
        character.velocity -= GRAVITY;

        if (character.position.y <= INITIAL_Y) {
            character.position.y = INITIAL_Y;
            character.velocity = 0;
            isJumping = false;
        }
    }

    if (keys['w'] || keys['ArrowUp']) {
        character.position.z -= speed;
        character.rotation.y = Math.PI / 2;
        updateCameraPosition();
    }
    if (keys['s'] || keys['ArrowDown']) {
        character.position.z += speed;
        character.rotation.y = -Math.PI / 2;
        updateCameraPosition();
    }

    if (keys['a'] || keys['ArrowLeft']) {
        character.position.x -= speed;
        character.rotation.y = Math.PI;
        updateCameraPosition();
    }
    if (keys['d'] || keys['ArrowRight']) {
        character.position.x += speed;
        character.rotation.y = 0;
        updateCameraPosition();
    }
}

function updateCameraPosition() {
    camera.position.x = character.position.x + cameraOffset.x;
    camera.position.y = character.position.y + cameraOffset.y;
    camera.position.z = character.position.z + cameraOffset.z;
    
    controls.target.copy(character.position);
    controls.update();
}

function onWindowResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    const aspect = sizes.width / sizes.height;
    
    camera.left = -aspect * 50;
    camera.right = aspect * 50;
    camera.top = 50;
    camera.bottom = -50;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Modal functions
function showModal() {
    modal.classList.remove("hidden");
    modalBgOverlay.classList.remove("hidden");
}

function hideModal() {
    modal.classList.add("hidden");
    modalBgOverlay.classList.add("hidden");
}
function showPokeballModal() {
    pokeballModal.classList.remove("hidden");
    pokeballModalOverlay.classList.remove("hidden");
}

function hidePokeballModal() {
    pokeballModal.classList.add("hidden");
    pokeballModalOverlay.classList.add("hidden");
}


// Raycaster functions

function onMouseMove(event) {
    if (!courtObject && pokeballs.length === 0) return;

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    
    // Comprobar intersección con court y pokeballs
    const courtIntersects = courtObject ? raycaster.intersectObjects(courtObject.children, true) : [];
    const pokeballIntersects = raycaster.intersectObjects(pokeballs.flatMap(pb => pb.children), true);

    if (courtIntersects.length > 0) {
        intersectObject = "court";
        document.body.style.cursor = "pointer";
    } else if (pokeballIntersects.length > 0) {
        intersectObject = pokeballIntersects[0].object.parent.name;
        document.body.style.cursor = "pointer";
    } else {
        intersectObject = "";
        document.body.style.cursor = "default";
    }
}

function onClick(event) {
    if (!courtObject && pokeballs.length === 0) return;

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    
    const pokeballIntersects = raycaster.intersectObjects(pokeballs.flatMap(pb => pb.children), true);
    if (pokeballIntersects.length > 0) {
        const pokeball = pokeballIntersects[0].object.parent;
        console.log("Pokeball clicked:", pokeball.name);
        showPokeballModal();
        return;
    }

    const courtIntersects = courtObject ? raycaster.intersectObjects(courtObject.children, true) : [];
    if (courtIntersects.length > 0) {
        showModal();
    }
}



function animate() {
    requestAnimationFrame(animate);
    handleMovement();
    controls.update();
    renderer.render(scene, camera);
}

init();