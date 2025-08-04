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
      maxParticles: 25,          // 减少最大粒子数量从50到25，减少50%
      spawnRate: 0.3,            // 减少生成频率从0.5到0.3（粒子/秒），减少40%
      spawnTimer: 0,             // 生成计时器
      particleTypes: [
        {
          name: 'sparkle',
          color: '#FFD700',
          minSize: 1,
          maxSize: 2, // 减小粒子尺寸
          minLife: 5, // 缩短生存时间从8-15到5-10秒
          maxLife: 10,
          minSpeed: 10,
          maxSpeed: 25, // 减少速度范围
          probability: 0.5 // 增加简单粒子比例
        },
        {
          name: 'glow',
          color: '#FFFFFF',
          minSize: 1, // 减小尺寸
          maxSize: 3,
          minLife: 6, // 缩短生存时间从12-20到6-12秒
          maxLife: 12,
          minSpeed: 5,
          maxSpeed: 18,
          probability: 0.3
        },
        {
          name: 'dust',
          color: '#F0F8FF',
          minSize: 0.5,
          maxSize: 1.5, // 减小尺寸
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
    this.updateVisualEffects(deltaTime);
    
    // 更新生命值显示特效
    this.updateLivesDisplayEffect(deltaTime);
    
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
   * 更新生命值显示特效
   */
  updateLivesDisplayEffect(deltaTime) {
    if (!this.player) return;
    
    const currentLives = this.player.lives;
    const lastLives = this.livesDisplayEffect.lastLives;
    
    // 检测生命值变化
    if (currentLives !== lastLives) {
      this.livesDisplayEffect.isChanged = true;
      this.livesDisplayEffect.changeTime = 0;
      this.livesDisplayEffect.changeType = currentLives > lastLives ? 'gain' : 'lose';
      this.livesDisplayEffect.flashIntensity = 1.0;
      this.livesDisplayEffect.lastLives = currentLives;
    }
    
    // 更新变化特效
    if (this.livesDisplayEffect.isChanged) {
      this.livesDisplayEffect.changeTime += deltaTime;
      
      // 闪烁效果持续1秒
      if (this.livesDisplayEffect.changeTime < 1.0) {
        // 闪烁强度递减
        this.livesDisplayEffect.flashIntensity = 1.0 - (this.livesDisplayEffect.changeTime / 1.0);
      } else {
        // 结束特效
        this.livesDisplayEffect.isChanged = false;
        this.livesDisplayEffect.changeType = 'none';
        this.livesDisplayEffect.flashIntensity = 0;
      }
    }
  }

  /**
   * 更新视觉效果
   */
  updateVisualEffects(deltaTime) {
    if (!this.player) return;
    
    // 更新背景滚动偏移，基于摄像机位置而不是玩家速度
    // 这样可以创建连续的背景滚动效果
    this.updateBackgroundOffset();
    
    // 更新背景主题切换动画
    this.updateBackgroundTransition(deltaTime);
    
    // 生成下降效果粒子
    this.generateFallEffectParticles(deltaTime);
    
    // 更新现有粒子
    this.updateFallEffectParticles(deltaTime);
    
    // 更新背景飘浮微粒
    this.updateBackgroundParticles(deltaTime);
  }
  
  /**
   * 更新背景偏移
   * 
   * 背景图片保持静态，不随玩家移动而滚动
   * 背景作为固定的天空/环境，营造沉浸的游戏氛围
   */
  updateBackgroundOffset() {
    // 背景保持静态，偏移量为0
    // 这样背景图片就像真正的天空一样固定不动
    this.backgroundOffset = 0;
  }
  
  /**
   * 更新背景主题切换动画
   * 
   * @param {number} deltaTime - 时间间隔
   */
  updateBackgroundTransition(deltaTime) {
    if (!this.backgroundTransition.active) return;
    
    // 更新过渡进度
    this.backgroundTransition.progress += deltaTime / this.backgroundTransition.duration;
    
    // 检查过渡是否完成
    if (this.backgroundTransition.progress >= 1.0) {
      this.backgroundTransition.active = false;
      this.backgroundTransition.progress = 1.0;
      this.previousBackgroundTheme = null;
    }
  }

  /**
   * 生成下降效果粒子
   */
  generateFallEffectParticles(deltaTime) {
    if (!this.player || this.player.velocity.y < 100) return; // 只有快速下降时才生成
    
    // 根据下降速度控制粒子生成频率
    const spawnRate = (this.player.velocity.y / 600) * 30; // 下降越快，粒子越多
    const shouldSpawn = Math.random() < spawnRate * deltaTime;
    
    if (shouldSpawn) {
      // 在屏幕边缘生成向上移动的粒子
      for (let i = 0; i < 3; i++) {
        const particle = {
          x: Math.random() * this.canvas.width,
          y: this.canvas.height + 20, // 从屏幕底部开始
          velocity: {
            x: (Math.random() - 0.5) * 20,
            y: -200 - Math.random() * 100 // 向上移动
          },
          life: 1.0 + Math.random() * 0.5,
          maxLife: 1.5,
          size: 1 + Math.random() * 2,
          alpha: 0.3 + Math.random() * 0.4,
          color: this.getCurrentThemeParticleColor()
        };
        
        this.fallEffectParticles.push(particle);
      }
    }
  }

  /**
   * 更新下降效果粒子
   */
  updateFallEffectParticles(deltaTime) {
    for (let i = this.fallEffectParticles.length - 1; i >= 0; i--) {
      const particle = this.fallEffectParticles[i];
      
      // 更新位置
      particle.x += particle.velocity.x * deltaTime;
      particle.y += particle.velocity.y * deltaTime;
      
      // 更新生命值
      particle.life -= deltaTime;
      particle.alpha = (particle.life / particle.maxLife) * 0.6;
      
      // 移除过期粒子
      if (particle.life <= 0 || particle.y < -50) {
        this.fallEffectParticles.splice(i, 1);
      }
    }
    
    // 限制粒子数量
    if (this.fallEffectParticles.length > 50) {
      this.fallEffectParticles.splice(0, this.fallEffectParticles.length - 50);
    }
  }

  /**
   * 获取当前主题的粒子颜色
   */
  getCurrentThemeParticleColor() {
    const layer = this.gameData.currentLayer;
    if (layer <= 25) return '#FFD54F'; // 朝霞天界 - 金光粒子
    if (layer <= 50) return '#B3E5FC'; // 云海天界 - 云朵粒子  
    if (layer <= 75) return '#E1BEE7'; // 雷音天界 - 柔和雷光粒子
    return '#BCAAA4'; // 凡间边界 - 大地粒子
  }

  /**
   * 更新背景飘浮微粒系统
   * @param {number} deltaTime - 时间间隔
   */
  updateBackgroundParticles(deltaTime) {
    if (!this.backgroundParticleSystem.enabled) return;
    
    // 更新生成计时器
    this.backgroundParticleSystem.spawnTimer += deltaTime;
    
    // 检查是否需要生成新粒子
    const spawnInterval = 1 / this.backgroundParticleSystem.spawnRate;
    if (this.backgroundParticleSystem.spawnTimer >= spawnInterval) {
      this.spawnBackgroundParticle();
      this.backgroundParticleSystem.spawnTimer = 0;
    }
    
    // 更新现有粒子
    for (let i = this.backgroundParticles.length - 1; i >= 0; i--) {
      const particle = this.backgroundParticles[i];
      
      // 更新粒子生命值
      particle.life -= deltaTime;
      
      // 更新粒子位置
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // 更新粒子透明度（基于生命值）
      particle.alpha = Math.min(1, particle.life / particle.maxLife);
      
      // 更新粒子尺寸（轻微的脉动效果）
      particle.currentSize = particle.baseSize * (1 + 0.1 * Math.sin(particle.pulsePhase));
      particle.pulsePhase += deltaTime * 2;
      
      // 添加轻微的漂移效果
      particle.vx += (Math.random() - 0.5) * 5 * deltaTime;
      particle.vy += (Math.random() - 0.5) * 5 * deltaTime;
      
      // 限制速度
      const maxSpeed = 50;
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      if (speed > maxSpeed) {
        particle.vx = (particle.vx / speed) * maxSpeed;
        particle.vy = (particle.vy / speed) * maxSpeed;
      }
      
      // 边界检查 - 让粒子在屏幕边缘循环
      if (particle.x < -50) particle.x = this.canvas.width + 50;
      if (particle.x > this.canvas.width + 50) particle.x = -50;
      if (particle.y < -50) particle.y = this.canvas.height + 50;
      if (particle.y > this.canvas.height + 50) particle.y = -50;
      
      // 移除生命值耗尽的粒子
      if (particle.life <= 0) {
        this.backgroundParticles.splice(i, 1);
      }
    }
    
    // 限制最大粒子数量
    if (this.backgroundParticles.length > this.backgroundParticleSystem.maxParticles) {
      this.backgroundParticles.splice(0, this.backgroundParticles.length - this.backgroundParticleSystem.maxParticles);
    }
  }
  
  /**
   * 生成背景粒子
   */
  spawnBackgroundParticle() {
    if (this.backgroundParticles.length >= this.backgroundParticleSystem.maxParticles) {
      return;
    }
    
    // 随机选择粒子类型
    const rand = Math.random();
    let cumulativeProbability = 0;
    let selectedType = this.backgroundParticleSystem.particleTypes[0];
    
    for (const type of this.backgroundParticleSystem.particleTypes) {
      cumulativeProbability += type.probability;
      if (rand <= cumulativeProbability) {
        selectedType = type;
        break;
      }
    }
    
    // 在屏幕边缘随机位置生成粒子
    let x, y, vx, vy;
    const side = Math.floor(Math.random() * 4); // 0-3对应四个边
    
    switch (side) {
      case 0: // 上边
        x = Math.random() * this.canvas.width;
        y = -20;
        vx = (Math.random() - 0.5) * selectedType.maxSpeed;
        vy = Math.random() * selectedType.maxSpeed * 0.5 + selectedType.minSpeed;
        break;
      case 1: // 右边
        x = this.canvas.width + 20;
        y = Math.random() * this.canvas.height;
        vx = -(Math.random() * selectedType.maxSpeed * 0.5 + selectedType.minSpeed);
        vy = (Math.random() - 0.5) * selectedType.maxSpeed;
        break;
      case 2: // 下边
        x = Math.random() * this.canvas.width;
        y = this.canvas.height + 20;
        vx = (Math.random() - 0.5) * selectedType.maxSpeed;
        vy = -(Math.random() * selectedType.maxSpeed * 0.5 + selectedType.minSpeed);
        break;
      case 3: // 左边
        x = -20;
        y = Math.random() * this.canvas.height;
        vx = Math.random() * selectedType.maxSpeed * 0.5 + selectedType.minSpeed;
        vy = (Math.random() - 0.5) * selectedType.maxSpeed;
        break;
    }
    
    // 创建新粒子
    const particle = {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      baseSize: selectedType.minSize + Math.random() * (selectedType.maxSize - selectedType.minSize),
      currentSize: 0, // 将在更新中计算
      life: selectedType.minLife + Math.random() * (selectedType.maxLife - selectedType.minLife),
      maxLife: 0, // 初始化后设置
      alpha: 1,
      color: selectedType.color,
      type: selectedType.name,
      pulsePhase: Math.random() * Math.PI * 2
    };
    
    // 设置最大生命值
    particle.maxLife = particle.life;
    particle.currentSize = particle.baseSize;
    
    this.backgroundParticles.push(particle);
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
      
      // 检查是否完成游戏
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
      this.showThemeTransition(newTheme);
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
    this.pause();
    // 使命完成！恭喜成功抵达人间！
  }

  /**
   * 渲染游戏画面
   */
  render() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 如果在新手指引状态，只渲染指引
    if (this.currentState === GAME_STATES.TUTORIAL) {
      // 绘制基本背景
      this.renderBackground();
      // 绘制新手指引覆盖层
      this.tutorialOverlay.render(this.ctx);
      return;
    }
    
    // 游戏状态下的正常渲染
    // 绘制背景
    this.renderBackground();
    
    // 绘制背景飘浮微粒（在摄像机变换前，固定在屏幕空间）
    this.renderBackgroundParticles();
    
    // 应用摄像机变换
    const offset = this.camera.getOffset();
    
    this.ctx.save();
    this.ctx.translate(offset.x, offset.y);
    
    // 绘制平台
    this.renderPlatforms();
    
    // 绘制生命果实
    this.renderLifeFruits();
    
    // 绘制玩家
    this.renderPlayer();
    
    this.ctx.restore();
    
    // 绘制下降效果粒子（在UI变换外）
    this.renderFallEffectParticles();
    
    // 绘制UI
    this.renderUI();
  }

  /**
   * 渲染背景 - 智能图像/渐变背景切换系统
   * 
   * 优先使用美术背景图像，图像不可用时fallback到渐变背景
   * 支持动态主题切换和平滑过渡效果
   */
  renderBackground() {
    if (this.backgroundTransition.active && this.previousBackgroundTheme) {
      // 正在进行主题切换，渲染过渡效果
      this.renderBackgroundTransition();
    } else {
      // 正常渲染当前背景
      const backgroundImage = this.getBackgroundImage();
      
      if (backgroundImage) {
        // 使用图像背景
        this.renderImageBackground(backgroundImage);
      } else {
        // 使用渐变背景（原有逻辑）
        this.renderGradientBackground();
      }
    }
    
    // 绘制滚动背景纹理来增强下降感（保持原有效果）
    const layer = this.gameData.currentLayer;
    const themeInfo = this.levelGenerator.getThemeInfo(layer);
    this.renderScrollingBackground(themeInfo);
    
    // 主题变化提示已移除，避免在渲染函数中每帧检查和输出日志
    // 主题切换提示现在通过 updateBackgroundTheme 中的事件触发机制处理
  }
  
  /**
   * 渲染背景主题切换过渡效果
   * 
   * 在两个背景主题之间创建平滑的交融过渡动画
   * 确保过渡期间背景依然保持连续滚动效果
   */
  renderBackgroundTransition() {
    // 获取前一个和当前的背景图像
    const previousImage = this.backgroundImages.get(this.previousBackgroundTheme);
    const currentImage = this.backgroundImages.get(this.currentBackgroundTheme);
    
    // 计算透明度（使用缓动函数创建平滑过渡）
    const progress = this.backgroundTransition.progress;
    const easedProgress = this.easeInOutCubic(progress);
    const previousAlpha = 1 - easedProgress;
    const currentAlpha = easedProgress;
    
    this.ctx.save();
    
    // 渲染前一个背景（作为底层）
    if (previousImage && previousAlpha > 0) {
      this.ctx.globalAlpha = previousAlpha;
      this.renderImageBackground(previousImage);
    } else if (previousAlpha > 0) {
      // 如果没有图像，使用渐变背景
      this.ctx.globalAlpha = previousAlpha;
      this.renderGradientBackgroundForTheme(this.previousBackgroundTheme);
    }
    
    // 渲染当前背景（作为顶层）
    if (currentImage && currentAlpha > 0) {
      this.ctx.globalAlpha = currentAlpha;
      this.renderImageBackground(currentImage);
    } else if (currentAlpha > 0) {
      // 如果没有图像，使用渐变背景
      this.ctx.globalAlpha = currentAlpha;
      this.renderGradientBackgroundForTheme(this.currentBackgroundTheme);
    }
    
    this.ctx.restore();
  }
  
  /**
   * 缓动函数：三次贝塞尔曲线（平滑进出）
   * 
   * @param {number} t - 进度值（0-1）
   * @returns {number} 缓动后的值（0-1）
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * 为指定主题渲染渐变背景
   * 
   * @param {string} theme - 背景主题名称
   */
  renderGradientBackgroundForTheme(theme) {
    // 根据主题映射到游戏层主题
    let gameTheme;
    switch (theme) {
      case 'dawn':
        gameTheme = 'fire';
        break;
      case 'cloud':
        gameTheme = 'ice';
        break;
      case 'thunder':
        gameTheme = 'thunder';
        break;
      case 'earth':
        gameTheme = 'abyss';
        break;
      default:
        gameTheme = 'fire';
    }
    
    // 创建对应的渐变
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    
    switch (gameTheme) {
      case 'fire':
        gradient.addColorStop(0, '#FFA726');
        gradient.addColorStop(1, '#FFD54F');
        break;
      case 'ice':
        gradient.addColorStop(0, '#4FC3F7');
        gradient.addColorStop(1, '#B3E5FC');
        break;
      case 'thunder':
        gradient.addColorStop(0, '#AB47BC');
        gradient.addColorStop(1, '#E1BEE7');
        break;
      case 'abyss':
        gradient.addColorStop(0, '#6D4C41');
        gradient.addColorStop(1, '#BCAAA4');
        break;
      default:
        gradient.addColorStop(0, '#333333');
        gradient.addColorStop(1, '#666666');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * 获取当前应使用的背景图像
   * 
   * @returns {Image|null} 背景图像对象或null
   */
  getBackgroundImage() {
    if (!this.backgroundLoaded || !this.backgroundImages) {
      return null;
    }
    
    // 根据当前主题获取对应的背景图像
    return this.backgroundImages.get(this.currentBackgroundTheme) || null;
  }
  
  /**
   * 渲染图像背景
   * 
   * 使用美术背景图像作为静态背景，填满整个屏幕
   * 背景图像保持固定不动，就像真正的天空背景
   * 
   * @param {Image} backgroundImage - 背景图像对象
   */
  renderImageBackground(backgroundImage) {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    
    // 计算缩放比例以覆盖整个屏幕，保持图像比例
    const scaleX = canvasWidth / backgroundImage.width;
    const scaleY = canvasHeight / backgroundImage.height;
    
    // 选择较大的缩放比例，确保图像完全覆盖屏幕（可能会有部分裁剪）
    const scale = Math.max(scaleX, scaleY);
    
    const scaledWidth = backgroundImage.width * scale;
    const scaledHeight = backgroundImage.height * scale;
    
    // 计算居中偏移，确保图像居中显示
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;
    
    // 绘制单张背景图像，填满整个屏幕
    this.ctx.drawImage(
      backgroundImage,
      0, 0, backgroundImage.width, backgroundImage.height,  // 源图像完整区域
      offsetX,                                              // 目标X位置（居中）
      offsetY,                                              // 目标Y位置（居中）
      scaledWidth,                                         // 缩放宽度
      scaledHeight                                         // 缩放高度
    );
  }
  
  /**
   * 渲染渐变背景（原有逻辑）
   * 
   * 当图像背景不可用时的fallback渲染方式
   */
  renderGradientBackground() {
    const layer = this.gameData.currentLayer;
    const themeInfo = this.levelGenerator.getThemeInfo(layer);
    
    // 使用主题色彩创建渐变背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    
    // 根据主题选择渐变色
    switch (themeInfo.theme) {
      case 'fire':
        gradient.addColorStop(0, '#FFA726');
        gradient.addColorStop(1, '#FFD54F');
        break;
      case 'ice':
        gradient.addColorStop(0, '#4FC3F7');
        gradient.addColorStop(1, '#B3E5FC');
        break;
      case 'thunder':
        gradient.addColorStop(0, '#AB47BC');
        gradient.addColorStop(1, '#E1BEE7');
        break;
      case 'abyss':
        gradient.addColorStop(0, '#6D4C41');
        gradient.addColorStop(1, '#BCAAA4');
        break;
      default:
        gradient.addColorStop(0, '#333333');
        gradient.addColorStop(1, '#666666');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 渲染滚动背景纹理
   */
  renderScrollingBackground(themeInfo) {
    this.ctx.save();
    this.ctx.globalAlpha = 0.1; // 半透明效果
    
    // 根据主题绘制不同的背景图案
    const patternHeight = 100;
    const numPatterns = Math.ceil(this.canvas.height / patternHeight) + 2;
    
    for (let i = -1; i < numPatterns; i++) {
      const y = (i * patternHeight + this.backgroundOffset % patternHeight) - patternHeight;
      this.drawBackgroundPattern(themeInfo.theme, y, patternHeight);
    }
    
    this.ctx.restore();
  }

  /**
   * 绘制背景图案
   */
  drawBackgroundPattern(theme, y, height) {
    this.ctx.fillStyle = '#FFFFFF';
    
    switch (theme) {
      case 'fire':
        // 火焰纹理：随机垂直线条
        for (let x = 0; x < this.canvas.width; x += 20) {
          const lineHeight = Math.random() * height * 0.3;
          this.ctx.fillRect(x + Math.random() * 10 - 5, y + height - lineHeight, 2, lineHeight);
        }
        break;
        
      case 'ice':
        // 冰晶纹理：菱形图案
        for (let x = 0; x < this.canvas.width; x += 40) {
          this.drawDiamond(x + Math.random() * 20 - 10, y + Math.random() * height, 3);
        }
        break;
        
      case 'thunder':
        // 雷电纹理：锯齿线条
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 30) {
          this.drawLightning(x + Math.random() * 15 - 7, y + Math.random() * height, 20);
        }
        this.ctx.stroke();
        break;
        
      case 'abyss':
        // 深渊纹理：点状图案
        for (let x = 0; x < this.canvas.width; x += 15) {
          this.ctx.fillRect(x + Math.random() * 10 - 5, y + Math.random() * height, 1, 1);
        }
        break;
    }
  }

  /**
   * 绘制菱形
   */
  drawDiamond(x, y, size) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x + size, y);
    this.ctx.lineTo(x, y + size);
    this.ctx.lineTo(x - size, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * 绘制闪电形状
   */
  drawLightning(x, y, length) {
    this.ctx.moveTo(x, y);
    for (let i = 0; i < 3; i++) {
      x += (Math.random() - 0.5) * 10;
      y += length / 3;
      this.ctx.lineTo(x, y);
    }
  }

  /**
   * 显示主题变化提示
   */
  showThemeTransition(theme) {
    // 主题变化提示功能（目前使用日志形式，可扩展为UI动画）
    // 注意：此函数只在主题实际切换时调用，频率很低，不影响帧率
    console.log(`🌟 进入主题层: ${theme}`);
    
    // 这里可以添加UI提示或特效
    // 例如：显示主题名称、播放主题音效、创建特效等
    // 如需静默模式，可将上述日志注释掉
  }

  /**
   * 渲染平台
   */
  renderPlatforms() {
    // 获取摄像机偏移，计算可见区域，配合扩大的视野增加渲染范围
    const offset = this.camera.getOffset();
    const visibleTop = -offset.y - 200; // 进一步扩展上边界以配合新视野
    const visibleBottom = -offset.y + this.canvas.height + 300; // 进一步扩展下边界以配合新视野
    
    for (const platform of this.platforms) {
      // 跳过空层标记对象
      if (platform.isEmpty) {
        continue;
      }
      
      // 只渲染真正的平台对象
      if (platform.render && typeof platform.render === 'function') {
        // 视觉裁剪：只渲染在可见区域内或附近的平台
        if (platform.y >= visibleTop && platform.y <= visibleBottom) {
          platform.render(this.ctx);
        }
      }
    }
  }

  /**
   * 渲染生命果实
   */
  renderLifeFruits() {
    // 获取摄像机偏移，计算可见区域
    const offset = this.camera.getOffset();
    const visibleTop = -offset.y - 200;
    const visibleBottom = -offset.y + this.canvas.height + 300;
    
    for (const lifeFruit of this.lifeFruits) {
      // 视觉裁剪：只渲染在可见区域内或附近的生命果实
      if (lifeFruit.y >= visibleTop && lifeFruit.y <= visibleBottom) {
        lifeFruit.render(this.ctx);
      }
    }
  }

  /**
   * 渲染玩家
   */
  renderPlayer() {
    if (!this.player) return;
    
    // 使用Player类的render方法
    this.player.render(this.ctx);
  }

  /**
   * 渲染背景飘浮微粒
   */
  renderBackgroundParticles() {
    if (!this.backgroundParticleSystem.enabled || this.backgroundParticles.length === 0) return;
    
    this.ctx.save();
    
    for (const particle of this.backgroundParticles) {
      // 设置粒子透明度
      this.ctx.globalAlpha = particle.alpha * 0.8; // 稍微降低透明度，让粒子更柔和
      
      // 设置粒子样式
      this.ctx.fillStyle = particle.color;
      
      // 优化：简化粒子渲染，统一使用简单的圆形减少绘制复杂度
      // 只对部分粒子添加发光效果，减少shadow计算开销
      if (particle.type === 'sparkle' && Math.random() < 0.3) {
      } else {
      }
      
      // 统一渲染为简单圆形，避免复杂的星形和多重圆形绘制
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.currentSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  /**
   * 渲染下降效果粒子
   */
  renderFallEffectParticles() {
    if (this.fallEffectParticles.length === 0) return;
    
    this.ctx.save();
    
    for (const particle of this.fallEffectParticles) {
      // 设置粒子透明度
      this.ctx.globalAlpha = particle.alpha;
      
      // 设置粒子颜色
      this.ctx.fillStyle = particle.color;
      
      // 绘制粒子（小圆点）
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 可选：添加粒子轨迹效果
      if (particle.velocity.y < -150) { // 快速移动的粒子添加轨迹
        this.ctx.globalAlpha = particle.alpha * 0.3;
        this.ctx.fillRect(
          particle.x - particle.size * 0.5, 
          particle.y + particle.size, 
          particle.size, 
          Math.abs(particle.velocity.y) * 0.05
        );
      }
    }
    
    this.ctx.restore();
  }

  /**
   * 渲染美术风格的游戏信息面板
   */
  renderGameInfoPanel() {
    this.ctx.save();
    
    // 面板配置
    const panelConfig = {
      x: 15,
      y: 15,
      width: 160,
      height: 80,
      borderRadius: 12,
      padding: 12
    };
    
    // 获取当前主题颜色
    const currentTheme = this.getCurrentBackgroundTheme();
    const themeColors = this.getThemeUIColors(currentTheme);
    
    // 绘制主面板背景（半透明渐变）
    const gradient = this.ctx.createLinearGradient(
      panelConfig.x, panelConfig.y,
      panelConfig.x, panelConfig.y + panelConfig.height
    );
    gradient.addColorStop(0, themeColors.panelTop);
    gradient.addColorStop(1, themeColors.panelBottom);
    
    this.drawRoundedRect(
      panelConfig.x, panelConfig.y,
      panelConfig.width, panelConfig.height,
      panelConfig.borderRadius, gradient
    );
    
    // 绘制面板边框（发光效果）
    this.ctx.strokeStyle = themeColors.border;
    this.ctx.lineWidth = 2;
    this.drawRoundedRectStroke(
      panelConfig.x, panelConfig.y,
      panelConfig.width, panelConfig.height,
      panelConfig.borderRadius
    );
    
    
    // 文本配置
    const textX = panelConfig.x + panelConfig.padding;
    const textStartY = panelConfig.y + panelConfig.padding + 16;
    const lineHeight = 20;
    
    // 渲染层数信息（主要信息）
    this.ctx.fillStyle = themeColors.primaryText;
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    // 显示倒数层数：第1层显示为第100层，第100层显示为第1层
    const displayLayer = this.gameData.maxLayer - this.gameData.currentLayer + 1;
    this.ctx.fillText(`第 ${displayLayer} 层`, textX, textStartY);
    
    // 渲染主题名称（副标题）
    const themeInfo = this.levelGenerator.getThemeInfo(this.gameData.currentLayer);
    this.ctx.fillStyle = themeColors.secondaryText;
    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.fillText(themeInfo.name, textX, textStartY + lineHeight);
    
    // 渲染法力值（文字标签）
    const livesY = textStartY + lineHeight * 2;
    
    // 法力值区域背景 - 调整尺寸适应文字标签
    const livesAreaX = textX - 4;
    const livesAreaY = livesY - 18;
    const livesAreaWidth = 75;
    const livesAreaHeight = 22;
    
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.strokeStyle = themeColors.border;
    this.ctx.lineWidth = 1;
    this.drawRoundedRect(livesAreaX, livesAreaY, livesAreaWidth, livesAreaHeight, 8);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
    
    // 绘制法力值标签（文字描述）
    const labelX = textX + 4;
    const labelY = livesY;
    
    // 根据法力值变化调整文字颜色和效果
    let labelColor = '#FFFFFF';
    let labelSize = 14;
    
    if (this.livesDisplayEffect.isChanged) {
      const flashFactor = this.livesDisplayEffect.flashIntensity;
      
      if (this.livesDisplayEffect.changeType === 'gain') {
        // 获得法力：绿色闪烁
        labelColor = `rgb(${Math.floor(255 - 179 * flashFactor)}, 255, ${Math.floor(255 - 155 * flashFactor)})`;
        labelSize = 14 + 3 * flashFactor; // 变大效果
      } else if (this.livesDisplayEffect.changeType === 'lose') {
        // 失去法力：红色闪烁
        labelColor = `rgb(255, ${Math.floor(255 * (1-flashFactor))}, ${Math.floor(255 * (1-flashFactor))})`;
        labelSize = 14 + 2 * flashFactor;
      }
    }
    
    // 绘制"法力"标签
    this.ctx.save();
    this.ctx.fillStyle = labelColor;
    this.ctx.font = `bold ${labelSize}px Arial, sans-serif`;
    this.ctx.fillText('法力', labelX, labelY);
    this.ctx.restore();
    
    // 绘制法力值文本 - 增强效果
    const livesText = `${this.player ? this.player.lives : 0}`;
    this.ctx.save();
    
    // 根据法力值变化调整文字效果
    let textColor = '#FFFFFF';
    let fontSize = 16;
    
    if (this.livesDisplayEffect.isChanged) {
      const flashFactor = this.livesDisplayEffect.flashIntensity;
      
      if (this.livesDisplayEffect.changeType === 'gain') {
        // 获得法力：绿色文字
        textColor = `rgb(${Math.floor(255 - 179 * flashFactor)}, 255, ${Math.floor(255 - 155 * flashFactor)})`;
        fontSize = 16 + 4 * flashFactor;
      } else if (this.livesDisplayEffect.changeType === 'lose') {
        // 失去法力：红色文字
        textColor = `rgb(255, ${Math.floor(255 * (1-flashFactor))}, ${Math.floor(255 * (1-flashFactor))})`;
        fontSize = 16 + 2 * flashFactor;
      }
    }
    
    this.ctx.fillStyle = textColor;
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.fillText(livesText, labelX + 45, livesY); // 调整数字位置在"法力"标签后面
    this.ctx.restore();
    
    // 添加装饰性星星粒子效果
    this.renderPanelDecorations(panelConfig, themeColors);
    
    this.ctx.restore();
  }
  
  /**
   * 获取主题对应的UI颜色配置
   */
  getThemeUIColors(theme) {
    switch (theme) {
      case 'dawn':
        return {
          panelTop: 'rgba(255, 183, 77, 0.9)',
          panelBottom: 'rgba(255, 213, 79, 0.8)',
          border: '#FFD700',
          primaryText: '#FFFFFF',
          secondaryText: '#FFF3C4'
        };
      case 'cloud':
        return {
          panelTop: 'rgba(129, 212, 250, 0.9)',
          panelBottom: 'rgba(179, 229, 252, 0.8)',
          border: '#81D4FA',
          primaryText: '#FFFFFF',
          secondaryText: '#E1F5FE'
        };
      case 'thunder':
        return {
          panelTop: 'rgba(206, 147, 216, 0.9)',
          panelBottom: 'rgba(225, 190, 231, 0.8)',
          border: '#CE93D8',
          primaryText: '#FFFFFF',
          secondaryText: '#F3E5F5'
        };
      case 'earth':
        return {
          panelTop: 'rgba(141, 110, 99, 0.9)',
          panelBottom: 'rgba(188, 170, 164, 0.8)',
          border: '#8D6E63',
          primaryText: '#FFFFFF',
          secondaryText: '#EFEBE9'
        };
      default:
        return {
          panelTop: 'rgba(128, 128, 128, 0.9)',
          panelBottom: 'rgba(169, 169, 169, 0.8)',
          border: '#A9A9A9',
          primaryText: '#FFFFFF',
          secondaryText: '#F5F5F5'
        };
    }
  }
  
  /**
   * 绘制圆角矩形
   */
  drawRoundedRect(x, y, width, height, radius, fillStyle) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    
    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fill();
    }
  }
  
  /**
   * 绘制圆角矩形边框
   */
  drawRoundedRectStroke(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  
  /**
   * 渲染面板装饰效果
   */
  renderPanelDecorations(panelConfig, themeColors) {
    // 添加微妙的光点装饰
    for (let i = 0; i < 3; i++) {
      const sparkleX = panelConfig.x + panelConfig.width - 25 + (Math.sin(Date.now() * 0.001 + i) * 8);
      const sparkleY = panelConfig.y + 15 + i * 8 + (Math.cos(Date.now() * 0.0015 + i) * 3);
      
      this.ctx.fillStyle = themeColors.border;
      this.ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.003 + i) * 0.3;
      this.ctx.beginPath();
      this.ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.globalAlpha = 1; // 重置透明度
  }

  /**
   * 渲染暂停覆盖层
   */
  renderPauseOverlay() {
    this.ctx.save();
    
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 主面板
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const panelWidth = 200;
    const panelHeight = 120;
    
    // 获取当前主题颜色
    const currentTheme = this.getCurrentBackgroundTheme();
    const themeColors = this.getThemeUIColors(currentTheme);
    
    // 绘制暂停面板背景
    const gradient = this.ctx.createLinearGradient(
      centerX - panelWidth/2, centerY - panelHeight/2,
      centerX - panelWidth/2, centerY + panelHeight/2
    );
    gradient.addColorStop(0, themeColors.panelTop);
    gradient.addColorStop(1, themeColors.panelBottom);
    
    this.drawRoundedRect(
      centerX - panelWidth/2, centerY - panelHeight/2,
      panelWidth, panelHeight, 16, gradient
    );
    
    // 绘制边框
    this.ctx.strokeStyle = themeColors.border;
    this.ctx.lineWidth = 3;
    this.drawRoundedRectStroke(
      centerX - panelWidth/2, centerY - panelHeight/2,
      panelWidth, panelHeight, 16
    );
    
    
    // 暂停标题
    this.ctx.fillStyle = themeColors.primaryText;
    this.ctx.font = 'bold 28px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏暂停', centerX, centerY - 15);
    
    // 提示文字
    this.ctx.fillStyle = themeColors.secondaryText;
    this.ctx.font = '16px Arial, sans-serif';
    this.ctx.fillText('点击屏幕继续', centerX, centerY + 20);
    
    // 装饰星星
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Date.now() * 0.001;
      const radius = 80;
      const sparkleX = centerX + Math.cos(angle) * radius;
      const sparkleY = centerY + Math.sin(angle) * radius;
      
      this.ctx.fillStyle = themeColors.border;
      this.ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.003 + i) * 0.3;
      this.drawSparkle(sparkleX, sparkleY, 4);
    }
    
    this.ctx.restore();
  }

  /**
   * 绘制星星装饰
   */
  drawSparkle(x, y, size) {
    this.ctx.save();
    this.ctx.translate(x, y);
    
    // 绘制十字星
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.ctx.fillStyle;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(-size, 0);
    this.ctx.lineTo(size, 0);
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(0, size);
    this.ctx.stroke();
    
    // 中心点
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  /**
   * 渲染UI
   */
  renderUI() {
    // 渲染美术风格的游戏信息面板
    this.renderGameInfoPanel();
    
    // 移除调试信息，保持界面简洁美观
    
    // 美术风格的暂停界面
    if (this.paused) {
      this.renderPauseOverlay();
    }
    
    // 游戏失败提示
    if (this.currentState === GAME_STATES.GAME_OVER) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // 根据失败原因显示不同的标题和消息
      const failureInfo = this.getFailureMessage(this.gameOverReason);
      
      this.ctx.fillStyle = failureInfo.titleColor;
      this.ctx.font = 'bold 28px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(failureInfo.title, this.canvas.width/2, this.canvas.height/2 - 60);
      
      this.ctx.fillStyle = failureInfo.messageColor;
      this.ctx.font = '18px Arial';
      this.ctx.fillText(failureInfo.message, this.canvas.width/2, this.canvas.height/2 - 20);
      
      // 显示详细信息
      this.ctx.fillStyle = '#CCCCCC';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(failureInfo.detail, this.canvas.width/2, this.canvas.height/2 + 10);
      
      // 重启提示和成绩
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText('3秒后重新开始', this.canvas.width/2, this.canvas.height/2 + 40);
      // 显示倒数层数：实际第1层显示为第100层
      const deepestDisplayLayer = this.gameData.maxLayer - this.gameData.currentLayer + 1;
      this.ctx.fillText(`最深到达第 ${deepestDisplayLayer} 层`, this.canvas.width/2, this.canvas.height/2 + 70);
    }
    
    // 游戏完成提示
    if (this.currentState === GAME_STATES.LEVEL_COMPLETE) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = '28px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('✨ 下凡成功！✨', this.canvas.width/2, this.canvas.height/2 - 40);
      this.ctx.font = '18px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('天使已成功穿越百层天界抵达人间', this.canvas.width/2, this.canvas.height/2 - 5);
      this.ctx.fillText('可以开始履行救赎众生的神圣使命了！', this.canvas.width/2, this.canvas.height/2 + 20);
      this.ctx.font = '14px Arial';
      this.ctx.fillStyle = '#CCCCCC';
      this.ctx.fillText('点击屏幕重新体验下凡之旅', this.canvas.width/2, this.canvas.height/2 + 60);
    }
  }

  /**
   * 根据失败原因获取相应的失败消息
   */
  getFailureMessage(reason) {
    switch (reason) {
      case 'player_death':
        return {
          title: '法力耗尽！',
          titleColor: '#FF9800', // 温和的橙色
          message: '天使之力需要恢复...',
          messageColor: '#FFB74D', // 柔和的金色
          detail: '小心危险平台和致命陷阱！'
        };
        
      case 'fell_too_far':
        return {
          title: '失控坠落！',
          titleColor: '#FF9800', // 一致的橙色
          message: '下凡速度过快了...',
          messageColor: '#FFD54F', // 明亮的金色
          detail: '寻找云朵平台，控制下凡节奏！'
        };
        
      case 'fell_into_void':
        return {
          title: '迷失天界！',
          titleColor: '#CE93D8', // 柔和的紫色
          message: '在茧茧云海中迷失了方向...',
          messageColor: '#E1BEE7', // 淡紫色
          detail: '没有云朵可以立足，小心探索！'
        };
        
      default:
        return {
          title: '游戏失败！',
          titleColor: '#FF9800', // 通用橙色
          message: '发生了未知的错误...',
          messageColor: '#FFB74D', // 通用金色
          detail: '请重新开始神圣的下凡使命！'
        };
    }
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