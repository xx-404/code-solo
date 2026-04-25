import * as THREE from 'three';

const CELL_SIZE = 5;
const WALL_HEIGHT = 4;
const PLAYER_SPEED = 0.12;
const PLAYER_RADIUS = 0.6;
const MOUSE_SENSITIVITY = 0.002;

const mazeMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

let scene, camera, renderer;
let playerPosition = new THREE.Vector3(-20, 1.7, -15);
let walls = [];
const keys = { w: false, a: false, s: false, d: false };

let yaw = 0;
let pitch = 0;
let pointerLocked = false;

let cameraPitch = new THREE.Object3D();
let cameraYaw = new THREE.Object3D();

let score = 0;
let collectibles = [];
const COLLECT_DISTANCE = 2.5;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 40);

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    cameraPitch.add(camera);
    cameraYaw.add(cameraPitch);
    scene.add(cameraYaw);

    cameraYaw.position.set(playerPosition.x, playerPosition.y, playerPosition.z);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(15, 30, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -40;
    directionalLight.shadow.camera.right = 40;
    directionalLight.shadow.camera.top = 40;
    directionalLight.shadow.camera.bottom = -40;
    scene.add(directionalLight);

    createGround();
    createMaze();
    createDecorations();

    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '50%';
    instructions.style.left = '50%';
    instructions.style.transform = 'translate(-50%, -50%)';
    instructions.style.color = 'white';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    instructions.style.padding = '30px';
    instructions.style.borderRadius = '10px';
    instructions.style.textAlign = 'center';
    instructions.style.fontSize = '18px';
    instructions.style.zIndex = '1000';
    instructions.innerHTML = `
        <h2 style="margin-bottom: 20px;">🏰 迷宫冒险</h2>
        <p style="margin: 10px 0;">点击屏幕开始控制</p>
        <p style="margin: 10px 0; color: #aaa;">鼠标 - 环顾四周</p>
        <p style="margin: 10px 0; color: #aaa;">W A S D - 移动</p>
        <p style="margin-top: 20px; font-size: 14px; color: #888;">按 ESC 可退出鼠标锁定</p>
    `;
    instructions.id = 'instructions';
    document.body.appendChild(instructions);

    const scoreDisplay = document.createElement('div');
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '20px';
    scoreDisplay.style.right = '20px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    scoreDisplay.style.padding = '15px 25px';
    scoreDisplay.style.borderRadius = '10px';
    scoreDisplay.style.fontSize = '24px';
    scoreDisplay.style.fontWeight = 'bold';
    scoreDisplay.style.zIndex = '1000';
    scoreDisplay.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
    scoreDisplay.innerHTML = '⭐ 分数: 0';
    scoreDisplay.id = 'scoreDisplay';
    document.body.appendChild(scoreDisplay);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    animate();
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(100, 20, 0x7a644e, 0x7a644e);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
}

function createMaze() {
    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.2
    });

    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0xA0522D,
        roughness: 0.7,
        metalness: 0.3
    });

    for (let z = 0; z < mazeMap.length; z++) {
        for (let x = 0; x < mazeMap[z].length; x++) {
            if (mazeMap[z][x] === 1) {
                const wall = new THREE.Mesh(wallGeometry, [
                    wallMaterial, wallMaterial, topMaterial, wallMaterial, wallMaterial, wallMaterial
                ]);
                wall.position.set(
                    x * CELL_SIZE - 25,
                    WALL_HEIGHT / 2,
                    z * CELL_SIZE - 25
                );
                wall.castShadow = true;
                wall.receiveShadow = true;
                scene.add(wall);

                wall.geometry.computeBoundingBox();
                wall.boundingBox = wall.geometry.boundingBox.clone().translate(wall.position);

                walls.push(wall);
            }
        }
    }
}

function createDecorations() {
    const collectiblePositions = [
        { x: 2, z: 1 },
        { x: 5, z: 2 },
        { x: 6, z: 3 },
        { x: 2, z: 5 },
        { x: 5, z: 7 },
        { x: 7, z: 9 }
    ];

    const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00, 0xff6600, 0x0066ff];

    collectiblePositions.forEach((pos, index) => {
        const group = new THREE.Group();
        
        const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: colors[index % colors.length]
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(sphere);

        const glowGeometry = new THREE.SphereGeometry(0.65, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: colors[index % colors.length],
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);

        const pointLight = new THREE.PointLight(colors[index % colors.length], 0.8, 8);
        pointLight.position.set(0, 0, 0);
        group.add(pointLight);

        group.position.set(
            pos.x * CELL_SIZE - 25,
            1.5 + Math.sin(index) * 0.3,
            pos.z * CELL_SIZE - 25
        );
        
        group.userData = {
            floatOffset: index,
            floatSpeed: 1 + index * 0.1,
            isCollectible: true,
            collected: false,
            color: colors[index % colors.length]
        };
        
        scene.add(group);
        collectibles.push(group);
    });
}

function onKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case 'w':
            keys.w = true;
            break;
        case 'a':
            keys.a = true;
            break;
        case 's':
            keys.s = true;
            break;
        case 'd':
            keys.d = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'w':
            keys.w = false;
            break;
        case 'a':
            keys.a = false;
            break;
        case 's':
            keys.s = false;
            break;
        case 'd':
            keys.d = false;
            break;
    }
}

function onMouseMove(event) {
    if (!pointerLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    yaw -= movementX * MOUSE_SENSITIVITY;
    pitch -= movementY * MOUSE_SENSITIVITY;

    pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitch));

    cameraYaw.rotation.y = yaw;
    cameraPitch.rotation.x = pitch;
}

function onClick() {
    if (!pointerLocked) {
        renderer.domElement.requestPointerLock();
    }
}

function onPointerLockChange() {
    pointerLocked = document.pointerLockElement === renderer.domElement;
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.style.display = pointerLocked ? 'none' : 'block';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkCollision(newPosition) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        newPosition,
        new THREE.Vector3(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2, PLAYER_RADIUS * 2)
    );

    for (const wall of walls) {
        if (playerBox.intersectsBox(wall.boundingBox)) {
            return true;
        }
    }
    return false;
}

function updatePlayer() {
    if (!pointerLocked) return;

    const direction = new THREE.Vector3();

    if (keys.w) direction.z -= 1;
    if (keys.s) direction.z += 1;
    if (keys.a) direction.x -= 1;
    if (keys.d) direction.x += 1;

    if (direction.length() > 0) {
        direction.normalize();

        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

        const moveX = direction.x * PLAYER_SPEED;
        const moveZ = direction.z * PLAYER_SPEED;

        const newPositionX = playerPosition.clone();
        newPositionX.x += moveX;

        if (!checkCollision(newPositionX)) {
            playerPosition.x = newPositionX.x;
        }

        const newPositionZ = playerPosition.clone();
        newPositionZ.z += moveZ;

        if (!checkCollision(newPositionZ)) {
            playerPosition.z = newPositionZ.z;
        }

        cameraYaw.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    }
}

function updateDecorations() {
    const time = Date.now() * 0.001;
    
    collectibles.forEach(collectible => {
        if (!collectible.userData.collected) {
            collectible.position.y = 1.5 + Math.sin(
                time * collectible.userData.floatSpeed + collectible.userData.floatOffset
            ) * 0.5;
            
            collectible.rotation.y += 0.02;
            collectible.rotation.x += 0.01;

            const distance = playerPosition.distanceTo(collectible.position);
            if (distance < COLLECT_DISTANCE) {
                collectItem(collectible);
            }
        }
    });
}

function collectItem(collectible) {
    collectible.userData.collected = true;
    
    collectible.scale.multiplyScalar(0);
    scene.remove(collectible);
    
    score++;
    updateScoreDisplay();
    
    showCollectEffect(collectible.position, collectible.userData.color);
}

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.innerHTML = `⭐ 分数: ${score}`;
        scoreDisplay.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreDisplay.style.transform = 'scale(1)';
        }, 150);
    }
}

function showCollectEffect(position, color) {
    const particleCount = 12;
    const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1
    });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        particle.position.copy(position);
        
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 0.15 + Math.random() * 0.1;
        particle.userData = {
            velocity: new THREE.Vector3(
                Math.cos(angle) * speed,
                (Math.random() - 0.5) * 0.2 + 0.1,
                Math.sin(angle) * speed
            ),
            life: 1,
            collected: false
        };
        
        scene.add(particle);
        
        const animateParticle = () => {
            if (particle.userData.life <= 0 || particle.userData.collected) {
                scene.remove(particle);
                return;
            }
            
            particle.position.add(particle.userData.velocity);
            particle.userData.velocity.y -= 0.008;
            particle.userData.life -= 0.03;
            particle.material.opacity = particle.userData.life;
            particle.scale.setScalar(particle.userData.life * 0.5 + 0.5);
            
            requestAnimationFrame(animateParticle);
        };
        animateParticle();
    }
}

function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    updateDecorations();
    renderer.render(scene, camera);
}

init();