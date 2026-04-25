<template>
  <div class="demo-container">
    <h1 class="title">BouncingSpheres 组件演示</h1>
    
    <!-- 控制面板 -->
    <div class="controls">
      <div class="control-group">
        <label>球体数量: {{ sphereCount }}</label>
        <input 
          v-model.number="sphereCount" 
          type="range" 
          min="1" 
          max="50" 
          step="1"
        />
      </div>
      
      <div class="control-group">
        <button @click="handlePlay" :disabled="isPlaying">播放</button>
        <button @click="handlePause" :disabled="!isPlaying">暂停</button>
        <button @click="handleReset">重置</button>
        <button @click="toggleSpecialConfig">
          {{ useSpecialConfig ? '取消特殊配置' : '启用特殊配置' }}
        </button>
      </div>
    </div>
    
    <!-- 组件使用示例 -->
    <div class="scene-wrapper">
      <BouncingSpheres
        ref="bouncingSpheresRef"
        :sphere-count="sphereCount"
        :background-color="backgroundColor"
        :base-sphere-config="baseConfig"
        :individual-configs="individualConfigs"
        :auto-play="autoPlay"
        @initialized="onInitialized"
        @animation-start="onAnimationStart"
        @animation-stop="onAnimationStop"
        @error="onError"
      />
    </div>
    
    <!-- 日志显示 -->
    <div class="log-panel">
      <h3>事件日志:</h3>
      <div class="log-content">
        <p v-for="(log, index) in logs" :key="index" class="log-item">
          [{{ log.time }}] {{ log.message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import * as THREE from 'three';
import BouncingSpheres from './BouncingSpheres.vue';

// ==================== 响应式数据 ====================
const bouncingSpheresRef = ref(null);
const sphereCount = ref(20);
const backgroundColor = ref('#1a1a2e');
const autoPlay = ref(true);
const isPlaying = ref(true);
const useSpecialConfig = ref(false);

const logs = reactive([]);

// ==================== 计算属性 ====================

// 基础球体配置
const baseConfig = computed(() => ({
  bounceHeight: { min: 1, max: 3 },
  bounceSpeed: { min: 2, max: 5 },
  sizeAmplitude: { min: 0.3, max: 0.6 }
}));

// 独立球体配置（根据 useSpecialConfig 动态切换）
const individualConfigs = computed(() => {
  if (!useSpecialConfig.value) return [];
  
  return [
    // 第1个球体：红色大球在中心
    {
      color: new THREE.Color(0xff4444),
      radius: 1.0,
      positionX: 0,
      positionZ: 0,
      bounceHeight: 2.5,
      bounceSpeed: 2,
      sizeAmplitude: 0.5
    },
    // 第2个球体：蓝色球在左边
    {
      color: new THREE.Color(0x4444ff),
      radius: 0.7,
      positionX: -6,
      positionZ: 0,
      bounceHeight: 2,
      bounceSpeed: 3,
      sizeAmplitude: 0.4
    },
    // 第3个球体：绿色球在右边
    {
      color: new THREE.Color(0x44ff44),
      radius: 0.7,
      positionX: 6,
      positionZ: 0,
      bounceHeight: 2,
      bounceSpeed: 2.5,
      sizeAmplitude: 0.4
    },
    // 第4个球体：黄色球在前面
    {
      color: new THREE.Color(0xffff44),
      radius: 0.6,
      positionX: 0,
      positionZ: 5,
      bounceHeight: 1.5,
      bounceSpeed: 4,
      sizeAmplitude: 0.3
    },
    // 第5个球体：紫色球在后面
    {
      color: new THREE.Color(0xff44ff),
      radius: 0.6,
      positionX: 0,
      positionZ: -5,
      bounceHeight: 1.5,
      bounceSpeed: 3.5,
      sizeAmplitude: 0.3
    }
  ];
});

// ==================== 工具函数 ====================

function addLog(message) {
  const now = new Date();
  const time = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');
  
  logs.unshift({ time, message });
  
  // 保持最多50条日志
  if (logs.length > 50) {
    logs.pop();
  }
}

// ==================== 事件处理 ====================

function onInitialized(data) {
  addLog('组件初始化完成');
  console.log('初始化数据:', data);
}

function onAnimationStart() {
  isPlaying.value = true;
  addLog('动画开始');
}

function onAnimationStop() {
  isPlaying.value = false;
  addLog('动画停止');
}

function onError(error) {
  addLog(`错误: ${error.message}`);
  console.error('组件错误:', error);
}

function handlePlay() {
  if (bouncingSpheresRef.value) {
    bouncingSpheresRef.value.play();
  }
}

function handlePause() {
  if (bouncingSpheresRef.value) {
    bouncingSpheresRef.value.pause();
  }
}

function handleReset() {
  if (bouncingSpheresRef.value) {
    bouncingSpheresRef.value.reset();
    addLog('场景已重置');
  }
}

function toggleSpecialConfig() {
  useSpecialConfig.value = !useSpecialConfig.value;
  addLog(useSpecialConfig.value ? '已启用特殊配置' : '已取消特殊配置');
  
  // 重置场景以应用新配置
  setTimeout(() => {
    handleReset();
  }, 0);
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0a0a1a;
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.title {
  text-align: center;
  padding: 20px;
  margin: 0;
  font-size: 24px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 15px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  font-size: 14px;
  color: #aaa;
}

.control-group input[type="range"] {
  width: 150px;
}

.control-group button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-group button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.control-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scene-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
}

.log-panel {
  height: 150px;
  background-color: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.log-panel h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #888;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}

.log-item {
  margin: 4px 0;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  color: #aaa;
}

.log-item:first-child {
  color: #667eea;
  font-weight: bold;
}

/* 滚动条样式 */
.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.log-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}
</style>
