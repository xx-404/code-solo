/**
 * 颜色方案定义
 * 每种方案定义低海拔和高海拔的颜色，用于地形的颜色渐变
 */

export const colorSchemes = {
  /**
   * 绿色到棕色 - 自然山地景观
   */
  greenBrown: {
    name: '绿色到棕色',
    lowColor: { r: 0.133, g: 0.545, b: 0.133 },
    highColor: { r: 0.545, g: 0.270, b: 0.074 },
    description: '自然山地景观'
  },

  /**
   * 沙漠风格 - 沙丘景观
   */
  desert: {
    name: '沙漠风格',
    lowColor: { r: 0.961, g: 0.871, b: 0.702 },
    highColor: { r: 0.761, g: 0.600, b: 0.420 },
    description: '沙丘景观'
  },

  /**
   * 雪山 - 雪山冰川
   */
  snowMountain: {
    name: '雪山',
    lowColor: { r: 0.500, g: 0.700, b: 0.900 },
    highColor: { r: 1.000, g: 1.000, b: 1.000 },
    description: '雪山冰川'
  },

  /**
   * 海洋 - 海洋深度
   */
  ocean: {
    name: '海洋',
    lowColor: { r: 0.000, g: 0.000, b: 0.500 },
    highColor: { r: 0.000, g: 0.700, b: 0.900 },
    description: '海洋深度'
  },

  /**
   * 火山 - 火山熔岩
   */
  volcano: {
    name: '火山',
    lowColor: { r: 0.300, g: 0.300, b: 0.300 },
    highColor: { r: 1.000, g: 0.300, b: 0.000 },
    description: '火山熔岩'
  }
};

/**
 * 根据高度值和颜色方案计算插值颜色
 * @param {number} height - 顶点高度值
 * @param {string} schemeKey - 颜色方案的键名
 * @param {object} [customScheme] - 自定义颜色方案（可选）
 * @returns {object} { r, g, b } 颜色值（0-1范围）
 */
export function getColorForHeight(height, schemeKey, customScheme = null) {
  const scheme = customScheme || colorSchemes[schemeKey] || colorSchemes.greenBrown;
  
  // 归一化高度到0-1范围（假设高度范围在-8到8之间）
  const normalizedHeight = Math.max(0, Math.min(1, (height + 8) / 16));
  
  // 线性插值计算颜色
  return {
    r: scheme.lowColor.r + normalizedHeight * (scheme.highColor.r - scheme.lowColor.r),
    g: scheme.lowColor.g + normalizedHeight * (scheme.highColor.g - scheme.lowColor.g),
    b: scheme.lowColor.b + normalizedHeight * (scheme.highColor.b - scheme.lowColor.b)
  };
}

/**
 * 添加自定义颜色方案
 * @param {string} key - 方案键名
 * @param {object} scheme - 颜色方案定义
 */
export function addColorScheme(key, scheme) {
  if (scheme && scheme.lowColor && scheme.highColor) {
    colorSchemes[key] = {
      name: scheme.name || '自定义方案',
      lowColor: scheme.lowColor,
      highColor: scheme.highColor,
      description: scheme.description || ''
    };
  }
}

export default colorSchemes;
