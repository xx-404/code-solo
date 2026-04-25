import * as THREE from 'three';
import { colorSchemes, getColorForHeight } from './colorSchemes.js';

/**
 * 地形材质选项
 * @typedef {object} TerrainMaterialOptions
 * @property {string} [colorScheme='greenBrown'] - 颜色方案
 * @property {boolean} [wireframe=false] - 是否线框模式
 * @property {number} [opacity=1] - 不透明度
 * @property {boolean} [transparent=false] - 是否透明
 * @property {THREE.Side} [side=THREE.DoubleSide] - 面的渲染方向
 */

/**
 * 创建地形材质
 * 使用顶点颜色实现高度渐变效果
 * @param {TerrainMaterialOptions} options - 材质选项
 * @returns {THREE.MeshLambertMaterial} 地形材质
 */
export function createTerrainMaterial(options = {}) {
  const {
    colorScheme = 'greenBrown',
    wireframe = false,
    opacity = 1,
    transparent = false,
    side = THREE.DoubleSide
  } = options;

  return new THREE.MeshLambertMaterial({
    vertexColors: true,
    side,
    wireframe,
    opacity,
    transparent
  });
}

/**
 * 创建基于ShaderMaterial的高性能动态材质
 * 将高度计算和颜色插值放在GPU中执行，完全避免CPU-GPU数据传输
 * @param {object} options - 材质选项
 * @returns {THREE.ShaderMaterial} Shader材质
 */
export function createDynamicTerrainMaterial(options = {}) {
  const {
    colorScheme = 'greenBrown',
    time = 0,
    amplitude = 5,
    frequency = 0.3
  } = options;

  const scheme = colorSchemes[colorScheme] || colorSchemes.greenBrown;

  // 顶点着色器：在GPU上计算顶点高度
  const vertexShader = `
    uniform float time;
    uniform float amplitude;
    uniform float frequency;
    uniform vec3 lowColor;
    uniform vec3 highColor;
    
    varying float vElevation;
    varying vec3 vColor;
    
    void main() {
      vec3 pos = position;
      
      // 在GPU上计算高度（多频率叠加，创造自然起伏）
      float elevation = 
        sin(pos.x * frequency + time * 0.1) * cos(pos.z * frequency + time * 0.05) * amplitude +
        sin(pos.x * frequency * 0.33 + 1.0 + time * 0.02) * cos(pos.z * frequency * 0.5 + 0.5 + time * 0.01) * (amplitude * 0.6);
      
      pos.y += elevation;
      vElevation = elevation;
      
      // 在GPU上插值颜色
      float normalizedHeight = clamp((elevation + 8.0) / 16.0, 0.0, 1.0);
      vColor = mix(lowColor, highColor, normalizedHeight);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // 片元着色器
  const fragmentShader = `
    varying vec3 vColor;
    varying float vElevation;
    
    void main() {
      // 可以在这里添加更多视觉效果，如阴影、高光等
      gl_FragColor = vec4(vColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: time },
      amplitude: { value: amplitude },
      frequency: { value: frequency },
      lowColor: { value: new THREE.Color(scheme.lowColor.r, scheme.lowColor.g, scheme.lowColor.b) },
      highColor: { value: new THREE.Color(scheme.highColor.r, scheme.highColor.g, scheme.highColor.b) }
    },
    side: THREE.DoubleSide
  });
}

/**
 * 更新Shader材质的uniform参数
 * @param {THREE.ShaderMaterial} material - Shader材质
 * @param {object} updates - 要更新的参数
 */
export function updateShaderMaterial(material, updates = {}) {
  if (!material || !material.uniforms) {
    console.warn('无效的Shader材质');
    return;
  }

  const { time, amplitude, frequency, colorScheme } = updates;

  if (time !== undefined && material.uniforms.time) {
    material.uniforms.time.value = time;
  }

  if (amplitude !== undefined && material.uniforms.amplitude) {
    material.uniforms.amplitude.value = amplitude;
  }

  if (frequency !== undefined && material.uniforms.frequency) {
    material.uniforms.frequency.value = frequency;
  }

  if (colorScheme && material.uniforms.lowColor && material.uniforms.highColor) {
    const scheme = colorSchemes[colorScheme] || colorSchemes.greenBrown;
    material.uniforms.lowColor.value = new THREE.Color(scheme.lowColor.r, scheme.lowColor.g, scheme.lowColor.b);
    material.uniforms.highColor.value = new THREE.Color(scheme.highColor.r, scheme.highColor.g, scheme.highColor.b);
  }
}

/**
 * 创建地形网格（几何体 + 材质）
 * @param {object} geometryOptions - 几何体选项
 * @param {object} materialOptions - 材质选项
 * @param {boolean} [useShader=false] - 是否使用Shader材质（高性能动态效果）
 * @returns {THREE.Mesh} 地形网格
 */
export function createTerrainMesh(geometryOptions = {}, materialOptions = {}, useShader = false) {
  const geometry = createTerrainGeometry(geometryOptions);
  const material = useShader 
    ? createDynamicTerrainMaterial(materialOptions)
    : createTerrainMaterial(materialOptions);
  
  return new THREE.Mesh(geometry, material);
}

/**
 * 材质类型枚举
 */
export const MaterialType = {
  LAMBERT: 'lambert',
  STANDARD: 'standard',
  PHONG: 'phong',
  SHADER: 'shader'
};

export default {
  createTerrainMaterial,
  createDynamicTerrainMaterial,
  updateShaderMaterial,
  createTerrainMesh,
  MaterialType
};
