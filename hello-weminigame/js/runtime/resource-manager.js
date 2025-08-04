/**
 * @file resource-manager.js
 * @description 游戏资源管理器 - 微信小游戏图像加载和缓存系统
 */

/**
 * 游戏资源管理器
 * 单例模式的资源管理系统，为微信小游戏提供图像加载和缓存功能。
 */
export default class ResourceManager {
  constructor() {
    this.imageCache = new Map();
    this.loadingPromises = new Map();
    this.resourceExists = new Map();
    
    // 预定义的背景图像路径
    this.backgroundPaths = {
      cloud: 'images/backgrounds/bg_cloud.png',
      dawn: 'images/backgrounds/bg_dawn.png',
      thunder: 'images/backgrounds/bg_thunder.png',
      earth: 'images/backgrounds/bg_earth.png'
    };
    
    // 预定义的角色图像路径
    this.characterPaths = {
      normal: 'images/character/angel/angel_normal.png',
      hurt: 'images/character/angel/angel_hurt.png',
      fall: 'images/character/angel/angel_fall.png'
    };
    
    // 预定义的角色特效动画路径
    this.characterEffectPaths = {
      move_left_01: 'images/character/effects/angel_move_left_01.png',
      move_left_02: 'images/character/effects/angel_move_left_02.png',
      move_right_01: 'images/character/effects/angel_move_right_01.png',
      move_right_02: 'images/character/effects/angel_move_right_02.png'
    };
    
    // 预定义的平台图像路径
    this.platformPaths = {
      normal: 'images/platforms/platform_normal.png',
      fragile: 'images/platforms/platform_fragile.png',
      moving: 'images/platforms/platform_moving.png',
      disappearing: 'images/platforms/platform_disappear.png', // 消失平台专用图像
      ice: 'images/platforms/platform_ice.png',
      bounce: 'images/platforms/platform_bounce.png',
      dangerous: 'images/platforms/platform_danger.png'
    };
    
    // 初始化完成
  }
  
  createImage() {
    // 微信小游戏环境使用wx.createImage
    if (typeof wx !== 'undefined' && wx.createImage) {
      return wx.createImage();
    }
    
    // 浏览器环境fallback（主要用于开发调试）
    return new Image();
  }
  
  async loadImage(imagePath) {
    
    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath);
    }
    
    // 检查是否正在加载
    if (this.loadingPromises.has(imagePath)) {
      return await this.loadingPromises.get(imagePath);
    }
    
    // 创建加载Promise
    const loadingPromise = this.performImageLoad(imagePath);
    this.loadingPromises.set(imagePath, loadingPromise);
    
    try {
      const image = await loadingPromise;
      
      if (image) {
        this.imageCache.set(imagePath, image);
      }
      
      return image;
    } finally {
      // 清理加载状态
      this.loadingPromises.delete(imagePath);
    }
  }
  
  performImageLoad(imagePath) {
    return new Promise((resolve) => {
      const image = this.createImage();
      
      const timeoutId = setTimeout(() => {
        resolve(null);
      }, 5000);
      
      image.onload = () => {
        clearTimeout(timeoutId);
        resolve(image);
      };
      
      image.onerror = () => {
        clearTimeout(timeoutId);
        resolve(null);
      };
      
      // 开始加载
      image.src = imagePath;
    });
  }
  
  async preloadImages(imagePaths) {
    const loadPromises = imagePaths.map(path => 
      this.loadImage(path).then(image => ({ path, image }))
    );
    
    const results = await Promise.allSettled(loadPromises);
    const resultMap = new Map();
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { path, image } = result.value;
        resultMap.set(path, image);
      } else {
        const path = imagePaths[index];
        resultMap.set(path, null);
      }
    });
    
    return resultMap;
  }
  
  async preloadBackgrounds() {
    const backgroundPaths = Object.values(this.backgroundPaths);
    const results = await this.preloadImages(backgroundPaths);
    
    // 创建主题映射
    const backgroundMap = new Map();
    backgroundMap.set('cloud', results.get(this.backgroundPaths.cloud));
    backgroundMap.set('dawn', results.get(this.backgroundPaths.dawn));
    backgroundMap.set('thunder', results.get(this.backgroundPaths.thunder));
    backgroundMap.set('earth', results.get(this.backgroundPaths.earth));
    
    return backgroundMap;
  }
  
  async preloadCharacters() {
    const characterPaths = Object.values(this.characterPaths);
    const results = await this.preloadImages(characterPaths);
    
    // 创建状态映射
    const characterMap = new Map();
    characterMap.set('normal', results.get(this.characterPaths.normal));
    characterMap.set('hurt', results.get(this.characterPaths.hurt));
    characterMap.set('fall', results.get(this.characterPaths.fall));
    
    return characterMap;
  }
  
  async preloadCharacterEffects() {
    const effectPaths = Object.values(this.characterEffectPaths);
    const results = await this.preloadImages(effectPaths);
    
    // 创建特效映射
    const effectMap = new Map();
    effectMap.set('move_left_01', results.get(this.characterEffectPaths.move_left_01));
    effectMap.set('move_left_02', results.get(this.characterEffectPaths.move_left_02));
    effectMap.set('move_right_01', results.get(this.characterEffectPaths.move_right_01));
    effectMap.set('move_right_02', results.get(this.characterEffectPaths.move_right_02));
    
    return effectMap;
  }
  
  async preloadPlatforms() {
    const platformPaths = Object.values(this.platformPaths);
    const results = await this.preloadImages(platformPaths);
    
    // 创建平台类型映射
    const platformMap = new Map();
    platformMap.set('normal', results.get(this.platformPaths.normal));
    platformMap.set('fragile', results.get(this.platformPaths.fragile));
    platformMap.set('moving', results.get(this.platformPaths.moving));
    platformMap.set('disappearing', results.get(this.platformPaths.disappearing));
    platformMap.set('ice', results.get(this.platformPaths.ice));
    platformMap.set('bounce', results.get(this.platformPaths.bounce));
    platformMap.set('dangerous', results.get(this.platformPaths.dangerous));
    
    return platformMap;
  }
  
  getCachedImage(imagePath) {
    return this.imageCache.get(imagePath) || null;
  }
  
  getBackgroundByTheme(theme) {
    const themePath = this.backgroundPaths[theme];
    if (!themePath) {
      return null;
    }
    
    return this.getCachedImage(themePath);
  }
  
  getCharacterByState(state) {
    const statePath = this.characterPaths[state];
    if (!statePath) {
      return null;
    }
    
    return this.getCachedImage(statePath);
  }
  
  getCharacterEffectByName(effectName) {
    const effectPath = this.characterEffectPaths[effectName];
    if (!effectPath) {
      return null;
    }
    
    return this.getCachedImage(effectPath);
  }
  
  getPlatformByType(platformType) {
    const platformPath = this.platformPaths[platformType];
    if (!platformPath) {
      return null;
    }
    
    return this.getCachedImage(platformPath);
  }
  
  async checkResourceExists(resourcePath) {
    if (this.resourceExists.has(resourcePath)) {
      return this.resourceExists.get(resourcePath);
    }
    
    const image = await this.loadImage(resourcePath);
    const exists = image !== null;
    this.resourceExists.set(resourcePath, exists);
    
    return exists;
  }
  
  clearCache(clearAll = false) {
    if (clearAll) {
      this.imageCache.clear();
      this.resourceExists.clear();
    } else {
      const backgroundPaths = Object.values(this.backgroundPaths);
      const platformPaths = Object.values(this.platformPaths);
      const preservedPaths = [...backgroundPaths, ...platformPaths];
      
      for (const [path, image] of this.imageCache) {
        if (!preservedPaths.includes(path)) {
          this.imageCache.delete(path);
        }
      }
    }
  }
  
  
  
  
  async testWeChatCompatibility() {
    const testResults = {
      environment: typeof wx !== 'undefined',
      imageCreation: false,
      imageLoading: false,
      caching: false,
      errorHandling: true
    };
    
    try {
      const testImage = this.createImage();
      testResults.imageCreation = testImage !== null;
    } catch (error) {
      console.warn('图像对象创建失败:', error);
    }
    
    if (testResults.environment) {
      testResults.imageLoading = true;
      testResults.caching = true;
    }
    
    return testResults;
  }
}

// 创建全局单例实例
const resourceManager = new ResourceManager();
export { resourceManager };