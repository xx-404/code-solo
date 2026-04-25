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
          <input type="checkbox" v-model="enableAnimation" /> 启用动态效果
        </label>
      </div>

      <div class="control-group" v-if="enableAnimation">
        <label>动画速度: {{ animationSpeed.toFixed(2) }}</label>
        <input type="range" v-model.number="animationSpeed" min="0.1" max="2" step="0.1" />
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Props 定义
const props = defineProps({
  width: { type: Number, default: 50 },
  depth: { type: Number, default: 50 },
  segments: { type: Number, default: 50 },
  colorScheme: { type: String, default: 'greenBrown' },
  showControls: { type: Boolean, default: true },
  enableAnimation: { type: Boolean, default: false },
  animationSpeed: { type: Number, default: 0.5 },
  backgroundColor: { type: String, default: '#87CEEB' }
})

// Emits 定义
const emit = defineEmits(['terrainCreated', 'colorSchemeChanged', 'error'])

// 响应式状态
const canvasContainer = ref(null)
const selectedColorScheme = ref(props.colorScheme)
const showControls = ref(props.showControls)
const enableAnimation = ref(props.enableAnimation)
const animationSpeed = ref(props.animationSpeed)
const width = ref(props.width)
const depth = ref(props.depth)
const segments = ref(props.segments)

// 颜色方案定义
const colorSchemes = {
  greenBrown: {
    name: '绿色到棕色',
    lowColor: { r: 0.133, g: 0.545, b: 0.133 },
    highColor: { r: 0.545, g: 0.270, b: 0.074 },
    description: '自然山地景观'
  },
  desert: {
    name: '沙漠风格',
    lowColor: { r: 0.961, g: 0.871, b: 0.702 },
    highColor: { r: 0.761, g: 0.600, b: 0.420 },
    description: '沙丘景观'
  },
  snowMountain: {
    name: '雪山',
    lowColor: { r: 0.500, g: 0.700, b: 0.900 },
    highColor: { r: 1.000, g: 1.000, b: 1.000 },
    description: '雪山冰川'
  },
  ocean: {
    name: '海洋',
    lowColor: { r: 0.000, g: 0.000, b: 0.500 },
    highColor: { r: 0.000, g: 0.700, b: 0.900 },
    description: '海洋深度'
  },
  volcano: {
    name: '火山',
    lowColor: { r: 0.300, g: 0.300, b: 0.300 },
    highColor: { r: 1.000, g: 0.300, b: 0.000 },
    description: '火山熔岩'
  }
}

// Three.js 相关变量
let scene = null
let camera = null
let renderer = null
let controls = null
let terrain = null
let animationId = null
let clock = null

/**
 * 创建地形几何体
 * @param {number} width - 地形宽度
 * @param {number} depth - 地形深度
 * @param {number} segmentsX - X轴分段数
 * @param {number} segmentsZ - Z轴分段数
 * @param {number} time - 时间参数
 * @returns {THREE.BufferGeometry} 地形几何体
 */
function createTerrainGeometry(width, depth, segmentsX, segmentsZ, time = 0) {
  const geometry = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ)
  geometry.rotateX(-Math.PI / 2)

  const positionArray = geometry.attributes.position.array
  const colorArray = []

  for (let i = 0; i < positionArray.length; i += 3) {
    const x = positionArray[i]
    const z = positionArray[i + 2]
    
    const height = Math.sin(x * 0.3 + time * 0.1) * Math.cos(z * 0.3 + time * 0.05) * 5 + 
                  Math.sin(x * 0.1 + 1 + time * 0.02) * Math.cos(z * 0.15 + 0.5 + time * 0.01) * 3
    
    positionArray[i + 1] = height
    colorArray.push(0, 0, 0)
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3))
  geometry.computeVertexNormals()

  return geometry
}

/**
 * 根据颜色方案更新顶点颜色
 * @param {THREE.BufferGeometry} geometry - 地形几何体
 * @param {string} schemeKey - 颜色方案键名
 */
function updateVertexColors(geometry, schemeKey) {
  const scheme = colorSchemes[schemeKey] || colorSchemes.greenBrown
  const positionArray = geometry.attributes.position.array
  const colorArray = geometry.attributes.color.array

  for (let i = 0; i < positionArray.length; i += 3) {
    const height = positionArray[i + 1]
    const normalizedHeight = (height + 8) / 16
    
    const r = scheme.lowColor.r + normalizedHeight * (scheme.highColor.r - scheme.lowColor.r)
    const g = scheme.lowColor.g + normalizedHeight * (scheme.highColor.g - scheme.lowColor.g)
    const b = scheme.lowColor.b + normalizedHeight * (scheme.highColor.b - scheme.lowColor.b)
    
    colorArray[i] = r
    colorArray[i + 1] = g
    colorArray[i + 2] = b
  }

  geometry.attributes.color.needsUpdate = true
}

/**
 * 创建地形材质
 * @param {string} schemeKey - 颜色方案键名
 * @returns {THREE.MeshLambertMaterial} 材质
 */
function createTerrainMaterial(schemeKey) {
  return new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide
  })
}

/**
 * 初始化 Three.js 场景
 */
function initScene() {
  if (!canvasContainer.value) return

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(props.backgroundColor)

  // 创建相机
  const containerRect = canvasContainer.value.getBoundingClientRect()
  camera = new THREE.PerspectiveCamera(
    75,
    containerRect.width / containerRect.height,
    0.1,
    1000
  )
  camera.position.set(30, 20, 30)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(containerRect.width, containerRect.height)
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasContainer.value.appendChild(renderer.domElement)

  // 创建轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // 创建时钟
  clock = new THREE.Clock()

  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  // 创建初始地形
  recreateTerrain()
}

/**
 * 重新创建地形
 */
function recreateTerrain() {
  // 清理旧地形
  if (terrain) {
    scene.remove(terrain)
    terrain.geometry.dispose()
    terrain.material.dispose()
  }

  try {
    // 创建新地形
    const geometry = createTerrainGeometry(width.value, depth.value, segments.value, segments.value, 0)
    const material = createTerrainMaterial(selectedColorScheme.value)
    
    // 更新顶点颜色
    updateVertexColors(geometry, selectedColorScheme.value)
    
    // 创建网格
    terrain = new THREE.Mesh(geometry, material)
    scene.add(terrain)

    emit('terrainCreated', { width: width.value, depth: depth.value, segments: segments.value })
  } catch (error) {
    console.error('创建地形失败:', error)
    emit('error', error)
  }
}

/**
 * 应用颜色方案
 */
function applyColorScheme() {
  if (terrain) {
    updateVertexColors(terrain.geometry, selectedColorScheme.value)
    emit('colorSchemeChanged', selectedColorScheme.value)
  }
}

/**
 * 重置相机位置
 */
function resetCamera() {
  if (camera && controls) {
    camera.position.set(30, 20, 30)
    camera.lookAt(0, 0, 0)
    controls.reset()
  }
}

/**
 * 动画循环
 */
function animate() {
  animationId = requestAnimationFrame(animate)

  const elapsedTime = clock.getElapsedTime()

  // 动态更新地形（如果启用动画）
  if (enableAnimation.value && terrain) {
    const time = elapsedTime * animationSpeed.value
    const geometry = terrain.geometry
    const positionArray = geometry.attributes.position.array

    for (let i = 0; i < positionArray.length; i += 3) {
      const x = positionArray[i]
      const z = positionArray[i + 2]
      
      const height = Math.sin(x * 0.3 + time * 0.1) * Math.cos(z * 0.3 + time * 0.05) * 5 + 
                    Math.sin(x * 0.1 + 1 + time * 0.02) * Math.cos(z * 0.15 + 0.5 + time * 0.01) * 3
      
      positionArray[i + 1] = height
    }

    // 标记位置属性需要更新
    geometry.attributes.position.needsUpdate = true
    // 重新计算法向量
    geometry.computeVertexNormals()
    
    // 更新颜色（根据新高度）
    updateVertexColors(geometry, selectedColorScheme.value)
  }

  // 更新控制器
  controls.update()
  
  // 渲染场景
  renderer.render(scene, camera)
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  if (!canvasContainer.value || !camera || !renderer) return
  
  const containerRect = canvasContainer.value.getBoundingClientRect()
  camera.aspect = containerRect.width / containerRect.height
  camera.updateProjectionMatrix()
  renderer.setSize(containerRect.width, containerRect.height)
}

// 组件挂载时初始化
onMounted(() => {
  try {
    initScene()
    animate()
    window.addEventListener('resize', handleResize)
  } catch (error) {
    console.error('初始化 Three.js 场景失败:', error)
    emit('error', error)
  }
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  if (terrain) {
    terrain.geometry.dispose()
    terrain.material.dispose()
  }
  
  if (renderer) {
    renderer.dispose()
    if (canvasContainer.value && renderer.domElement) {
      canvasContainer.value.removeChild(renderer.domElement)
    }
  }
  
  if (controls) {
    controls.dispose()
  }
})

// 监听 props 变化
watch(() => props.colorScheme, (newValue) => {
  selectedColorScheme.value = newValue
  applyColorScheme()
})

watch(() => props.enableAnimation, (newValue) => {
  enableAnimation.value = newValue
})

watch(() => props.animationSpeed, (newValue) => {
  animationSpeed.value = newValue
})

watch(() => props.showControls, (newValue) => {
  showControls.value = newValue
})

// 暴露方法给父组件
defineExpose({
  recreateTerrain,
  applyColorScheme,
  resetCamera,
  colorSchemes
})
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
