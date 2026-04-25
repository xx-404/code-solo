# three-terrain-generator

一个基于 Three.js 的高性能 3D 地形生成器，支持静态地形和动态动画效果。

[![npm version](https://img.shields.io/npm/v/three-terrain-generator.svg)](https://www.npmjs.com/package/three-terrain-generator)
[![license](https://img.shields.io/npm/l/three-terrain-generator.svg)](https://github.com/yourusername/three-terrain-generator/blob/main/LICENSE)

## ✨ 特性

- 🌄 **自然地形生成** - 使用正弦余弦函数组合创建自然起伏的地形
- 🎨 **多种颜色方案** - 5种预设颜色方案 + 支持自定义颜色方案
- ⚡ **高性能** - 支持 GPU Shader 材质，完全避免 CPU-GPU 数据传输瓶颈
- 🔄 **动态动画** - 支持实时地形动画效果
- 🎯 **Vue 3 组件** - 提供开箱即用的 Vue 3 组件
- 📦 **模块化设计** - 核心 API 独立，可按需引入
- 🔧 **高度可定制** - 支持自定义高度函数、颜色方案等

## 📦 安装

```bash
npm install three-terrain-generator three
```

如果使用 Vue 组件：

```bash
npm install three-terrain-generator three vue
```

## 🚀 快速开始

### 基础用法

```javascript
import * as THREE from 'three';
import { createTerrainGeometry, createTerrainMaterial, createTerrainMesh } from 'three-terrain-generator';

// 场景设置
const scene = new THREE.Scene();
// ... 其他 Three.js 设置

// 方式1：分别创建几何体和材质
const geometry = createTerrainGeometry({
  width: 50,
  depth: 50,
  segmentsX: 50,
  segmentsZ: 50,
  colorScheme: 'greenBrown'
});

const material = createTerrainMaterial({
  colorScheme: 'greenBrown'
});

const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);

// 方式2：一次性创建
const terrain2 = createTerrainMesh(
  { width: 50, depth: 50, segmentsX: 50, segmentsZ: 50 },
  { colorScheme: 'desert' }
);
scene.add(terrain2);
```

### 使用 Vue 3 组件

```vue
<template>
  <TerrainViewer
    :width="50"
    :depth="50"
    :segments="50"
    :color-scheme="'greenBrown'"
    :show-controls="true"
    :enable-animation="true"
    :animation-speed="0.5"
    :use-shader-material="true"
  />
</template>

<script setup>
import { TerrainViewer } from 'three-terrain-generator';
</script>
```

### 高性能动态地形（Shader 材质）

```javascript
import { createTerrainGeometry, createDynamicTerrainMaterial, updateShaderMaterial } from 'three-terrain-generator';

const geometry = createTerrainGeometry({
  width: 50,
  depth: 50,
  segmentsX: 60,
  segmentsZ: 60
});

// 使用 Shader 材质（GPU 计算，性能最佳）
const material = createDynamicTerrainMaterial({
  colorScheme: 'volcano',
  amplitude: 6,
  frequency: 0.35
});

const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);

// 动画循环中只需更新时间
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  
  // 只需更新一个 uniform 值，GPU 自动计算所有顶点
  material.uniforms.time.value = clock.getElapsedTime();
  
  renderer.render(scene, camera);
}
```

## 🎨 颜色方案

内置 5 种预设颜色方案：

| 方案名称 | 描述 | 低海拔 | 高海拔 |
|---------|------|--------|--------|
| `greenBrown` | 绿色到棕色 | 森林绿 | 深棕色 |
| `desert` | 沙漠风格 | 沙黄色 | 土黄色 |
| `snowMountain` | 雪山 | 冰蓝色 | 纯白色 |
| `ocean` | 海洋 | 深蓝色 | 浅蓝色 |
| `volcano` | 火山 | 深灰色 | 橙红色 |

### 自定义颜色方案

```javascript
import { addColorScheme, colorSchemes } from 'three-terrain-generator';

// 添加自定义方案
addColorScheme('myScheme', {
  name: '我的自定义方案',
  lowColor: { r: 0.1, g: 0.2, b: 0.3 },
  highColor: { r: 0.9, g: 0.8, b: 0.7 },
  description: '我的自定义描述'
});

// 使用自定义方案
const geometry = createTerrainGeometry({
  colorScheme: 'myScheme'
});
```

## 🔧 API 文档

### 核心 API

#### `createTerrainGeometry(options)`

创建地形几何体。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|---------|------|
| `width` | `number` | `50` | 地形宽度 |
| `depth` | `number` | `50` | 地形深度 |
| `segmentsX` | `number` | `50` | X轴分段数 |
| `segmentsZ` | `number` | `50` | Z轴分段数 |
| `time` | `number` | `0` | 时间参数（用于动态效果） |
| `colorScheme` | `string` | `'greenBrown'` | 颜色方案 |
| `heightFunction` | `Function` | `defaultHeightFunction` | 自定义高度函数 |

**返回：** `THREE.BufferGeometry`

---

#### `createTerrainMaterial(options)`

创建地形材质。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|---------|------|
| `colorScheme` | `string` | `'greenBrown'` | 颜色方案 |
| `wireframe` | `boolean` | `false` | 是否线框模式 |
| `opacity` | `number` | `1` | 不透明度 |
| `transparent` | `boolean` | `false` | 是否透明 |
| `side` | `THREE.Side` | `THREE.DoubleSide` | 面的渲染方向 |

**返回：** `THREE.MeshLambertMaterial`

---

#### `createDynamicTerrainMaterial(options)`

创建高性能 Shader 材质（推荐用于动态效果）。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|---------|------|
| `colorScheme` | `string` | `'greenBrown'` | 颜色方案 |
| `time` | `number` | `0` | 初始时间 |
| `amplitude` | `number` | `5` | 振幅 |
| `frequency` | `number` | `0.3` | 频率 |

**返回：** `THREE.ShaderMaterial`

---

#### `updateTerrainGeometry(geometry, time, heightFunction, colorScheme, updateColors)`

更新地形几何体的顶点（用于 CPU 驱动的动态效果）。

**参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|---------|------|
| `geometry` | `THREE.BufferGeometry` | - | 地形几何体 |
| `time` | `number` | - | 时间参数 |
| `heightFunction` | `Function` | `defaultHeightFunction` | 高度函数 |
| `colorScheme` | `string` | `'greenBrown'` | 颜色方案 |
| `updateColors` | `boolean` | `true` | 是否更新颜色 |

---

#### `updateShaderMaterial(material, updates)`

更新 Shader 材质的 uniform 参数。

**参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `material` | `THREE.ShaderMaterial` | Shader 材质 |
| `updates` | `object` | 更新对象，可包含 `time`、`amplitude`、`frequency`、`colorScheme` |

---

#### `createMultiOctaveHeightFunction(octaves)`

创建多频率叠加的高度函数。

**参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `octaves` | `Array` | 倍频参数数组 |

**倍频参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `frequency` | `number` | 频率 |
| `amplitude` | `number` | 振幅 |
| `phase` | `number` | 相位 |

**返回：** `Function` - 高度函数

---

### 颜色方案 API

#### `colorSchemes`

所有内置颜色方案的对象。

```javascript
import { colorSchemes } from 'three-terrain-generator';

console.log(Object.keys(colorSchemes));
// ['greenBrown', 'desert', 'snowMountain', 'ocean', 'volcano']
```

#### `getColorForHeight(height, schemeKey, customScheme)`

根据高度值计算插值颜色。

**参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `height` | `number` | 高度值 |
| `schemeKey` | `string` | 颜色方案键名 |
| `customScheme` | `object` | 自定义颜色方案（可选） |

**返回：** `{ r: number, g: number, b: number }` - 颜色值（0-1 范围）

#### `addColorScheme(key, scheme)`

添加自定义颜色方案。

**参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `key` | `string` | 方案键名 |
| `scheme` | `object` | 颜色方案定义 |

**颜色方案定义：**

```javascript
{
  name: '方案名称',
  lowColor: { r: 0.1, g: 0.2, b: 0.3 },  // 低海拔颜色
  highColor: { r: 0.9, g: 0.8, b: 0.7 },   // 高海拔颜色
  description: '方案描述'
}
```

### Vue 组件 API

#### `TerrainViewer` 组件 Props

| Prop | 类型 | 默认值 | 描述 |
|------|------|---------|------|
| `width` | `number` | `50` | 地形宽度 |
| `depth` | `number` | `50` | 地形深度 |
| `segments` | `number` | `50` | 分段数（X 和 Z 轴） |
| `colorScheme` | `string` | `'greenBrown'` | 颜色方案 |
| `showControls` | `boolean` | `true` | 是否显示控制面板 |
| `enableAnimation` | `boolean` | `false` | 是否启用动画 |
| `animationSpeed` | `number` | `0.5` | 动画速度 |
| `backgroundColor` | `string` | `'#87CEEB'` | 背景颜色 |
| `useShaderMaterial` | `boolean` | `false` | 是否使用 Shader 材质（高性能） |

#### 事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `terrainCreated` | `{ width, depth, segments, useShader }` | 地形创建完成 |
| `colorSchemeChanged` | `schemeKey` | 颜色方案切换 |
| `animationStarted` | - | 动画启动 |
| `animationStopped` | - | 动画停止 |
| `error` | `error` | 发生错误 |

#### 暴露的方法

组件通过 `defineExpose` 暴露以下方法：

| 方法 | 描述 |
|------|------|
| `recreateTerrain()` | 重新创建地形 |
| `applyColorScheme()` | 应用选中的颜色方案 |
| `resetCamera()` | 重置相机位置 |
| `colorSchemes` | 所有颜色方案对象 |
| `terrain` | 当前地形 Mesh 对象 |
| `scene` | Three.js 场景对象 |
| `camera` | Three.js 相机对象 |

## 📁 项目结构

```
three-terrain-generator/
├── src/
│   ├── index.js              # 主入口文件
│   ├── core/
│   │   ├── index.js          # 核心模块导出
│   │   ├── colorSchemes.js   # 颜色方案模块
│   │   ├── geometry.js       # 几何体模块
│   │   └── materials.js      # 材质模块
│   └── vue/
│       └── TerrainViewer.vue # Vue 3 组件
├── dist/                     # 构建输出
├── types/                    # TypeScript 类型定义
├── examples/                 # 使用示例
│   ├── basic-usage.js        # 基础用法
│   ├── dynamic-animation.js  # 动态动画
│   └── vue-component.vue     # Vue 组件示例
├── package.json
├── rollup.config.js          # Rollup 构建配置
├── tsconfig.json             # TypeScript 配置
└── README.md
```

## 🔄 性能优化建议

### 静态地形 vs 动态地形

| 场景 | 推荐方案 | 性能特点 |
|------|---------|---------|
| 固定地形，无需动画 | `createTerrainGeometry` + `createTerrainMaterial` | 一次性生成，无运行时开销 |
| 简单动画，顶点数较少 | `updateTerrainGeometry` | CPU 计算，适合复杂逻辑 |
| 复杂动画，顶点数较多 | `createDynamicTerrainMaterial` | GPU 计算，性能最佳 ⭐ |

### 最佳实践

1. **使用 Shader 材质**：对于动态效果，优先使用 `createDynamicTerrainMaterial`，它将所有计算转移到 GPU，性能提升显著。

2. **合理设置分段数**：分段数越多，细节越丰富，但顶点数也越多。根据实际需求选择：
   - 远景：20-30 分段
   - 中景：40-60 分段
   - 近景/特写：80-100 分段

3. **资源清理**：在组件卸载或场景销毁时，记得释放资源：

```javascript
// 清理几何体和材质
geometry.dispose();
material.dispose();

// 清理渲染器
renderer.dispose();

// 清理控制器
controls.dispose();
```

## 🛠️ 构建

```bash
# 安装依赖
npm install

# 构建
npm run build

# 构建类型定义
npm run build:types
```

## 📝 更新日志

### v1.0.0 (2026-04-25)

- 🎉 初始版本发布
- ✨ 核心地形生成功能
- 🎨 5 种内置颜色方案
- ⚡ Shader 材质支持
- 🎯 Vue 3 组件
- 📦 模块化设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Three.js](https://threejs.org/) - 强大的 WebGL 3D 库
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架

## 📧 联系

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [https://github.com/yourusername/three-terrain-generator/issues](https://github.com/yourusername/three-terrain-generator/issues)
- Email: your.email@example.com

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
