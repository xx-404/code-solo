/**
 * three-terrain-generator 基础使用示例
 * 
 * 这个示例展示了如何使用核心 API 创建静态地形
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  colorSchemes,
  createTerrainGeometry,
  createTerrainMaterial,
  createTerrainMesh,
  updateTerrainColors
} from 'three-terrain-generator';

// 场景设置
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(30, 20, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 添加灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// 方式1：分别创建几何体和材质
console.log('方式1：分别创建几何体和材质');
const geometry1 = createTerrainGeometry({
  width: 50,
  depth: 50,
  segmentsX: 50,
  segmentsZ: 50,
  colorScheme: 'greenBrown'
});
const material1 = createTerrainMaterial({
  colorScheme: 'greenBrown'
});
const terrain1 = new THREE.Mesh(geometry1, material1);
// scene.add(terrain1); // 取消注释以使用此方式

// 方式2：使用 createTerrainMesh 一次性创建
console.log('方式2：使用 createTerrainMesh 一次性创建');
const terrain2 = createTerrainMesh(
  {
    width: 50,
    depth: 50,
    segmentsX: 50,
    segmentsZ: 50,
    colorScheme: 'desert'
  },
  {
    colorScheme: 'desert'
  }
);
// scene.add(terrain2); // 取消注释以使用此方式

// 方式3：使用自定义高度函数
console.log('方式3：使用自定义高度函数');
function customHeightFunction(x, z, time = 0) {
  return (
    Math.sin(x * 0.2) * 3 +
    Math.cos(z * 0.25) * 3 +
    Math.sin(x * 0.1 + z * 0.1) * 2
  );
}

const geometry3 = createTerrainGeometry({
  width: 50,
  depth: 50,
  segmentsX: 50,
  segmentsZ: 50,
  colorScheme: 'snowMountain',
  heightFunction: customHeightFunction
});
const material3 = createTerrainMaterial({ colorScheme: 'snowMountain' });
const terrain3 = new THREE.Mesh(geometry3, material3);
scene.add(terrain3); // 此方式为当前示例的默认方式

// 动态切换颜色方案示例
let currentSchemeIndex = 0;
const schemeKeys = Object.keys(colorSchemes);

setInterval(() => {
  currentSchemeIndex = (currentSchemeIndex + 1) % schemeKeys.length;
  const newScheme = schemeKeys[currentSchemeIndex];
  console.log(`切换颜色方案: ${newScheme}`);
  
  // 更新地形颜色
  updateTerrainColors(terrain3.geometry, newScheme);
  // 如果使用了新材质，需要重新创建
  // terrain3.material = createTerrainMaterial({ colorScheme: newScheme });
}, 3000);

// 窗口大小调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

console.log('基础示例加载完成！');
console.log('可用颜色方案:', schemeKeys);
