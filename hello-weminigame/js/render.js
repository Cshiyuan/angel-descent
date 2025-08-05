/**
 * @file render.js
 * @description 微信小游戏渲染系统初始化模块
 * 
 * 负责初始化Canvas画布和获取屏幕尺寸信息，为整个游戏提供基础的渲染环境。
 * 主要功能包括：
 * - 创建并配置游戏主画布
 * - 获取设备屏幕信息和安全区域
 * - 计算适配不同设备的尺寸参数
 * - 提供全局的画布上下文和尺寸常量
 * 
 * 特别针对微信小游戏环境进行优化，支持各种设备的屏幕适配，
 * 包括曲面屏、刘海屏、水滴屏等特殊形态的屏幕。
 */

// 确保全局对象存在，用于跨模块共享Canvas实例
if (typeof GameGlobal === 'undefined') {
  global.GameGlobal = {};
}

/**
 * 游戏主画布实例
 * 使用微信小游戏API创建的Canvas对象，所有游戏内容都在此画布上渲染
 */
export const canvas = wx.createCanvas();
GameGlobal.canvas = canvas; // 保存到全局对象供其他模块使用

/**
 * 获取设备窗口信息
 * 优先使用新版API wx.getWindowInfo()，降级到 wx.getSystemInfoSync()
 * 包含屏幕尺寸、安全区域、像素比等关键信息
 */
const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

/**
 * 设备像素比
 * 用于高DPI屏幕的清晰度适配，防止画面模糊
 */
const pixelRatio = windowInfo.pixelRatio || 1;

/**
 * 异形屏幕检测函数
 * 检测设备是否为刘海屏、水滴屏或其他异形屏幕
 */
function detectNotchScreen(windowInfo) {
  const { screenWidth, screenHeight, safeArea } = windowInfo;
  
  // 如果没有安全区域信息，认为是异形屏幕
  if (!safeArea) {
    return true;
  }
  
  // 检查顶部是否有刘海或水滴
  const topNotch = safeArea.top > 0;
  
  // 检查底部是否有Home指示器
  const bottomNotch = (screenHeight - safeArea.bottom) > 0;
  
  // 检查左右是否有曲面屏边缘
  const sideNotch = safeArea.left > 0 || (screenWidth - safeArea.right) > 0;
  
  // 检查屏幕宽高比是否异常（可能是异形屏幕）
  const aspectRatio = screenHeight / screenWidth;
  const isLongScreen = aspectRatio > 2.0; // 超长屏幕通常是异形屏幕
  
  return topNotch || bottomNotch || sideNotch || isLongScreen;
}

/**
 * 保守的安全区域计算
 * 对于异形屏幕使用更保守的安全区域设置
 */
function calculateConservativeSafeArea(windowInfo) {
  const { screenWidth, screenHeight, safeArea } = windowInfo;
  
  // 基础安全边距
  const baseMargin = 20;
  
  // 如果设备提供了安全区域信息，使用它
  if (safeArea) {
    // 对于异形屏幕，增加额外的保守边距
    const isNotch = detectNotchScreen(windowInfo);
    const extraMargin = isNotch ? 40 : 0;
    
    return {
      top: Math.max(safeArea.top, baseMargin) + extraMargin,
      left: Math.max(safeArea.left, baseMargin),
      right: screenWidth - Math.max(screenWidth - safeArea.right, baseMargin),
      bottom: screenHeight - Math.max(screenHeight - safeArea.bottom, baseMargin),
      width: safeArea.width - extraMargin * 2,
      height: safeArea.height - extraMargin * 2
    };
  }
  
  // 如果没有安全区域信息，使用保守的默认值
  const conservativeMargin = 60; // 对于未知设备使用更大的边距
  return {
    top: conservativeMargin,
    left: conservativeMargin,
    right: screenWidth - conservativeMargin,
    bottom: screenHeight - conservativeMargin,
    width: screenWidth - conservativeMargin * 2,
    height: screenHeight - conservativeMargin * 2
  };
}

/**
 * 设备安全区域信息
 * 安全区域是指可以安全显示内容的屏幕区域，避开了：
 * - 曲面屏边缘
 * - 刘海屏的刘海区域  
 * - 水滴屏的水滴区域
 * - 圆角屏幕的圆角区域
 * - 系统状态栏和导航栏
 * 
 * 使用保守的安全区域计算，确保在所有设备上都能正确显示
 */
const safeArea = calculateConservativeSafeArea(windowInfo);

/**
 * 异形屏幕检测结果
 * 用于其他模块判断当前设备是否为异形屏幕
 */
export const IS_NOTCH_SCREEN = detectNotchScreen(windowInfo);

/**
 * 调试信息
 * 用于开发时调试屏幕适配问题
 */
export const DEBUG_INFO = {
  originalWindowInfo: windowInfo,
  isNotchScreen: IS_NOTCH_SCREEN,
  originalSafeArea: windowInfo.safeArea,
  calculatedSafeArea: safeArea
};


/**
 * 设置Canvas画布尺寸
 * 使用完整的屏幕尺寸确保画布能够覆盖整个屏幕区域，
 * 包括安全区域外的区域，这样可以实现沉浸式的游戏体验
 */
canvas.width = windowInfo.screenWidth;
canvas.height = windowInfo.screenHeight;

/**
 * 屏幕宽度常量（像素）
 * 设备屏幕的物理像素宽度，用于游戏对象的位置计算和边界检测
 */
export const SCREEN_WIDTH = windowInfo.screenWidth;

/**
 * 屏幕高度常量（像素）
 * 设备屏幕的物理像素高度，用于游戏对象的位置计算和边界检测
 */
export const SCREEN_HEIGHT = windowInfo.screenHeight;

/**
 * 安全区域信息对象
 * 包含安全区域的完整位置和尺寸信息，供UI布局时参考使用
 */
export const SAFE_AREA = safeArea;

/**
 * 安全区域边距信息
 * 计算出屏幕边缘到安全区域边缘的距离，用于UI元素的边距设置
 * 使用保守的计算方式，确保在异形屏幕上也能正确显示
 * 
 * @property {number} top - 顶部边距：屏幕顶部到安全区域顶部的距离
 * @property {number} left - 左侧边距：屏幕左侧到安全区域左侧的距离  
 * @property {number} right - 右侧边距：安全区域右侧到屏幕右侧的距离
 * @property {number} bottom - 底部边距：安全区域底部到屏幕底部的距离
 * 
 * 使用示例：
 * - 按钮距离屏幕右边缘的安全距离：SAFE_AREA_INSETS.right + 20
 * - 标题距离屏幕顶部的安全距离：SAFE_AREA_INSETS.top + 10
 */
export const SAFE_AREA_INSETS = {
  top: safeArea.top,
  left: safeArea.left,
  right: windowInfo.screenWidth - safeArea.right,
  bottom: windowInfo.screenHeight - safeArea.bottom
};

/**
 * Canvas 2D渲染上下文
 * 提供所有2D绘图API，包括路径绘制、图像绘制、文本渲染等功能
 * 游戏中的所有渲染操作都通过此上下文进行
 */
export const ctx = canvas.getContext('2d');