/**
 * three-terrain-generator 动态动画示例
 * 
 * 这个示例展示了两种动态地形实现方式：
 * 1. CPU 驱动的动态更新（适合复杂计算）
 * 2. GPU Shader 驱动的动态更新（高性能，推荐）
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  colorSchemes,
  createTerrainGeometry,
  createTerrainMaterial,
  createDynamicTerrainMaterial,
  updateTerrainGeometry,
  updateShaderMaterial,
  defaultHeightFunction,
  createMultiOctaveHeightFunction
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

const clock = new THREE.Clock();

// ============================================
// 方式1：CPU 驱动的动态更新
// ============================================
console.log('方式1：CPU 驱动的动态更新');

// 创建复杂的高度函数（多频率叠加）
const complexHeightFunction = createMultiOctaveHeightFunction([
  { frequency: 0.3, amplitude: 5, phase: 0 },
  { frequency: 0.6, amplitude: 2.5, phase: 1 },
  { frequency: 0.9, amplitude: 1, phase: 2 }
]);

const cpuGeometry = createTerrainGeometry({
  width: 50,
  depth: 50,
  segmentsX: 40,
  segmentsZ: 40,
  time: 0,
  colorScheme: 'ocean',
  heightFunction: complexHeightFunction
});

const cpuMaterial = createTerrainMaterial({ colorScheme: 'ocean' });
const cpuTerrain = new THREE.Mesh(cpuGeometry, cpuMaterial);
cpuTerrain.position.x = -30; // 移到左边
// scene.add(cpuTerrain); // 取消注释以使用此方式

// ============================================
// 方式2：GPU Shader 驱动的动态更新（推荐）
// ============================================
console.log('方式2：GPU Shader 驱动的动态更新（高性能）');

const shaderGeometry = createTerrainGeometry({
  width: 50,
  depth: 50,
  segmentsX: 60,
  segmentsZ: 60,
  colorScheme: 'volcano'
});

const shaderMaterial = createDynamicTerrainMaterial({
  colorScheme: 'volcano',
  amplitude: 6,
  frequency: 0.35
});

const shaderTerrain = new THREE.Mesh(shaderGeometry, shaderMaterial);
scene.add(shaderTerrain); // 此方式为当前示例的默认方式

// ============================================
// 动态颜色方案切换
// ============================================
let currentSchemeIndex = 0;
const schemeKeys = Object.keys(colorSchemes);

// 每 5 秒切换一次颜色方案
setInterval(() => {
  currentSchemeIndex = (currentSchemeIndex + 1) % schemeKeys.length;
  const newScheme = schemeKeys[currentSchemeIndex];
  console.log(`切换颜色方案: ${newScheme}`);
  
  // 更新 Shader 材质的颜色（非常高效）
  if (shaderMaterial && shaderMaterial.uniforms) {
    updateShaderMaterial(shaderMaterial, { colorScheme: newScheme });
  }
}, 5000);

// ============================================
// 动画循环
// ============================================
function animate() {
  requestAnimationFrame(animate);
  
  const elapsedTime = clock.getElapsedTime();
  
  // 更新 CPU 驱动的地形（如果启用）
  if (cpuTerrain.parent) {
    updateTerrainGeometry(
      cpuTerrain.geometry,
      elapsedTime,
      complexHeightFunction,
      'ocean',
      true
    );
  }
  
  // 更新 Shader 材质的时间（只需更新一个 uniform 值）
  if (shaderMaterial && shaderMaterial.uniforms) {
    shaderMaterial.uniforms.time.value = elapsedTime;
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// 窗口大小调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

console.log('动态动画示例加载完成！');
console.log('提示：');
console.log('  - Shader 材质方式性能最佳，适合大量顶点');
console.log('  - CPU 驱动方式适合需要复杂逻辑计算的场景');
console.log('  - 当前示例使用 Shader 方式，观察火山地形的动态变化');
