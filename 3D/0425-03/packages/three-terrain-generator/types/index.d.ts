import * as THREE from 'three';

// 颜色方案类型
export interface ColorScheme {
  name: string;
  lowColor: { r: number; g: number; b: number };
  highColor: { r: number; g: number; b: number };
  description: string;
}

// 颜色方案集合
export interface ColorSchemes {
  greenBrown: ColorScheme;
  desert: ColorScheme;
  snowMountain: ColorScheme;
  ocean: ColorScheme;
  volcano: ColorScheme;
  [key: string]: ColorScheme;
}

// 地形几何体选项
export interface TerrainGeometryOptions {
  width?: number;
  depth?: number;
  segmentsX?: number;
  segmentsZ?: number;
  time?: number;
  colorScheme?: string;
  heightFunction?: (x: number, z: number, time?: number) => number;
}

// 地形材质选项
export interface TerrainMaterialOptions {
  colorScheme?: string;
  wireframe?: boolean;
  opacity?: number;
  transparent?: boolean;
  side?: THREE.Side;
}

// 倍频参数
export interface Octave {
  frequency?: number;
  amplitude?: number;
  phase?: number;
}

// 材质类型
export const MaterialType: {
  LAMBERT: 'lambert';
  STANDARD: 'standard';
  PHONG: 'phong';
  SHADER: 'shader';
};

// 版本号
export const VERSION: string;

// 颜色方案模块
export const colorSchemes: ColorSchemes;

export function getColorForHeight(
  height: number,
  schemeKey: string,
  customScheme?: ColorScheme
): { r: number; g: number; b: number };

export function addColorScheme(key: string, scheme: ColorScheme): void;

// 几何体模块
export function defaultHeightFunction(x: number, z: number, time?: number): number;

export function createTerrainGeometry(options?: TerrainGeometryOptions): THREE.BufferGeometry;

export function updateTerrainGeometry(
  geometry: THREE.BufferGeometry,
  time: number,
  heightFunction?: (x: number, z: number, time?: number) => number,
  colorScheme?: string,
  updateColors?: boolean
): void;

export function updateTerrainColors(geometry: THREE.BufferGeometry, colorScheme: string): void;

export function createMultiOctaveHeightFunction(octaves: Octave[]): (x: number, z: number, time?: number) => number;

// 材质模块
export function createTerrainMaterial(options?: TerrainMaterialOptions): THREE.MeshLambertMaterial;

export function createDynamicTerrainMaterial(options?: {
  colorScheme?: string;
  time?: number;
  amplitude?: number;
  frequency?: number;
}): THREE.ShaderMaterial;

export function updateShaderMaterial(
  material: THREE.ShaderMaterial,
  updates?: {
    time?: number;
    amplitude?: number;
    frequency?: number;
    colorScheme?: string;
  }
): void;

export function createTerrainMesh(
  geometryOptions?: TerrainGeometryOptions,
  materialOptions?: TerrainMaterialOptions,
  useShader?: boolean
): THREE.Mesh;

// Vue 组件
export { default as TerrainViewer } from '../src/vue/TerrainViewer.vue';

// Vue 组件 Props 类型
export interface TerrainViewerProps {
  width?: number;
  depth?: number;
  segments?: number;
  colorScheme?: string;
  showControls?: boolean;
  enableAnimation?: boolean;
  animationSpeed?: number;
  backgroundColor?: string;
  useShaderMaterial?: boolean;
}

// 导出所有
declare const ThreeTerrainGenerator: {
  // 颜色方案
  colorSchemes: ColorSchemes;
  getColorForHeight: typeof getColorForHeight;
  addColorScheme: typeof addColorScheme;
  
  // 几何体
  defaultHeightFunction: typeof defaultHeightFunction;
  createTerrainGeometry: typeof createTerrainGeometry;
  updateTerrainGeometry: typeof updateTerrainGeometry;
  updateTerrainColors: typeof updateTerrainColors;
  createMultiOctaveHeightFunction: typeof createMultiOctaveHeightFunction;
  
  // 材质
  createTerrainMaterial: typeof createTerrainMaterial;
  createDynamicTerrainMaterial: typeof createDynamicTerrainMaterial;
  updateShaderMaterial: typeof updateShaderMaterial;
  createTerrainMesh: typeof createTerrainMesh;
  MaterialType: typeof MaterialType;
  
  // Vue 组件
  TerrainViewer: any;
  
  // 版本
  VERSION: string;
};

export default ThreeTerrainGenerator;
