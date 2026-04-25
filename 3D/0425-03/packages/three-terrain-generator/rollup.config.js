import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import vue from 'rollup-plugin-vue';

const external = ['three', 'three/examples/jsm/controls/OrbitControls.js', 'vue'];

const globals = {
  'three': 'THREE',
  'three/examples/jsm/controls/OrbitControls.js': 'THREE.OrbitControls',
  'vue': 'Vue'
};

export default [
  // 核心模块 ESM
  {
    input: 'src/core/index.js',
    output: {
      file: 'dist/core/index.esm.js',
      format: 'esm',
      sourcemap: true,
      globals
    },
    external,
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  // 核心模块 CJS
  {
    input: 'src/core/index.js',
    output: {
      file: 'dist/core/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      globals,
      exports: 'named'
    },
    external,
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  // Vue 组件 ESM
  {
    input: 'src/vue/TerrainViewer.vue',
    output: {
      file: 'dist/vue/index.esm.js',
      format: 'esm',
      sourcemap: true,
      globals
    },
    external,
    plugins: [
      vue(),
      resolve(),
      commonjs()
    ]
  },
  // Vue 组件 CJS
  {
    input: 'src/vue/TerrainViewer.vue',
    output: {
      file: 'dist/vue/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      globals,
      exports: 'default'
    },
    external,
    plugins: [
      vue(),
      resolve(),
      commonjs()
    ]
  },
  // 主入口 ESM
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
      globals
    },
    external,
    plugins: [
      vue(),
      resolve(),
      commonjs()
    ]
  },
  // 主入口 CJS
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      globals,
      exports: 'named'
    },
    external,
    plugins: [
      vue(),
      resolve(),
      commonjs()
    ]
  }
];
