<template>
  <div class="app-container">
    <TerrainViewer
      :width="50"
      :depth="50"
      :segments="50"
      colorScheme="greenBrown"
      :showControls="true"
      :enableAnimation="false"
      :animationSpeed="0.5"
      backgroundColor="#87CEEB"
      @terrainCreated="onTerrainCreated"
      @colorSchemeChanged="onColorSchemeChanged"
      @error="onError"
      ref="terrainViewerRef"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TerrainViewer from './components/TerrainViewer.vue'

// 获取组件引用
const terrainViewerRef = ref(null)

// 地形创建回调
const onTerrainCreated = (data) => {
  console.log('地形创建成功:', data)
}

// 颜色方案改变回调
const onColorSchemeChanged = (scheme) => {
  console.log('颜色方案改变:', scheme)
}

// 错误处理回调
const onError = (error) => {
  console.error('发生错误:', error)
}

// 示例：通过组件引用调用方法
// terrainViewerRef.value?.recreateTerrain()
// terrainViewerRef.value?.applyColorScheme()
// terrainViewerRef.value?.resetCamera()
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
}
</style>
