import * as THREE from 'three';

let scene, camera, renderer, cubeGroup;

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function createColoredCube(width, height, depth) {
    const materials = [
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
        new THREE.MeshBasicMaterial({ color: 0x0000ff }),
        new THREE.MeshBasicMaterial({ color: 0xffff00 }),
        new THREE.MeshBasicMaterial({ color: 0xff00ff }),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    ];

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const cube = new THREE.Mesh(geometry, materials);

    return cube;
}

function addEdgeLines(mesh, color = 0xffffff) {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: color,
        linewidth: 2
    });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);

    return wireframe;
}

function createCubeWithEdges(width, height, depth) {
    const group = new THREE.Group();
    
    const cube = createColoredCube(width, height, depth);
    group.add(cube);

    const wireframe = addEdgeLines(cube);
    group.add(wireframe);

    return group;
}

function startAnimation() {
    function animate() {
        requestAnimationFrame(animate);
        
        cubeGroup.rotation.x += 0.01;
        cubeGroup.rotation.y += 0.01;
        
        renderer.render(scene, camera);
    }

    animate();
}

function setupResizeHandler() {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function init() {
    initScene();
    
    cubeGroup = createCubeWithEdges(2, 2, 2);
    scene.add(cubeGroup);
    
    setupResizeHandler();
    startAnimation();
}

init();
