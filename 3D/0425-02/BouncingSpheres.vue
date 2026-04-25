<template>
  <div 
    ref="containerRef" 
    class="bouncing-spheres-container"
    :style="{ backgroundColor: backgroundColor }"
  >
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';

// ==================== Props 定义 ====================
const props = defineProps({
  /**
   * 球体数量
   */
  sphereCount: {
    type: Number,
    default: 20
  },
  
  /**
   * 背景颜色
   */
  backgroundColor: {
    type: String,
    default: '#1a1a2e'
  },
  
  /**
   * 场景宽度（默认自动适应容器）
   */
  width: {
    type: [Number, String],
    default: 'auto'
  },
  
  /**
   * 场景高度（默认自动适应容器）
   */
  height: {
    type: [Number, String],
    default: 'auto'
  },
  
  /**
   * 相机位置
   */
  cameraPosition: {
    type: Object,
    default: () => ({ x: 0, y: 5, z: 15 })
  },
  
  /**
   * 相机看向的点
   */
  cameraLookAt: {
    type: Object,
    default: () => ({ x: 0, y: 2, z: 0 })
  },
  
  /**
   * 地面配置
   */
  groundConfig: {
    type: Object,
    default: () => ({
      y: -1,
      size: 50,
      color: 0x2a2a4a,
      opacity: 0.8,
      roughness: 0.8,
      metalness: 0.2
    })
  },
  
  /**
   * 基础球体配置（所有球体共享）
   */
  baseSphereConfig: {
    type: Object,
    default: () => ({})
  },
  
  /**
   * 独立球体配置数组（覆盖基础配置）
   */
  individualConfigs: {
    type: Array,
    default: () => []
  },
  
  /**
   * 是否启用阴影
   */
  enableShadows: {
    type: Boolean,
    default: true
  },
  
  /**
   * 是否自动启动动画
   */
  autoPlay: {
    type: Boolean,
    default: true
  }
});

// ==================== 事件定义 ====================
const emit = defineEmits([
  'initialized',    // 初始化完成
  'animationStart', // 动画开始
  'animationStop',  // 动画停止
  'error'           // 错误
]);

// ==================== 响应式数据 ====================
const containerRef = ref(null);
const canvasRef = ref(null);

// Three.js 核心对象
let scene = null;
let camera = null;
let renderer = null;
let clock = null;
let animationFrameId = null;
let isPlaying = false;

// 球体数据
let spheres = [];
let ground = null;
let ambientLight = null;
let directionalLight = null;

// ==================== 常量定义 ====================

// 球体默认配置
const DEFAULT_SPHERE_CONFIG = {
  radius: 0.5,
  segments: 32,
  castShadow: true,
  roughness: 0.3,
  metalness: 0.3,
  positionX: { min: -8, max: 8 },
  positionZ: { min: -8, max: 8 },
  bounceHeight: { min: 1, max: 3 },
  bounceSpeed: { min: 2, max: 5 },
  sizeBase: 1,
  sizeAmplitude: { min: 0.3, max: 0.6 }
};

// ==================== 工具函数 ====================

/**
 * 在范围内生成随机值
 * @param {number|Object} range - 固定值或范围对象 {min, max}
 * @returns {number} 随机值
 */
function randomInRange(range) {
  if (typeof range === 'number') return range;
  if (range.min !== undefined && range.max !== undefined) {
    return range.min + Math.random() * (range.max - range.min);
  }
  return range;
}

/**
 * 深度合并配置对象
 * @param {Object} defaults - 默认配置
 * @param {Object} overrides - 覆盖配置
 * @returns {Object} 合并后的配置
 */
function mergeConfigs(defaults, overrides) {
  if (!overrides) return { ...defaults };
  
  const result = { ...defaults };
  for (const key in overrides) {
    if (overrides[key] !== undefined) {
      if (typeof overrides[key] === 'object' && 
          !Array.isArray(overrides[key]) && 
          overrides[key] !== null) {
        result[key] = mergeConfigs(defaults[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
  }
  return result;
}

// ==================== 球体工厂函数 ====================

/**
 * 创建单个弹跳球体
 * @param {Object} config - 球体配置
 * @param {THREE.Scene} targetScene - 目标场景
 * @param {number} groundY - 地面Y坐标
 * @returns {Object} 球体数据对象
 */
function createBouncingSphere(config, targetScene, groundY = 0) {
  const mergedConfig = mergeConfigs(DEFAULT_SPHERE_CONFIG, config);
  
  // 创建几何体
  const geometry = new THREE.SphereGeometry(
    mergedConfig.radius,
    mergedConfig.segments,
    mergedConfig.segments
  );
  
  // 创建材质
  const material = new THREE.MeshStandardMaterial({
    color: mergedConfig.color || new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    ),
    roughness: mergedConfig.roughness,
    metalness: mergedConfig.metalness
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  
  // 设置阴影
  if (props.enableShadows && mergedConfig.castShadow) {
    sphere.castShadow = true;
  }
  
  // 设置X位置
  const x = mergedConfig.positionX !== undefined 
    ? (typeof mergedConfig.positionX === 'object' 
        ? randomInRange(mergedConfig.positionX) 
        : mergedConfig.positionX)
    : randomInRange(DEFAULT_SPHERE_CONFIG.positionX);
  
  // 设置Z位置
  const z = mergedConfig.positionZ !== undefined
    ? (typeof mergedConfig.positionZ === 'object'
        ? randomInRange(mergedConfig.positionZ)
        : mergedConfig.positionZ)
    : randomInRange(DEFAULT_SPHERE_CONFIG.positionZ);
  
  sphere.position.x = x;
  sphere.position.z = z;
  
  // 设置初始Y位置（确保在地面以上）
  const initialY = mergedConfig.initialY !== undefined
    ? mergedConfig.initialY
    : groundY + Math.random() * 2;
  sphere.position.y = initialY;
  
  // 计算安全的弹跳高度（确保不会穿地）
  // 最低点 = baseY - bounceHeight >= groundY
  const rawBounceHeight = randomInRange(mergedConfig.bounceHeight);
  const maxSafeHeight = sphere.position.y - groundY;
  const bounceHeight = Math.min(rawBounceHeight, maxSafeHeight * 0.9);
  
  // 其他弹跳参数
  const bounceSpeed = randomInRange(mergedConfig.bounceSpeed);
  const phase = mergedConfig.phase !== undefined 
    ? mergedConfig.phase 
    : Math.random() * Math.PI * 2;
  
  // 大小变化参数
  const sizeBase = mergedConfig.sizeBase;
  const sizeAmplitude = randomInRange(mergedConfig.sizeAmplitude);
  
  // 球体数据对象
  const sphereData = {
    mesh: sphere,
    baseY: sphere.position.y,
    groundY: groundY,
    bounceHeight: bounceHeight,
    bounceSpeed: bounceSpeed,
    phase: phase,
    sizeBase: sizeBase,
    sizeAmplitude: sizeAmplitude,
    config: mergedConfig
  };
  
  // 添加到场景
  if (targetScene) {
    targetScene.add(sphere);
  }
  
  return sphereData;
}

/**
 * 批量创建弹跳球体
 * @param {number} count - 数量
 * @param {Object} baseConfig - 基础配置
 * @param {Array<Object>} individualConfigs - 独立配置数组
 * @param {THREE.Scene} targetScene - 目标场景
 * @param {number} groundY - 地面Y坐标
 * @returns {Array<Object>} 球体数据数组
 */
function createSpheres(count, baseConfig = {}, individualConfigs = [], targetScene, groundY = 0) {
  const result = [];
  
  for (let i = 0; i < count; i++) {
    // 合并配置
    let config = mergeConfigs({}, baseConfig);
    
    // 独立配置覆盖
    if (individualConfigs[i]) {
      config = mergeConfigs(config, individualConfigs[i]);
    }
    
    const sphereData = createBouncingSphere(config, targetScene, groundY);
    result.push(sphereData);
  }
  
  return result;
}

// ==================== 动画函数 ====================

/**
 * 更新单个球体的动画
 * @param {Object} sphereData - 球体数据
 * @param {number} elapsedTime - 流逝时间
 */
function updateSphereAnimation(sphereData, elapsedTime) {
  const { mesh, baseY, bounceHeight, bounceSpeed, phase, sizeBase, sizeAmplitude } = sphereData;
  
  const angle = bounceSpeed * elapsedTime + phase;
  const sineValue = Math.sin(angle);
  
  // 更新位置
  mesh.position.y = baseY + bounceHeight * sineValue;
  
  // 更新大小
  const scale = sizeBase + sizeAmplitude * sineValue;
  mesh.scale.set(scale, scale, scale);
}

/**
 * 动画循环
 */
function animate() {
  if (!isPlaying) return;
  
  animationFrameId = requestAnimationFrame(animate);
  
  const elapsedTime = clock.getElapsedTime();
  
  // 更新所有球体
  spheres.forEach(sphereData => {
    updateSphereAnimation(sphereData, elapsedTime);
  });
  
  // 渲染
  renderer.render(scene, camera);
}

// ==================== 核心方法 ====================

/**
 * 初始化Three.js场景
 */
function initScene() {
  if (!containerRef.value) {
    emit('error', new Error('Container element not found'));
    return;
  }
  
  // 获取容器尺寸
  const container = containerRef.value;
  const width = props.width === 'auto' ? container.clientWidth : Number(props.width);
  const height = props.height === 'auto' ? container.clientHeight : Number(props.height);
  
  // 创建场景
  scene = new THREE.Scene();
  
  // 创建相机
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(
    props.cameraPosition.x,
    props.cameraPosition.y,
    props.cameraPosition.z
  );
  camera.lookAt(
    props.cameraLookAt.x,
    props.cameraLookAt.y,
    props.cameraLookAt.z
  );
  
  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    canvas: canvasRef.value,
    alpha: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // 启用阴影
  if (props.enableShadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  
  // 创建灯光
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  
  if (props.enableShadows) {
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
  }
  
  scene.add(directionalLight);
  
  // 创建地面
  const groundConfig = props.groundConfig;
  const planeGeometry = new THREE.PlaneGeometry(groundConfig.size, groundConfig.size);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: groundConfig.color,
    transparent: true,
    opacity: groundConfig.opacity,
    roughness: groundConfig.roughness,
    metalness: groundConfig.metalness
  });
  
  ground = new THREE.Mesh(planeGeometry, planeMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundConfig.y;
  
  if (props.enableShadows) {
    ground.receiveShadow = true;
  }
  
  scene.add(ground);
  
  // 创建球体
  spheres = createSpheres(
    props.sphereCount,
    props.baseSphereConfig,
    props.individualConfigs,
    scene,
    groundConfig.y
  );
  
  // 创建时钟
  clock = new THREE.Clock();
  
  emit('initialized', { scene, camera, renderer, spheres });
}

/**
 * 启动动画
 */
function play() {
  if (isPlaying) return;
  
  isPlaying = true;
  emit('animationStart');
  animate();
}

/**
 * 暂停动画
 */
function pause() {
  if (!isPlaying) return;
  
  isPlaying = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  emit('animationStop');
}

/**
 * 重置场景
 */
function reset() {
  pause();
  
  // 清理现有球体
  spheres.forEach(sphereData => {
    scene.remove(sphereData.mesh);
    sphereData.mesh.geometry.dispose();
    sphereData.mesh.material.dispose();
  });
  spheres = [];
  
  // 重新创建球体
  spheres = createSpheres(
    props.sphereCount,
    props.baseSphereConfig,
    props.individualConfigs,
    scene,
    props.groundConfig.y
  );
  
  // 重置时钟
  clock = new THREE.Clock();
  
  if (props.autoPlay) {
    play();
  }
}

/**
 * 调整大小
 */
function resize() {
  if (!containerRef.value || !camera || !renderer) return;
  
  const container = containerRef.value;
  const width = props.width === 'auto' ? container.clientWidth : Number(props.width);
  const height = props.height === 'auto' ? container.clientHeight : Number(props.height);
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

/**
 * 清理资源
 */
function dispose() {
  pause();
  
  // 清理球体
  spheres.forEach(sphereData => {
    if (scene) scene.remove(sphereData.mesh);
    sphereData.mesh.geometry.dispose();
    sphereData.mesh.material.dispose();
  });
  spheres = [];
  
  // 清理地面
  if (ground) {
    if (scene) scene.remove(ground);
    ground.geometry.dispose();
    ground.material.dispose();
    ground = null;
  }
  
  // 清理灯光
  if (ambientLight) {
    if (scene) scene.remove(ambientLight);
    ambientLight = null;
  }
  
  if (directionalLight) {
    if (scene) scene.remove(directionalLight);
    directionalLight = null;
  }
  
  // 清理渲染器
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  
  // 清理场景
  scene = null;
  camera = null;
  clock = null;
}

// ==================== 暴露方法给父组件 ====================
defineExpose({
  play,
  pause,
  reset,
  resize,
  dispose,
  getScene: () => scene,
  getCamera: () => camera,
  getRenderer: () => renderer,
  getSpheres: () => spheres
});

// ==================== 生命周期 ====================

onMounted(() => {
  try {
    initScene();
    
    if (props.autoPlay) {
      play();
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', resize);
  } catch (error) {
    emit('error', error);
    console.error('BouncingSpheres initialization error:', error);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', resize);
  dispose();
});

// ==================== 监听Props变化 ====================

watch(
  () => props.sphereCount,
  () => {
    if (scene) {
      reset();
    }
  }
);

watch(
  () => [props.cameraPosition, props.cameraLookAt],
  () => {
    if (camera) {
      camera.position.set(
        props.cameraPosition.x,
        props.cameraPosition.y,
        props.cameraPosition.z
      );
      camera.lookAt(
        props.cameraLookAt.x,
        props.cameraLookAt.y,
        props.cameraLookAt.z
      );
    }
  },
  { deep: true }
);
</script>

<style scoped>
.bouncing-spheres-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bouncing-spheres-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
