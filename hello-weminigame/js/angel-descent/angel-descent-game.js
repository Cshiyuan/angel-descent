/**
 * @file angel-descent-game.js
 * @description 天使下凡一百层游戏主控制器
 */

import EventManager from '../event-manager.js';
import Player from './entities/player.js';
import Platform, { PLATFORM_TYPES } from './entities/platform.js';
import LevelGenerator from './level/level-generator.js';
import TutorialOverlay from './ui/tutorial-overlay.js';
import PlatformPool from './core/platform-pool.js';
import { resourceManager } from '../runtime/resource-manager.js';
import Music from '../runtime/music.js';
import RenderManager from './managers/render-manager.js';
import EffectsManager from './managers/effects-manager.js';

// 天使下凡一百层游戏特有的游戏状态
export const GAME_STATES = {
  MENU: 'menu',
  TUTORIAL: 'tutorial',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  LEVEL_COMPLETE: 'level_complete'
};

/**
 * 天使下凡一百层游戏主类
 */
export default class AngelDescentGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 游戏状态
    this.currentState = GAME_STATES.TUTORIAL;
    this.running = false;
    this.paused = false;
    
    // 时间管理
    this.lastTime = 0;
    this.deltaTime = 0;
    this.gameTime = 0;
    this.lastStatsTime = 0; // 用于统计输出控制
    
    // 游戏数据
    this.gameData = {
      currentLayer: 1,
      maxLayer: 100,
      playerLives: 3,
      score: 0,
      fallDistance: 0,
      totalDistance: 0
    };

    // 生命值显示特效系统
    this.livesDisplayEffect = {
      lastLives: 3,
      changeTime: 0,
      isChanged: false,
      changeType: 'none', // 'gain', 'lose', 'none'
      flashIntensity: 0
    };
    
    // 音频系统（先初始化，其他系统可能需要用到）
    this.audioManager = new Music();
    
    // 游戏系统
    this.eventManager = null;
    this.camera = null;
    this.renderManager = new RenderManager(this);
    this.effectsManager = new EffectsManager(this);
    this.platformPool = new PlatformPool(this.audioManager);
    this.levelGenerator = new LevelGenerator(this.audioManager, this.platformPool);
    this.player = null;
    this.platforms = [];
    this.lifeFruits = []; // 生命果实数组
    
    // 物理常量
    this.gravity = 980; // 重力加速度 (像素/秒²)
    this.layerHeight = 600; // 每层的高度
    
    // 输入状态
    this.inputState = {
      leftPressed: false,
      rightPressed: false
    };
    
    // 游戏回调
    this.onExit = null;
    
    // 视觉效果
    this.backgroundOffset = 0; // 背景滚动偏移
    this.fallEffectParticles = []; // 下降效果粒子
    
    // 优化：背景飘浮微粒系统
    this.backgroundParticles = [];
    this.backgroundParticleSystem = {
      enabled: true,
      maxParticles: 60,          // 进一步增加粒子数量
      spawnRate: 1.5,            // 显著提高生成频率
      spawnTimer: 0,             // 生成计时器
      particleTypes: [
        {
          name: 'sparkle',
          color: '#FFD700',
          minSize: 2,
          maxSize: 4, // 更大的粒子尺寸
          minLife: 5, // 缩短生存时间从8-15到5-10秒
          maxLife: 10,
          minSpeed: 10,
          maxSpeed: 25, // 减少速度范围
          probability: 0.5 // 增加简单粒子比例
        },
        {
          name: 'glow',
          color: '#FFFFFF',
          minSize: 2, // 更大的尺寸
          maxSize: 5,
          minLife: 6, // 缩短生存时间从12-20到6-12秒
          maxLife: 12,
          minSpeed: 5,
          maxSpeed: 18,
          probability: 0.3
        },
        {
          name: 'dust',
          color: '#F0F8FF',
          minSize: 1.5,
          maxSize: 3.5, // 更大的尺寸
          minLife: 6, // 缩短生存时间从10-25到6-15秒
          maxLife: 15,
          minSpeed: 8,
          maxSpeed: 20,
          probability: 0.2 // 减少复杂粒子比例
        }
      ]
    };
    
    // UI组件
    this.tutorialOverlay = new TutorialOverlay(canvas);
    
    // 新手指引状态跟踪
    this.hasCompletedTutorial = false;
    
    // 背景图像系统
    this.backgroundImages = new Map(); // 存储加载的背景图像
    this.backgroundLoaded = false;     // 背景图像加载状态
    this.currentBackgroundTheme = 'cloud'; // 当前背景主题
    this.previousBackgroundTheme = null; // 之前的背景主题（用于过渡）
    this.backgroundTransition = {
      active: false,      // 是否正在进行主题切换
      progress: 0,        // 切换进度（0-1）
      duration: 2.0       // 切换持续时间（秒）
    };
    
    // 角色图像系统
    this.characterImages = new Map(); // 存储加载的角色图像
    this.characterLoaded = false;     // 角色图像加载状态
    
    // 角色特效动画系统
    this.characterEffects = new Map(); // 存储加载的特效图像
    this.effectsLoaded = false;        // 特效图像加载状态
    
    // 平台图像系统
    this.platformImages = new Map();   // 存储加载的平台图像
    this.platformsLoaded = false;      // 平台图像加载状态
    
    // 资源管理系统
    this.availableResources = {
      backgrounds: [],
      characters: [],
      platforms: [],
      effects: [],
      ui: []
    };
    
    // 兼容性测试结果
    this.compatibilityTestResults = null;
    
    // 游戏实例已创建
  }

  /**
   * 初始化游戏
   */
  async initialize() {
    try {
      // 开始初始化
      
      // 初始化事件管理器
      this.eventManager = new EventManager();
      
      // 预加载美术资源（确保资源加载完成后再创建游戏对象）
      await this.loadGameAssets();
      
      // 初始化简单的摄像机系统
      this.camera = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        smoothing: 0.1,
        moveTo: function(x, y) {
          this.x = x;
          this.y = y;
        },
        setTarget: function(x, y) {
          this.targetX = x;
          this.targetY = y;
        },
        update: function() {
          this.x += (this.targetX - this.x) * this.smoothing;
          this.y += (this.targetY - this.y) * this.smoothing;
        },
        getOffset: function() {
          return { x: -this.x, y: -this.y };
        }
      };
      
      // 设置摄像机初始位置，配合新的视野设置
      const initialScreenCenterX = this.canvas.width / 2;
      const initialScreenOffsetY = this.canvas.height * 0.25;
      this.camera.moveTo(187.5 - initialScreenCenterX, 100 - initialScreenOffsetY); // 根据新的25%偏移调整
      
      // 重置游戏数据
      this.resetGameData();
      
      // 初始化游戏对象
      await this.initializeGameObjects();
      
      // 设置事件监听
      this.setupEventListeners();
      
      // 根据是否完成过新手指引来设置初始状态
      if (this.hasCompletedTutorial) {
        // 已完成新手指引，直接开始游戏
        this.currentState = GAME_STATES.PLAYING;
        // 跳过新手指引，直接开始游戏
      } else {
        // 首次游戏，显示新手指引
        this.currentState = GAME_STATES.TUTORIAL;
        // 显示新手指引
      }
      
      // 启动游戏循环
      this.start();
      
      // 初始化完成
      
    } catch (error) {
      // 初始化失败
      throw error;
    }
  }

  /**
   * 异步加载游戏美术资源
   * 
   * 预加载背景图像和角色图像，提升视觉体验
   * 采用异步加载，不阻塞游戏启动流程
   */
  async loadGameAssets() {
    try {
      
      // 执行微信小游戏兼容性测试
      await this.runCompatibilityTests();
      
      // 首先检测资源可用性
      await this.detectAvailableResources();
      
      // 使用ResourceManager预加载背景图像
      const backgroundMap = await resourceManager.preloadBackgrounds();
      
      // 预加载角色图像
      const characterMap = await resourceManager.preloadCharacters();
      
      // 预加载角色特效动画
      const characterEffectsMap = await resourceManager.preloadCharacterEffects();
      
      // 预加载平台图像
      const platformMap = await resourceManager.preloadPlatforms();
      
      // 存储加载结果
      this.backgroundImages = backgroundMap;
      this.backgroundLoaded = true;
      this.characterImages = characterMap;
      this.characterLoaded = characterMap && 
        Array.from(characterMap.values()).some(img => img !== null);
      this.characterEffects = characterEffectsMap;
      this.effectsLoaded = characterEffectsMap && 
        Array.from(characterEffectsMap.values()).some(img => img !== null);
      this.platformImages = platformMap;
      this.platformsLoaded = platformMap && 
        Array.from(platformMap.values()).some(img => img !== null);
      
      // 根据当前层数设置初始背景主题
      const currentTheme = this.getCurrentBackgroundTheme();
      this.currentBackgroundTheme = currentTheme;
      
      // 统计加载成功的资源数量 (用于验证资源加载完整性)
      Array.from(backgroundMap.values()).filter(img => img !== null).length;
      Array.from(characterMap.values()).filter(img => img !== null).length;
      Array.from(characterEffectsMap.values()).filter(img => img !== null).length;
      Array.from(platformMap.values()).filter(img => img !== null).length;
      
      
      
      
      // 输出资源可用性报告
      this.reportResourceAvailability();
      
    } catch (error) {
      console.warn('美术资源加载失败，将使用代码渲染', error);
      this.backgroundLoaded = false;
      this.characterLoaded = false;
      this.effectsLoaded = false;
      this.platformsLoaded = false;
    }
  }
  
  /**
   * 运行兼容性测试
   * 
   * 在游戏启动时执行各种兼容性和性能测试
   */
  async runCompatibilityTests() {
    
    // 执行ResourceManager的微信小游戏兼容性测试
    const resourceTests = await resourceManager.testWeChatCompatibility();
    
    // 测试游戏特有的功能
    await this.testGameSpecificFeatures();
    
    // 输出测试总结
    const allTestsPassed = Object.values(resourceTests).every(result => result === true);
    
    if (allTestsPassed) {
    } else {
      console.warn('⚠ 部分测试未通过，游戏可能在某些环境下表现异常');
    }
    
  }
  
  /**
   * 测试游戏特有功能
   * 
   * 测试天使下凡一百层游戏的特有功能和系统
   */
  async testGameSpecificFeatures() {
    
    const tests = {
      canvasRendering: false,
      touchEvents: false,
      animationFrames: false,
      audioSupport: false
    };
    
    // 测试Canvas渲染
    try {
      if (this.canvas && this.ctx) {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, 1, 1);
        tests.canvasRendering = true;
      }
    } catch (error) {
      console.warn('  ✗ Canvas渲染测试失败:', error);
    }
    
    // 测试触摸事件支持
    if (typeof wx !== 'undefined') {
      tests.touchEvents = typeof wx.onTouchStart === 'function' && 
                         typeof wx.onTouchMove === 'function' && 
                         typeof wx.onTouchEnd === 'function';
    }
    
    // 测试动画帧支持
    try {
      tests.animationFrames = typeof requestAnimationFrame === 'function' && 
                             typeof cancelAnimationFrame === 'function';
    } catch (error) {
      console.warn('  ✗ 动画帧测试失败:', error);
    }
    
    // 测试音频支持（微信小游戏音频API）
    if (typeof wx !== 'undefined') {
      tests.audioSupport = typeof wx.createInnerAudioContext === 'function';
    }
    
    // 存储测试结果用于后续参考
    this.compatibilityTestResults = tests;
    
    return tests;
  }
  
  /**
   * 检测可用的美术资源
   * 
   * 扫描项目中的美术资源，检测哪些资源文件真实存在
   * 为渐进式开发提供资源可用性信息
   */
  async detectAvailableResources() {
    
    // 定义需要检测的资源列表
    const resourcesToCheck = {
      backgrounds: [
        'images/backgrounds/bg_cloud.png',
        'images/backgrounds/bg_dawn.png',
        'images/backgrounds/bg_thunder.png',
        'images/backgrounds/bg_earth.png'
      ],
      characters: [
        'images/character/angel/angel_normal.png',
        'images/character/angel/angel_hurt.png',
        'images/character/angel/angel_fall.png'
      ],
      platforms: [
        // 平台纹理资源（暂未添加）
        // 'images/platforms/cloud/platform_normal.png',
        // 'images/platforms/dawn/platform_normal.png',
        // 'images/platforms/earth/platform_normal.png',
        // 'images/platforms/thunder/platform_normal.png'
      ],
      effects: [
        // 角色动画特效资源
        'images/character/effects/angel_move_left_01.png',
        'images/character/effects/angel_move_left_02.png',
        'images/character/effects/angel_move_right_01.png',
        'images/character/effects/angel_move_right_02.png'
        // 其他特效资源（暂未添加）
        // 'images/effects/particles/particle_gold.png',
        // 'images/effects/particles/particle_blue.png',
        // 'images/effects/fx/explosion.png'
      ],
      ui: [
        // UI元素资源（暂未添加）
        // 'images/ui/icons/heart.png',
        // 'images/ui/icons/star.png',
        // 'images/ui/menus/button_bg.png'
      ]
    };
    
    // 并行检测所有资源
    const detectionPromises = [];
    for (const [category, resources] of Object.entries(resourcesToCheck)) {
      for (const resourcePath of resources) {
        detectionPromises.push(
          resourceManager.checkResourceExists(resourcePath)
            .then(exists => ({ category, path: resourcePath, exists }))
        );
      }
    }
    
    // 等待所有检测完成
    const results = await Promise.all(detectionPromises);
    
    // 整理检测结果
    const availableResources = {
      backgrounds: [],
      characters: [],
      platforms: [],
      effects: [],
      ui: []
    };
    
    for (const result of results) {
      if (result.exists) {
        availableResources[result.category].push(result.path);
      }
    }
    
    // 存储检测结果
    this.availableResources = availableResources;
    
  }
  
  /**
   * 输出资源可用性报告
   * 
   * 在控制台输出详细的资源检测结果，便于开发调试
   */
  reportResourceAvailability() {
    
    for (const [category, resources] of Object.entries(this.availableResources)) {
      // 分类名称映射 (用于调试和日志)
      const categoryNames = {
        backgrounds: '背景图像',
        characters: '角色精灵',
        platforms: '平台纹理',
        effects: '特效资源',
        ui: 'UI元素'
      };
      categoryNames[category] || category;
      
      
      if (resources.length > 0) {
        resources.forEach(resource => {
          // 提取文件名用于资源验证
          resource.split('/').pop();
        });
      } else {
      }
    }
    
    
    // 提供开发建议
    const totalAvailable = Object.values(this.availableResources).flat().length;
    if (totalAvailable === 0) {
    } else {
    }
  }
  
  /**
   * 根据当前层数获取背景主题
   * 
   * @returns {string} 背景主题名称
   */
  getCurrentBackgroundTheme() {
    const layer = this.gameData.currentLayer;
    
    // 根据游戏层数和主题映射选择背景
    if (layer <= 25) {
      return 'dawn';     // 1-25层：朝霞天界，使用朝霞背景
    } else if (layer <= 50) {
      return 'cloud';    // 26-50层：云海天界，使用云海背景
    } else if (layer <= 75) {
      return 'thunder';  // 51-75层：雷音天界，使用雷电背景
    } else {
      return 'earth';    // 76-100层：凡间边界，使用大地背景
    }
  }
  
  /**
   * 初始化游戏对象
   */
  async initializeGameObjects() {
    // 创建玩家
    this.player = new Player(187.5, 100, this.audioManager);
    
    // 设置角色图像（如果已加载）
    if (this.characterLoaded && this.characterImages) {
      this.player.setCharacterImages(this.characterImages);
    } else {
    }
    
    // 设置角色特效动画（如果已加载）
    if (this.effectsLoaded && this.characterEffects) {
      this.player.setCharacterEffects(this.characterEffects);
    } else {
    }
    
    // 移除可能存在的旧监听器，避免重复绑定
    this.player.off('death');
    
    // 监听玩家死亡事件
    this.player.on('death', () => {
      this.handlePlayerDeath();
    });
    
    // 生成初始关卡
    this.generateInitialLevels();
    
    // 游戏对象初始化完成
  }

  /**
   * 生成初始关卡
   */
  generateInitialLevels() {
    // 清空现有平台
    this.platforms = [];
    
    // 记录最高生成的层数（简化的生成记录）
    this.maxGeneratedLayer = 0;
    
    // 生成合理的初始层数，避免生成过多会被立即清理的平台
    // 基于屏幕高度计算合理的初始范围
    const screenHeights = Math.ceil(this.canvas.height / this.layerHeight);
    const initialLayerCount = Math.max(5, screenHeights + 3); // 至少5层，或屏幕高度+3层
    const initialLayers = this.levelGenerator.generateMultipleLayers(1, initialLayerCount);
    
    // 提取平台和生命果实，并记录已生成的层
    for (const layerData of initialLayers) {
      this.platforms.push(...layerData.platforms);
      this.lifeFruits.push(...layerData.lifeFruits);
      this.maxGeneratedLayer = Math.max(this.maxGeneratedLayer, layerData.layer);
      
    }
    
    // 在第1层添加一个确保的起始平台
    const startPlatform = new Platform(
      187.5, // 屏幕中心
      200,   // 玩家下方一点
      150,   // 更宽的起始平台，便于开始游戏
      20,
      PLATFORM_TYPES.NORMAL,
      0,     // 第0层（起始层）
      this.audioManager
    );
    this.platforms.unshift(startPlatform);
    // 起始层已记录在maxGeneratedLayer中
    
    // 初始生成平台
  }

  /**
   * 生成指定层的内容
   */
  generateLayer(layerNum) {
    // 使用LevelGenerator生成单层
    const layerData = this.levelGenerator.generateLayer(layerNum);
    
    
    // 添加生成的平台和生命果实
    this.platforms.push(...layerData.platforms);
    this.lifeFruits.push(...layerData.lifeFruits);
    
    
    // 生成完成
  }


  /**
   * 根据层数获取主题颜色（现在由Platform类处理）
   */
  getThemeColor(layerNum) {
    if (layerNum <= 25) return '#FFB74D'; // 朝霞天界 - 温暖的金色
    if (layerNum <= 50) return '#81D4FA'; // 云海天界 - 清澈的天蓝色
    if (layerNum <= 75) return '#CE93D8'; // 雷音天界 - 柔和的紫色
    return '#8D6E63'; // 凡间边界 - 大地色
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听游戏重置事件
    this.eventManager.on('game_reset', () => {
      this.resetGameData();
    });
    
    // 事件监听设置完成
  }

  /**
   * 重置游戏数据
   */
  resetGameData() {
    this.gameData = {
      currentLayer: 1,
      maxLayer: 100,
      playerLives: 3,
      score: 0,
      fallDistance: 0,
      totalDistance: 0
    };
    
    if (this.player && this.player.reset) {
      this.player.reset();
    }
  }

  /**
   * 处理触摸事件
   */
  handleTouch(e) {
    if (!this.running) return;
    
    // 如果在游戏胜利状态，点击重新开始游戏
    if (this.currentState === GAME_STATES.LEVEL_COMPLETE) {
      this.restart();
      return;
    }
    
    // 如果在游戏失败状态，点击重新开始游戏（与胜利状态保持一致）
    if (this.currentState === GAME_STATES.GAME_OVER) {
      // 清除自动重启定时器
      if (this.restartTimer) {
        clearTimeout(this.restartTimer);
        this.restartTimer = null;
      }
      this.restart();
      return;
    }
    
    // 如果在新手指引状态，让指引处理触摸事件
    if (this.currentState === GAME_STATES.TUTORIAL) {
      if (this.tutorialOverlay.handleTouch(e)) {
        // 指引完成，标记已完成并切换到游戏状态
        this.hasCompletedTutorial = true;
        this.currentState = GAME_STATES.PLAYING;
        
        // 重置输入状态，避免引导完成后的触摸被误处理为移动输入
        this.inputState.leftPressed = false;
        this.inputState.rightPressed = false;
        
        // 确保玩家输入状态也被重置
        if (this.player && this.player.setInput) {
          this.player.setInput(false, false);
        }
        
        // 新手指引完成，开始游戏
      }
      return;
    }
    
    // 游戏状态下的正常触摸处理
    if (this.paused) return;
    
    const touch = e.touches[0];
    const x = touch.clientX;
    const screenWidth = this.canvas.width;
    
    // 简单的左右控制：左半屏向左，右半屏向右
    if (x < screenWidth / 2) {
      this.inputState.leftPressed = true;
      this.inputState.rightPressed = false;
    } else {
      this.inputState.leftPressed = false;
      this.inputState.rightPressed = true;
    }
    
    // 更新玩家输入状态
    if (this.player && this.player.setInput) {
      this.player.setInput(this.inputState.leftPressed, this.inputState.rightPressed);
    }
  }

  /**
   * 处理触摸结束事件
   */
  handleTouchEnd(e) {
    // 停止移动
    this.inputState.leftPressed = false;
    this.inputState.rightPressed = false;
    
    // 更新玩家输入状态
    if (this.player && this.player.setInput) {
      this.player.setInput(false, false);
    }
  }

  /**
   * 启动游戏循环
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    // 使用 Date.now() 代替 performance.now()，兼容微信小游戏
    this.lastTime = Date.now();
    this.gameStep = this.gameStep.bind(this);
    requestAnimationFrame(this.gameStep);
    
    // 游戏循环已启动
  }

  /**
   * 停止游戏循环
   */
  stop() {
    this.running = false;
    // 游戏循环已停止
  }

  /**
   * 重新启动游戏
   */
  restart() {
    // 开始重启游戏
    
    // 停止游戏循环
    this.stop();
    
    // 清理定时器
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    
    // 重置游戏数据
    this.resetGameData();
    
    // 重新设置背景主题以匹配第一层
    const correctTheme = this.getCurrentBackgroundTheme();
    if (this.currentBackgroundTheme !== correctTheme) {
      this.currentBackgroundTheme = correctTheme;
      this.previousBackgroundTheme = null;
      // 重置背景过渡状态，确保立即显示正确背景
      this.backgroundTransition.active = false;
      this.backgroundTransition.progress = 0;
    }
    
    // 完全清理所有状态
    this.platforms = [];
    this.lifeFruits = [];
    this.maxGeneratedLayer = 0;
    
    // 重置关卡生成器状态，清空生成历史
    if (this.levelGenerator && this.levelGenerator.reset) {
      this.levelGenerator.reset();
    }
    
    // 重置玩家
    if (this.player) {
      this.player.reset();
      // 重启后重新应用角色图像
      if (this.characterLoaded && this.characterImages) {
        this.player.setCharacterImages(this.characterImages);
      }
    }
    
    // 重新生成初始关卡
    this.generateInitialLevels();
    
    // 重要：停止动画循环，避免与重新生成冲突
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 重置暂停状态，确保游戏可以正常运行
    this.paused = false;
    
    // 根据是否完成过新手指引来设置重启后的状态
    if (this.hasCompletedTutorial) {
      // 已完成新手指引，直接重新开始游戏
      this.currentState = GAME_STATES.PLAYING;
      // 重启游戏，跳过新手指引
    } else {
      // 首次游戏重启（理论上不应该发生，但保险起见）
      this.tutorialOverlay.reset();
      this.currentState = GAME_STATES.TUTORIAL;
      // 重启游戏，显示新手指引
    }
    
    this.start();
    
    // 游戏重启完成
  }

  /**
   * 暂停游戏
   */
  pause() {
    this.paused = true;
    this.currentState = GAME_STATES.PAUSED;
  }

  /**
   * 恢复游戏
   */
  resume() {
    this.paused = false;
    this.currentState = GAME_STATES.PLAYING;
  }

  /**
   * 游戏主循环
   */
  gameStep(currentTime) {
    if (!this.running) return;
    
    // 兼容微信小游戏：如果没有传入currentTime，使用Date.now()
    const now = currentTime || Date.now();
    
    // 首次运行时初始化lastTime
    if (this.lastTime === 0) {
      this.lastTime = now;
    }
    
    // 计算时间间隔
    this.deltaTime = (now - this.lastTime) / 1000;
    this.deltaTime = Math.max(0, Math.min(this.deltaTime, 1/30)); // 限制最大时间间隔
    this.lastTime = now;
    
    if (!this.paused) {
      // 更新游戏逻辑
      this.update(this.deltaTime);
      this.gameTime += this.deltaTime;
      
      // 性能统计已移除，避免在主循环中频繁调用console.log
      // 如需调试性能，请使用微信开发者工具的性能面板
      // 或在需要时手动调用 this.getPerformanceStats()
    }
    
    // 渲染游戏画面
    this.render();
    
    // 继续循环
    if (this.running) {
      requestAnimationFrame(this.gameStep);
    }
  }

  /**
   * 更新游戏逻辑
   */
  update(deltaTime) {
    // 如果在新手指引状态，只更新指引
    if (this.currentState === GAME_STATES.TUTORIAL) {
      this.tutorialOverlay.update(deltaTime);
      return;
    }
    
    // 游戏状态下的正常更新
    if (!this.player) return;
    
    // 动态生成关卡（在玩家更新前，确保有平台可用）
    this.updateLevelGeneration();
    
    // 更新玩家
    this.player.update(deltaTime);
    
    // 更新平台
    this.updatePlatforms(deltaTime);
    
    // 更新生命果实
    this.updateLifeFruits(deltaTime);
    
    
    // 更新视觉效果
    this.effectsManager.updateVisualEffects(deltaTime);
    
    // 更新生命值显示特效
    this.effectsManager.updateLivesDisplayEffect(deltaTime);
    
    // 更新摄像机跟随
    this.updateCamera();
    
    // 检查碰撞
    this.checkCollisions();
    
    // 检查层数变化
    this.checkLayerProgress();
    
    // 检查玩家是否掉出游戏区域
    this.checkPlayerBounds();
  }

  /**
   * 更新平台
   */
  updatePlatforms(deltaTime) {
    const cameraY = this.player.y - this.canvas.height / 2;
    // 大幅增加清理距离，确保有足够的缓冲区域
    // 新的生成范围：前方8层+后方3层 = 11层 * 600px = 6600px
    // 清理距离需要更大，使用10倍屏幕高度提供充足的安全边距
    const cleanupDistance = this.canvas.height * 10; // 增加到10倍，提供更大的缓冲区域
    
    // 清理参数调试日志已移除，避免在帧更新中频繁检查随机数
    // 如需调试清理参数，可在控制台手动调用相关方法
    
    const beforeUpdateCount = this.platforms.length;
    
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const platform = this.platforms[i];
      
      // 跳过空层标记对象
      if (platform.isEmpty) {
        continue;
      }
      
      // 只有真正的平台对象才调用update方法
      if (platform.update && typeof platform.update === 'function') {
        platform.update(deltaTime);
      }
      
      // 检查是否需要清理该平台
      const shouldCleanup = this.shouldCleanupPlatform(platform, cameraY, cleanupDistance);
      
      // 移除已销毁的平台或屏幕外的平台
      if ((platform.destroyed && !platform.isEmpty) || shouldCleanup) {
        // 如果使用了对象池，将平台返回池中
        if (this.platformPool && !platform.destroyed) {
          this.platformPool.release(platform);
        }
        
        
        
        this.platforms.splice(i, 1);
      }
    }
    
    const afterUpdateCount = this.platforms.length;
    const cleanedByUpdate = beforeUpdateCount - afterUpdateCount;
    
    // 平台清理日志已移除，避免在帧更新中频繁检查时间条件
    // 如需监控平台清理情况，可查看对象池统计信息或使用性能面板
  }

  /**
   * 判断平台是否需要清理
   * 
   * @param {Platform} platform - 要检查的平台
   * @param {number} cameraY - 相机Y坐标
   * @param {number} cleanupDistance - 清理距离
   * @returns {boolean} 是否需要清理
   */
  shouldCleanupPlatform(platform, cameraY, cleanupDistance) {
    // 平台在相机上方很远的距离时清理
    const platformBottomY = platform.y + platform.height / 2;
    const isAboveCamera = platformBottomY < cameraY - cleanupDistance;
    
    // 平台在相机下方很远的距离时也清理（防止玩家向上移动时的内存泄漏）
    const platformTopY = platform.y - platform.height / 2;
    const isBelowCamera = platformTopY > cameraY + this.canvas.height + cleanupDistance;
    
    return isAboveCamera || isBelowCamera;
  }

  /**
   * 更新生命果实
   */
  updateLifeFruits(deltaTime) {
    const cameraY = this.player.y - this.canvas.height / 2;
    const cleanupDistance = this.canvas.height * 20; // 生命果实保持更长距离，给玩家回去收集的机会
    
    
    for (let i = this.lifeFruits.length - 1; i >= 0; i--) {
      const lifeFruit = this.lifeFruits[i];
      
      // 更新生命果实逻辑
      lifeFruit.update(deltaTime);
      
      // 检查是否需要基于距离清理
      const shouldCleanup = this.shouldCleanupObject(lifeFruit, cameraY, cleanupDistance);
      
      
      
      // 移除已销毁的生命果实或屏幕外的生命果实
      if (lifeFruit.destroyed || shouldCleanup) {
        this.lifeFruits.splice(i, 1);
      }
    }
  }


  /**
   * 通用的对象清理判断方法
   * @param {Object} object - 要检查的对象
   * @param {number} cameraY - 相机Y坐标
   * @param {number} cleanupDistance - 清理距离
   * @returns {boolean} 是否需要清理
   */
  shouldCleanupObject(object, cameraY, cleanupDistance) {
    // 对象在相机上方很远的距离时清理
    const objectBottomY = object.y + (object.height || 0) / 2;
    const isAboveCamera = objectBottomY < cameraY - cleanupDistance;
    
    // 对象在相机下方很远的距离时也清理
    const objectTopY = object.y - (object.height || 0) / 2;
    const isBelowCamera = objectTopY > cameraY + this.canvas.height + cleanupDistance;
    
    return isAboveCamera || isBelowCamera;
  }

  /**
   * 更新摄像机跟随
   */
  updateCamera() {
    // 让摄像机紧密跟随玩家，减少平滑延迟来增强下降感
    this.camera.smoothing = 0.1; // 增加跟随响应速度，几乎实时跟随
    
    // 计算屏幕偏移，让玩家显示在屏幕上部更高位置，大幅增加下方视野
    const screenCenterX = this.canvas.width / 2;
    const screenOffsetY = this.canvas.height * 0.25; // 玩家位于屏幕上部25%位置，提供75%下方视野（原35%改为25%）
    
    // 摄像机目标位置 = 玩家位置 - 屏幕偏移
    const targetX = this.player.x - screenCenterX;
    const targetY = this.player.y - screenOffsetY;
    
    this.camera.setTarget(targetX, targetY);
    
    // 确保摄像机立即更新位置
    this.camera.update();
  }

  /**
   * 检查碰撞
   */
  checkCollisions() {
    // 检查与平台的碰撞
    for (const platform of this.platforms) {
      // 跳过空层标记对象
      if (platform.isEmpty) {
        continue;
      }
      
      // 只检查真正的平台对象
      if (platform.checkCollisionWithPlayer && typeof platform.checkCollisionWithPlayer === 'function') {
        if (platform.checkCollisionWithPlayer(this.player)) {
          // 玩家落在平台上
          this.player.landOnPlatform(platform);
          platform.onPlayerStep(this.player);
          break;
        }
      }
    }
    
    // 检查与生命果实的碰撞
    this.checkLifeFruitCollisions();
  }

  /**
   * 检查生命果实碰撞
   */
  checkLifeFruitCollisions() {
    for (let i = this.lifeFruits.length - 1; i >= 0; i--) {
      const lifeFruit = this.lifeFruits[i];
      
      // 检查是否与玩家碰撞
      if (lifeFruit.checkCollisionWithPlayer(this.player)) {
        // 收集生命果实
        if (lifeFruit.collect(this.player)) {
          // 收集成功，显示UI提示（如果需要）
          // 生命果实会在update中处理销毁逻辑
        }
      }
    }
  }


  /**
   * 检查层数进度
   */
  checkLayerProgress() {
    // 基于玩家Y坐标计算当前层数，与平台生成逻辑保持一致
    const currentLayer = Math.max(1, Math.ceil(this.player.y / this.layerHeight));
    if (currentLayer > this.gameData.currentLayer) {
      const previousLayer = this.gameData.currentLayer;
      this.gameData.currentLayer = currentLayer;
      this.gameData.totalDistance = this.player.y; // 使用Y坐标作为距离
      
      // 检查是否需要切换背景主题
      this.updateBackgroundTheme(previousLayer, currentLayer);
      
      // 检查是否完成游戏（当实际层数超过100层时，显示为0层，表示成功下凡到人间）
      if (currentLayer > this.gameData.maxLayer) {
        this.gameComplete();
      }
    }
  }
  
  /**
   * 更新背景主题
   * 
   * 当玩家进入新的主题层时，启动平滑的背景切换动画
   * 
   * @param {number} previousLayer - 之前的层数
   * @param {number} currentLayer - 新的层数
   */
  updateBackgroundTheme(previousLayer, currentLayer) {
    const newTheme = this.getCurrentBackgroundTheme();
    
    // 如果主题发生变化，启动平滑过渡
    if (newTheme !== this.currentBackgroundTheme && !this.backgroundTransition.active) {
      this.previousBackgroundTheme = this.currentBackgroundTheme;
      this.currentBackgroundTheme = newTheme;
      
      // 启动背景切换动画
      this.backgroundTransition.active = true;
      this.backgroundTransition.progress = 0;
      
      // 主题切换调试日志已优化：只在开发调试时启用
      // console.log(`🎨 主题切换: 第${previousLayer}层 → 第${currentLayer}层, ${this.previousBackgroundTheme} → ${newTheme}`);
      
      // 显示主题切换提示（频率低，不影响性能）
      this.renderManager.showThemeTransition(newTheme);
    }
  }

  /**
   * 预生成关卡（动态跟随生成）
   */
  updateLevelGeneration() {
    if (!this.player) return;
    
    // 防止在游戏重启或停止状态下运行
    if (!this.running || this.currentState === GAME_STATES.GAME_OVER) {
      return;
    }
    
    // 防止无限循环：限制每帧最多生成3层
    if (!this.generationLimitPerFrame) {
      this.generationLimitPerFrame = 0;
    }
    
    if (this.generationLimitPerFrame >= 3) {
      return;
    }
    
    // 简化的向前生成逻辑
    const playerLayer = Math.max(1, Math.ceil(this.player.y / this.layerHeight));
    const screenHeights = Math.ceil(this.canvas.height / this.layerHeight);
    
    // 向前生成足够的层数
    const aheadLayers = Math.max(8, screenHeights * 2);
    const targetLayer = Math.min(playerLayer + aheadLayers, this.gameData.maxLayer);
    
    // 只生成比当前最高层更高的层（简化的向前生成）
    for (let layer = this.maxGeneratedLayer + 1; layer <= targetLayer; layer++) {
        // 确保每层都有平台，避免大片空隙（除非是特意设计的挑战层）
        let shouldGenerateLayer = true;
        
        // 只有在特定条件下才创造空隙挑战
        if (layer % 20 === 0 && layer > 20) {
          // 每20层创造一个挑战层（概率性空隙）
          shouldGenerateLayer = Math.random() > 0.5; // 50%概率，比之前的30%更友好
        }
        
        if (shouldGenerateLayer) {
          // 生成前再次检查是否已有该层的平台，避免重复
          const existingLayerPlatforms = this.platforms.filter(p => p.layer === layer && !p.destroyed);
          if (existingLayerPlatforms.length === 0) {
            // 平台生成日志已移除，避免在帧更新中频繁输出
            // 如需监控关卡生成，可查看平台数组长度或使用性能面板
            
            this.generateLayer(layer);
            
            // 增加生成计数
            this.generationLimitPerFrame++;
          }
        }
        
        // 更新最高生成层数
        this.maxGeneratedLayer = Math.max(this.maxGeneratedLayer, layer);
    }
    
    // 平台清理现在由 updatePlatforms() 方法统一处理，基于相机位置和屏幕距离
    // 这里不再进行重复的清理操作，避免两套清理机制的冲突
    
    // 生命果实清理现在由 updateLifeFruits() 方法统一处理
    // 移除重复的清理逻辑，避免两套清理机制冲突
    
    // 显示本次生成周期的总结
    const finalPlatformCount = this.platforms.length;
    const currentPlayerLayer = Math.max(1, Math.ceil(this.player.y / this.layerHeight));
    
    // 生成周期总结日志已移除，避免在帧更新中频繁检查平台数量变化
    // 如需监控生成状态，可直接查看 this.platforms.length 或相关统计信息
    
    // 重置每帧生成限制
    this.generationLimitPerFrame = 0;
  }


  /**
   * 检查玩家边界
   */
  checkPlayerBounds() {
    if (!this.player) return;
    
    const playerY = this.player.y;
    const playerLayer = Math.max(1, Math.ceil(playerY / this.layerHeight));
    
    // 唯一失败条件：玩家快速掉落超过2层高度则游戏失败
    const fallDistance = this.layerHeight * 2; // 2层高度的快速掉落距离
    const nearestPlatformAbove = this.findNearestPlatformAbove(playerY);
    
    // 如果玩家下方超过2层高度没有平台，则游戏失败
    if (nearestPlatformAbove && (playerY - nearestPlatformAbove) > fallDistance) {
      this.gameOver('fell_too_far');
      return;
    }
    
    // 如果没有找到上方平台且玩家掉落超过2层，也视为失败
    if (!nearestPlatformAbove && playerY > this.layerHeight * 2) {
      this.gameOver('fell_into_void');
      return;
    }
    
    // 检查玩家是否已经完成游戏
    if (playerLayer > this.gameData.maxLayer) {
      this.gameComplete();
    }
  }

  /**
   * 找到玩家上方最近的平台Y坐标
   */
  findNearestPlatformAbove(playerY) {
    // 过滤出真正的平台对象，且在玩家上方
    const realPlatforms = this.platforms.filter(p => 
      !p.isEmpty && !p.destroyed && p.y < playerY
    );
    
    if (realPlatforms.length === 0) return null;
    
    let nearestY = null;
    let minDistance = Infinity;
    
    for (const platform of realPlatforms) {
      const distance = playerY - platform.y; // 只考虑上方平台，所以是正数
      if (distance < minDistance) {
        minDistance = distance;
        nearestY = platform.y;
      }
    }
    
    return nearestY;
  }

  /**
   * 处理玩家死亡
   */
  handlePlayerDeath() {
    // 防止重复触发
    if (this.currentState === GAME_STATES.GAME_OVER) {
      return;
    }
    
    // 玩家死亡
    this.gameOver('player_death');
  }

  /**
   * 游戏失败
   */
  gameOver(reason = 'unknown') {
    // 防止重复触发
    if (this.currentState === GAME_STATES.GAME_OVER) {
      return;
    }
    
    // 游戏失败
    this.currentState = GAME_STATES.GAME_OVER;
    this.gameOverReason = reason; // 保存失败原因用于显示
    this.stop(); // 完全停止游戏循环
    
    // 清除任何现有的重启定时器
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }
    
    // 3秒后重新开始游戏
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      this.restart();
    }, 3000);
  }

  /**
   * 游戏完成
   */
  gameComplete() {
    this.currentState = GAME_STATES.LEVEL_COMPLETE;
    this.paused = true; // 暂停游戏循环，但保持LEVEL_COMPLETE状态
    // 使命完成！恭喜成功抵达人间！
  }

  /**
   * 渲染游戏画面
   */
  render() {
    // 如果在新手指引状态，只渲染指引
    if (this.currentState === GAME_STATES.TUTORIAL) {
      // 清空画布
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 绘制基本背景
      this.renderManager.renderBackground();
      // 绘制新手指引覆盖层
      this.tutorialOverlay.render(this.ctx);
      return;
    }
    
    // 游戏状态下的正常渲染，委托给渲染管理器
    this.renderManager.render();
  }

  /**
   * 退出游戏
   */
  exit() {
    this.stop();
    if (this.onExit) {
      this.onExit();
    }
  }

  /**
   * 销毁游戏实例
   */
  dispose() {
    this.stop();
    
    // 清理游戏对象
    this.platforms = [];
    this.lifeFruits = [];
    this.player = null;
    
    // 清理对象池
    if (this.platformPool) {
      this.platformPool.destroy();
      this.platformPool = null;
    }
    
    // 游戏实例已销毁
  }

  /**
   * 定期清理对象池中的未使用对象
   * 
   * 建议在游戏暂停或切换场景时调用，释放长期未使用的对象。
   */
  cleanupObjectPools() {
    if (this.platformPool) {
      this.platformPool.cleanup();
      // console.log('对象池清理完成', this.platformPool.getPoolStats());
    }
  }


  /**
   * 获取性能统计信息
   * 
   * @returns {Object} 包含对象池和游戏性能的统计信息
   */
  getPerformanceStats() {
    const stats = {
      activePlatforms: this.platforms.length,
      activeLifeFruits: this.lifeFruits.length,
      currentLayer: this.gameData.currentLayer,
      platformPool: null
    };
    
    if (this.platformPool) {
      stats.platformPool = this.platformPool.getPoolStats();
    }
    
    return stats;
  }
}