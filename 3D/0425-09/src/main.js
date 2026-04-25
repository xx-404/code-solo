import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// 相机
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 4, 10);
camera.lookAt(0, 0, 0);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 光照系统
function createLighting(scene) {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 聚光灯
    const spotLight = new THREE.SpotLight(0xffffff, 3.5);
    spotLight.position.set(5, 10, 5);
    spotLight.castShadow = true;
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;

    // 聚光灯阴影设置
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = 50;
    spotLight.shadow.camera.fov = 30;

    scene.add(spotLight);

    return {
        ambientLight,
        spotLight
    };
}

const lighting = createLighting(scene);

// 环面结配置
const torusKnotConfig = {
    radius: 1.5,
    tube: 0.5,
    tubularSegments: 200,
    radialSegments: 32,
    position: { x: 0, y: 1.5, z: 0 },
    material: {
        color: 0xff3333,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1.5
    }
};

// 环面结
const torusKnotGeometry = new THREE.TorusKnotGeometry(
    torusKnotConfig.radius,
    torusKnotConfig.tube,
    torusKnotConfig.tubularSegments,
    torusKnotConfig.radialSegments
);
const torusKnotMaterial = new THREE.MeshStandardMaterial(torusKnotConfig.material);
const torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
torusKnot.position.set(
    torusKnotConfig.position.x,
    torusKnotConfig.position.y,
    torusKnotConfig.position.z
);
torusKnot.castShadow = true;
torusKnot.receiveShadow = false;
scene.add(torusKnot);

// 地面
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    metalness: 0.1,
    roughness: 0.8,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.castShadow = false;
ground.receiveShadow = true;
scene.add(ground);

// 窗口大小调整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    // 环面结旋转
    torusKnot.rotation.x += 0.005;
    torusKnot.rotation.y += 0.01;

    controls.update();
    renderer.render(scene, camera);
}

animate();
