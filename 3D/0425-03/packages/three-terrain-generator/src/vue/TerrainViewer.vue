<template>
  <div class="terrain-viewer">
    <div class="canvas-container" ref="canvasContainer"></div>
    
    <!-- 控制面板 -->
    <div class="controls-panel" v-if="showControls">
      <h3>地形设置</h3>
      
      <div class="control-group">
        <label>颜色方案:</label>
        <select v-model="selectedColorScheme" @change="applyColorScheme">
          <option v-for="(scheme, key) in colorSchemes" :key="key" :value="key">
            {{ scheme.name }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label>地形宽度: {{ width }}</label>
        <input type="range" v-model.number="width" min="20" max="100" step="10" @change="recreateTerrain" />
      </div>

      <div class="control-group">
        <label>地形深度: {{ depth }}</label>
        <input type="range" v-model.number="depth" min="20" max="100" step="10" @change="recreateTerrain" />
      </div>

      <div class="control-group">
        <label>分段数: {{ segments }}</label>
        <input type="range" v-model.number="segments" min="20" max="100" step="10" @change="recreateTerrain" />
      </div>

      <div class="control-group">
        <label>
          <input type="checkbox" v-model="enableAnimation" @change="onAnimationChange" /> 启用动态效果
        </label>
      </div>

      <div class="control-group" v-if="enableAnimation">
        <label>动画速度: {{ animationSpeed.toFixed(2) }}</label>
        <input type="range" v-model.number="animationSpeed" min="0.1" max="2" step="0.1" />
      </div>

      <div class="control-group">
        <label>
          <input type="checkbox" v-model="useShaderMaterial" @change="onShaderChange" /> 使用Shader材质（高性能）
        </label>
      </div>

      <button class="reset-btn" @click="resetCamera">重置视角</button>
    </div>

    <!-- 切换控制面板按钮 -->
    <button class="toggle-controls-btn" @click="showControls = !showControls">
      {{ showControls ? '隐藏控制' : '显示控制' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  colorSchemes,
  createTerrainGeometry,
  updateTerrainGeometry,
  updateTerrainColors,
  createTerrainMaterial,
  createDynamicTerrainMaterial,
  updateShaderMaterial
} from '../core/index.js';

// Props 定义
const props = defineProps({
  width: { type: Number, default: 50 },
  depth: { type: Number, default: 50 },
  segments: { type: Number, default: 50 },
  colorScheme: { type: String, default: 'greenBrown' },
  showControls: { type: Boolean, default: true },
  enableAnimation: { type: Boolean, default: false },
  animationSpeed: { type: Number, default: 0.5 },
  backgroundColor: { type: String, default: '#87CEEB' },
  useShaderMaterial: { type: Boolean, default: false }
});

// Emits 定义
const emit = defineEmits(['terrainCreated', 'colorSchemeChanged', 'animationStarted', 'animationStopped', 'error']);

// 响应式状态
const canvasContainer = ref(null);
const selectedColorScheme = ref(props.colorScheme);
const showControls = ref(props.showControls);
const enableAnimation = ref(props.enableAnimation);
const animationSpeed = ref(props.animationSpeed);
const width = ref(props.width);
const depth = ref(props.depth);
const segments = ref(props.segments);
const useShaderMaterial = ref(props.useShaderMaterial);

// Three.js 相关变量
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let terrain = null;
let animationId = null;
let clock = null;

/**
 * 初始化 Three.js 场景
 */
function initScene() {
  if (!canvasContainer.value) return;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(props.backgroundColor);

  // 创建相机
  const containerRect = canvasContainer.value.getBoundingClientRect();
  camera = new THREE.PerspectiveCamera(
    75,
    containerRect.width / containerRect.height,
    0.1,
    1000
  );
  camera.position.set(30, 20, 30);
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(containerRect.width, containerRect.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  canvasContainer.value.appendChild(renderer.domElement);

  // 创建轨道控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 创建时钟
  clock = new THREE.Clock();

  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // 创建初始地形
  recreateTerrain();
}

/**
 * 重新创建地形
 */
function recreateTerrain() {
  // 清理旧地形
  if (terrain) {
    scene.remove(terrain);
    terrain.geometry.dispose();
    terrain.material.dispose();
  }

  try {
    if (useShaderMaterial.value) {
      // 使用Shader材质（高性能）
      const geometry = createTerrainGeometry({
        width: width.value,
        depth: depth.value,
        segmentsX: segments.value,
        segmentsZ: segments.value
      });
      const material = createDynamicTerrainMaterial({
        colorScheme: selectedColorScheme.value
      });
      terrain = new THREE.Mesh(geometry, material);
    } else {
      // 使用普通材质
      const geometry = createTerrainGeometry({
        width: width.value,
        depth: depth.value,
        segmentsX: segments.value,
        segmentsZ: segments.value,
        colorScheme: selectedColorScheme.value
      });
      const material = createTerrainMaterial({
        colorScheme: selectedColorScheme.value
      });
      terrain = new THREE.Mesh(geometry, material);
    }

    scene.add(terrain);

    emit('terrainCreated', { 
      width: width.value, 
      depth: depth.value, 
      segments: segments.value,
      useShader: useShaderMaterial.value
    });
  } catch (error) {
    console.error('创建地形失败:', error);
    emit('error', error);
  }
}

/**
 * 应用颜色方案
 */
function applyColorScheme() {
  if (terrain) {
    if (useShaderMaterial.value && terrain.material.uniforms) {
      // 更新Shader材质的颜色uniform
      updateShaderMaterial(terrain.material, {
        colorScheme: selectedColorScheme.value
      });
    } else {
      // 更新普通材质的顶点颜色
      updateTerrainColors(terrain.geometry, selectedColorScheme.value);
    }
    emit('colorSchemeChanged', selectedColorScheme.value);
  }
}

/**
 * 重置相机位置
 */
function resetCamera() {
  if (camera && controls) {
    camera.position.set(30, 20, 30);
    camera.lookAt(0, 0, 0);
    controls.reset();
  }
}

/**
 * 动画状态变化回调
 */
function onAnimationChange() {
  if (enableAnimation.value) {
    emit('animationStarted');
  } else {
    emit('animationStopped');
  }
}

/**
 * Shader材质开关变化回调
 */
function onShaderChange() {
  recreateTerrain();
}

/**
 * 动画循环
 */
function animate() {
  animationId = requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // 动态更新地形（如果启用动画）
  if (enableAnimation.value && terrain) {
    const time = elapsedTime * animationSpeed.value;

    if (useShaderMaterial.value && terrain.material.uniforms) {
      // Shader材质：只需要更新时间uniform，GPU自动计算
      terrain.material.uniforms.time.value = time;
    } else {
      // 普通材质：需要在CPU上更新顶点数据
      updateTerrainGeometry(
        terrain.geometry,
        time,
        undefined,
        selectedColorScheme.value,
        true
      );
    }
  }

  // 更新控制器
  controls.update();
  
  // 渲染场景
  renderer.render(scene, camera);
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  if (!canvasContainer.value || !camera || !renderer) return;
  
  const containerRect = canvasContainer.value.getBoundingClientRect();
  camera.aspect = containerRect.width / containerRect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(containerRect.width, containerRect.height);
}

// 组件挂载时初始化
onMounted(() => {
  try {
    initScene();
    animate();
    window.addEventListener('resize', handleResize);
  } catch (error) {
    console.error('初始化 Three.js 场景失败:', error);
    emit('error', error);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  if (terrain) {
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
  
  if (renderer) {
    renderer.dispose();
    if (canvasContainer.value && renderer.domElement) {
      canvasContainer.value.removeChild(renderer.domElement);
    }
  }
  
  if (controls) {
    controls.dispose();
  }
});

// 监听 props 变化
watch(() => props.colorScheme, (newValue) => {
  selectedColorScheme.value = newValue;
  applyColorScheme();
});

watch(() => props.enableAnimation, (newValue) => {
  enableAnimation.value = newValue;
});

watch(() => props.animationSpeed, (newValue) => {
  animationSpeed.value = newValue;
});

watch(() => props.showControls, (newValue) => {
  showControls.value = newValue;
});

watch(() => props.useShaderMaterial, (newValue) => {
  useShaderMaterial.value = newValue;
  recreateTerrain();
});

// 暴露方法给父组件
defineExpose({
  recreateTerrain,
  applyColorScheme,
  resetCamera,
  colorSchemes,
  terrain,
  scene,
  camera
});
</script>

<style scoped>
.terrain-viewer {
  position: relative;
  width: 100%;
  height: 100%;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.controls-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  z-index: 100;
}

.controls-panel h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 8px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.control-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.control-group select:focus {
  outline: none;
  border-color: #4CAF50;
}

.control-group input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
  transition: transform 0.2s;
}

.control-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.control-group input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.reset-btn {
  width: 100%;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.reset-btn:hover {
  background: #45a049;
}

.toggle-controls-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.toggle-controls-btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}
</style>
