/**
 * three-terrain-generator
 * 
 * 一个基于 Three.js 的高性能 3D 地形生成器
 * 
 * 特性：
 * - 使用正弦余弦函数创建自然起伏的地形
 * - 多种预设颜色方案 + 自定义颜色方案
 * - 支持静态地形和动态动画效果
 * - 高性能 Shader 材质选项（GPU 计算）
 * - Vue 3 组件支持
 * 
 * @author Your Name
 * @license MIT
 */

// 核心模块导出
export * from './core/index.js';

// Vue 组件导出
export { default as TerrainViewer } from './vue/TerrainViewer.vue';

// 版本号
export const VERSION = '1.0.0';

// 默认导出
import * as core from './core/index.js';
import TerrainViewer from './vue/TerrainViewer.vue';

export default {
  ...core,
  TerrainViewer,
  VERSION
};
