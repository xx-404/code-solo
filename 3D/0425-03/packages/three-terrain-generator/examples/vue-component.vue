<template>
  <div class="app-container">
    <h1>Three.js 地形生成器 - Vue 组件示例</h1>
    
    <div class="terrain-wrapper">
      <!-- 使用 TerrainViewer 组件 -->
      <TerrainViewer
        :width="50"
        :depth="50"
        :segments="50"
        :colorScheme="currentColorScheme"
        :show-controls="true"
        :enable-animation="enableAnimation"
        :animation-speed="animationSpeed"
        :background-color="'#87CEEB'"
        :use-shader-material="useShader"
        @terrain-created="onTerrainCreated"
        @color-scheme-changed="onColorSchemeChanged"
        @animation-started="onAnimationStarted"
        @animation-stopped="onAnimationStopped"
        @error="onError"
        ref="terrainViewer"
      />
    </div>
    
    <div class="info-panel">
      <h3>组件使用说明</h3>
      <ul>
        <li><strong>鼠标左键</strong>：旋转视角</li>
        <li><strong>鼠标右键</strong>：平移视角</li>
        <li><strong>滚轮</strong>：缩放</li>
      </ul>
      
      <div class="button-group">
        <button @click="randomColorScheme">随机颜色方案</button>
        <button @click="resetView">重置视角</button>
        <button @click="toggleShader">切换 Shader 模式</button>
      </div>
      
      <div class="status">
        <p>当前颜色方案: <span>{{ currentColorScheme }}</span></p>
        <p>动画状态: <span>{{ enableAnimation ? '运行中' : '已暂停' }}</span></p>
        <p>Shader 模式: <span>{{ useShader ? '已启用（高性能）' : '已禁用' }}</span></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { TerrainViewer, colorSchemes } from 'three-terrain-generator';

// 响应式状态
const currentColorScheme = ref('greenBrown');
const enableAnimation = ref(false);
const animationSpeed = ref(0.5);
const useShader = ref(true);
const terrainViewer = ref(null);

// 事件处理
function onTerrainCreated(data) {
  console.log('地形创建成功:', data);
}

function onColorSchemeChanged(scheme) {
  console.log('颜色方案已切换:', scheme);
}

function onAnimationStarted() {
  console.log('动画已启动');
}

function onAnimationStopped() {
  console.log('动画已停止');
}

function onError(error) {
  console.error('发生错误:', error);
}

// 方法
function randomColorScheme() {
  const schemeKeys = Object.keys(colorSchemes);
  const randomIndex = Math.floor(Math.random() * schemeKeys.length);
  currentColorScheme.value = schemeKeys[randomIndex];
  console.log('随机颜色方案:', currentColorScheme.value);
}

function resetView() {
  if (terrainViewer.value) {
    terrainViewer.value.resetCamera();
  }
}

function toggleShader() {
  useShader.value = !useShader.value;
}

onMounted(() => {
  console.log('Vue 组件示例加载完成');
  console.log('可用颜色方案:', Object.keys(colorSchemes));
});
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: white;
  padding: 20px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.terrain-wrapper {
  flex: 1;
  position: relative;
  margin: 0 20px 20px 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.info-panel {
  position: absolute;
  bottom: 30px;
  right: 30px;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 350px;
  z-index: 1000;
}

.info-panel h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.info-panel ul {
  padding-left: 20px;
  color: #555;
}

.info-panel li {
  margin-bottom: 5px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin: 15px 0;
  flex-wrap: wrap;
}

.button-group button {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.button-group button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.status {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.status p {
  margin: 5px 0;
  color: #555;
  font-size: 14px;
}

.status span {
  font-weight: bold;
  color: #667eea;
}
</style>
