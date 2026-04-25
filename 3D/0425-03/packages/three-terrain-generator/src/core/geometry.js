import * as THREE from 'three';
import { getColorForHeight, colorSchemes } from './colorSchemes.js';

/**
 * 地形几何体生成选项
 * @typedef {object} TerrainGeometryOptions
 * @property {number} [width=50] - 地形宽度
 * @property {number} [depth=50] - 地形深度
 * @property {number} [segmentsX=50] - X轴分段数
 * @property {number} [segmentsZ=50] - Z轴分段数
 * @property {number} [time=0] - 时间参数，用于动态效果
 * @property {string} [colorScheme='greenBrown'] - 颜色方案
 * @property {Function} [heightFunction] - 自定义高度计算函数
 */

/**
 * 默认高度计算函数 - 使用正弦余弦组合创建自然起伏
 * @param {number} x - X坐标
 * @param {number} z - Z坐标
 * @param {number} time - 时间参数
 * @returns {number} 高度值
 */
export function defaultHeightFunction(x, z, time = 0) {
  return (
    Math.sin(x * 0.3 + time * 0.1) * Math.cos(z * 0.3 + time * 0.05) * 5 +
    Math.sin(x * 0.1 + 1 + time * 0.02) * Math.cos(z * 0.15 + 0.5 + time * 0.01) * 3
  );
}

/**
 * 创建地形几何体
 * @param {TerrainGeometryOptions} options - 地形生成选项
 * @returns {THREE.BufferGeometry} 生成的地形几何体
 */
export function createTerrainGeometry(options = {}) {
  const {
    width = 50,
    depth = 50,
    segmentsX = 50,
    segmentsZ = 50,
    time = 0,
    colorScheme = 'greenBrown',
    heightFunction = defaultHeightFunction
  } = options;

  // 创建平面几何体
  const geometry = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ);
  
  // 将平面旋转到水平位置（X-Z平面）
  geometry.rotateX(-Math.PI / 2);

  // 获取顶点数据
  const positionArray = geometry.attributes.position.array;
  const colorArray = [];

  // 遍历每个顶点，计算高度和颜色
  for (let i = 0; i < positionArray.length; i += 3) {
    const x = positionArray[i];
    const z = positionArray[i + 2];
    
    // 计算高度
    const height = heightFunction(x, z, time);
    positionArray[i + 1] = height;
    
    // 计算颜色
    const color = getColorForHeight(height, colorScheme);
    colorArray.push(color.r, color.g, color.b);
  }

  // 添加颜色属性到几何体
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));
  
  // 计算法向量，确保光照正确
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * 更新地形几何体的顶点位置（用于动态效果）
 * 这是一个高效的更新方式，直接修改现有缓冲区数据
 * @param {THREE.BufferGeometry} geometry - 地形几何体
 * @param {number} time - 时间参数
 * @param {Function} [heightFunction] - 高度计算函数
 * @param {string} [colorScheme] - 颜色方案（如果需要更新颜色）
 * @param {boolean} [updateColors=true] - 是否同时更新颜色
 */
export function updateTerrainGeometry(
  geometry,
  time,
  heightFunction = defaultHeightFunction,
  colorScheme = 'greenBrown',
  updateColors = true
) {
  if (!geometry || !geometry.attributes.position) {
    console.warn('无效的几何体');
    return;
  }

  const positionArray = geometry.attributes.position.array;
  const colorArray = updateColors ? geometry.attributes.color?.array : null;

  // 遍历每个顶点更新高度
  for (let i = 0; i < positionArray.length; i += 3) {
    const x = positionArray[i];
    const z = positionArray[i + 2];
    
    // 计算新高度
    const height = heightFunction(x, z, time);
    positionArray[i + 1] = height;
    
    // 更新颜色（如果需要）
    if (colorArray) {
      const color = getColorForHeight(height, colorScheme);
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }
  }

  // 标记属性需要更新（关键！）
  geometry.attributes.position.needsUpdate = true;
  if (colorArray) {
    geometry.attributes.color.needsUpdate = true;
  }
  
  // 重新计算法向量（如果需要正确的光照）
  geometry.computeVertexNormals();
}

/**
 * 更新地形几何体的顶点颜色（根据高度重新计算）
 * @param {THREE.BufferGeometry} geometry - 地形几何体
 * @param {string} colorScheme - 颜色方案键名
 */
export function updateTerrainColors(geometry, colorScheme) {
  if (!geometry || !geometry.attributes.position || !geometry.attributes.color) {
    console.warn('无效的几何体或缺少颜色属性');
    return;
  }

  const positionArray = geometry.attributes.position.array;
  const colorArray = geometry.attributes.color.array;

  for (let i = 0; i < positionArray.length; i += 3) {
    const height = positionArray[i + 1];
    const color = getColorForHeight(height, colorScheme);
    
    colorArray[i] = color.r;
    colorArray[i + 1] = color.g;
    colorArray[i + 2] = color.b;
  }

  // 标记颜色属性需要更新
  geometry.attributes.color.needsUpdate = true;
}

/**
 * 创建多个频率叠加的高度函数
 * @param {Array<{frequency: number, amplitude: number, phase: number}>} octaves - 倍频参数
 * @returns {Function} 高度函数
 */
export function createMultiOctaveHeightFunction(octaves) {
  return function(x, z, time = 0) {
    let height = 0;
    for (const octave of octaves) {
      const { frequency = 1, amplitude = 1, phase = 0 } = octave;
      height += Math.sin(x * frequency + time * 0.1 + phase) * 
                 Math.cos(z * frequency + time * 0.05 + phase * 0.5) * 
                 amplitude;
    }
    return height;
  };
}

export { defaultHeightFunction };
