/**
 * three-terrain-generator - Three.js 地形生成器核心模块
 * 
 * 这个模块提供了完整的地形生成功能，包括：
 * - 几何体生成（使用正弦余弦函数创建自然起伏）
 * - 颜色方案系统（多种预设 + 自定义）
 * - 材质系统（普通材质 + 高性能Shader材质）
 * - 动态更新功能
 */

// 颜色方案模块
export { 
  colorSchemes, 
  getColorForHeight, 
  addColorScheme 
} from './colorSchemes.js';

// 几何体模块
export {
  defaultHeightFunction,
  createTerrainGeometry,
  updateTerrainGeometry,
  updateTerrainColors,
  createMultiOctaveHeightFunction
} from './geometry.js';

// 材质模块
export {
  createTerrainMaterial,
  createDynamicTerrainMaterial,
  updateShaderMaterial,
  createTerrainMesh,
  MaterialType
} from './materials.js';

// 默认导出 - 所有功能的集合
import * as colorSchemesModule from './colorSchemes.js';
import * as geometryModule from './geometry.js';
import * as materialsModule from './materials.js';

export default {
  ...colorSchemesModule,
  ...geometryModule,
  ...materialsModule
};
