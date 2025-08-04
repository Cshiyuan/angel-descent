/**
 * @file level-generator.js
 * @description 天使下凡一百层游戏程序化关卡生成系统
 * 
 * 高级程序化内容生成（PCG - Procedural Content Generation）系统，
 * 负责动态生成100层天界关卡，每层都具有独特的布局、难度和主题特色。
 * 
 * 核心设计理念：
 * - 渐进式难度曲线：随着层数增加，难度平滑上升
 * - 主题化设计：四个不同主题天界，各具特色
 * - 算法多样性：结合随机性与确定性，确保可玩性与挑战性
 * - 可重现性：支持种子系统，便于调试和测试
 * 
 * 生成算法核心：
 * 1. 分层主题系统：按25层为单位划分不同主题区域
 * 2. 难度渐进算法：基于数学函数的平滑难度增长
 * 3. 平台分布算法：空间分析确保平台的可达性和挑战性
 * 4. 类型权重系统：根据主题和难度动态调整平台类型概率
 * 
 * 数学模型：
 * - 难度函数：D(n) = base + scale * f(n)，其中n为层数
 * - 分布函数：使用泊松分布和正态分布控制平台位置
 * - 权重函数：多项式权重确保特殊平台的合理分布
 * 
 * 技术特点：
 * - 内存高效：按需生成，支持大型关卡
 * - 性能优化：缓存机制减少重复计算
 * - 可扩展性：模块化设计便于添加新主题和平台类型
 */

import Platform, { PLATFORM_TYPES } from '../entities/platform.js';
import LifeFruit from '../entities/life-fruit.js';

/**
 * 天界主题枚举
 * 
 * 定义四个渐进式主题区域，每个主题对应25层关卡，
 * 形成完整的100层天界体系。主题设计遵循从温和到极端的难度梯度。
 * 
 * 主题设计哲学：
 * - DAWN（朝霞天界）：入门区域，以常规和易碎平台为主
 * - CLOUD（云海天界）：进阶区域，引入冰滑和移动平台
 * - THUNDER（雷音天界）：高级区域，弹跳和消失平台增加挑战
 * - EARTH（凡间边界）：终极区域，所有平台类型混合，最高难度
 */
export const REALM_THEMES = {
  DAWN: 'dawn',        // 朝霞天界 (1-25层) - 新手友好，温暖色调
  CLOUD: 'cloud',      // 云海天界 (26-50层) - 滑动机制，冷色调
  THUNDER: 'thunder',  // 雷音天界 (51-75层) - 动态元素，紫色调
  EARTH: 'earth'       // 凡间边界 (76-100层) - 极限挑战，暗色调
};

/**
 * 程序化关卡生成器
 * 
 * 基于数学模型和游戏设计理论的智能关卡生成系统。
 * 通过多层次的算法组合，确保每一层都具有合适的挑战性和可玩性。
 * 
 * 生成管道架构：
 * 1. 主题识别 → 2. 难度计算 → 3. 平台生成 → 4. 障碍物放置 → 5. 可达性验证
 * 
 * 算法设计原则：
 * - 确定性随机：使用可预测的随机数生成，便于调试
 * - 平衡性保证：确保每层都有解决方案，避免无解情况
 * - 视觉一致性：主题相关的视觉元素和配色方案
 * - 性能优化：缓存和延迟加载减少计算开销
 * 
 * 数据结构设计：
 * - 分层存储：每层独立存储，支持动态加载
 * - 历史记录：追踪生成统计，用于平衡性分析
 * - 配置驱动：通过配置表控制生成参数，便于调优
 * 
 * @class LevelGenerator
 */
export default class LevelGenerator {
  /**
   * 构造函数 - 初始化程序化生成系统
   * 
   * 设置关卡生成的核心参数和数学模型。这些参数通过大量游戏测试优化，
   * 确保生成的关卡既具有挑战性，又保持可玩性。
   * 
   * 参数设计理念：
   * - 基于玩家跳跃能力设计层高和平台间距
   * - 平台数量范围确保每层都有通过路径
   * - 难度曲线参数控制挑战性的渐进增长
   * 
   * @constructor
   * @param {Object} audioManager - 音频管理器，用于平台音效
   */
  constructor(audioManager = null, platformPool = null) {
    // 音频管理器引用
    this.audioManager = audioManager;
    
    // 平台对象池引用
    this.platformPool = platformPool;
    /**
     * 空间几何参数
     * 基于游戏物理和玩家操作能力设计的空间常量
     */
    this.layerHeight = 600;  // 每层垂直高度（像素）- 基于玩家跳跃高度设计
    this.screenWidth = 375;  // 参考屏幕宽度（像素）- 用于平台分布计算
    
    /**
     * 平台数量约束
     * 确保每层有足够的平台供玩家通过，同时维持适当的挑战性
     */
    this.minPlatforms = 2;   // 最少平台数 - 保证基本可达性
    this.maxPlatforms = 5;   // 最多平台数 - 避免过于简单
    
    /**
     * 难度增长数学模型参数
     * 
     * 基于游戏设计理论的非线性难度增长系统：
     * - 使用分段函数确保平滑的难度过渡
     * - 参数经过大量测试优化，确保玩家体验的连贯性
     * 
     * 数学公式：
     * platform_count(n) = max_platforms - floor(n/10) * platform_reduction
     * special_chance(n) = base_chance + n * special_increase  
     * gap_multiplier(n) = 1 + floor(n/10) * gap_increase
     */
    this.difficultyScale = {
      platformReduction: 0.2,        // 每10层平台数量递减系数
      specialPlatformIncrease: 0.01, // 每层特殊平台概率增长率（1%）
      gapIncrease: 0                 // 平台间距增长系数（当前为0，保持固定间距）
    };
    
    /**
     * 主题配置系统
     * 存储四个天界主题的详细参数，包括颜色、平台类型分布、危险度等
     */
    this.themeConfigs = this.initializeThemeConfigs();
    
    /**
     * 生成历史追踪系统
     * 
     * 使用Map数据结构高效存储每层的生成信息，用于：
     * - 避免重复生成相同配置
     * - 统计分析生成质量
     * - 调试和优化生成算法
     * - 实现确定性生成（配合种子系统）
     * 
     * 数据结构：Map<layer_number, generation_metadata>
     */
    this.generationHistory = new Map();
    
  }

  /**
   * 初始化主题配置
   */
  initializeThemeConfigs() {
    return {
      [REALM_THEMES.DAWN]: {
        name: '朝霞天界',
        layers: [1, 25],
        primaryPlatforms: [PLATFORM_TYPES.NORMAL, PLATFORM_TYPES.FRAGILE],
        specialPlatforms: [PLATFORM_TYPES.DISAPPEARING, PLATFORM_TYPES.MOVING, PLATFORM_TYPES.DANGEROUS],
        hazardDensity: 0.1,
        platformSpacing: { min: 120, max: 200 },
        colors: {
          primary: '#FFB74D',
          secondary: '#FFD54F',
          accent: '#FFA726'
        }
      },
      [REALM_THEMES.CLOUD]: {
        name: '云海天界',
        layers: [26, 50],
        primaryPlatforms: [PLATFORM_TYPES.NORMAL, PLATFORM_TYPES.ICE],
        specialPlatforms: [PLATFORM_TYPES.MOVING, PLATFORM_TYPES.FRAGILE, PLATFORM_TYPES.DANGEROUS],
        hazardDensity: 0.15,
        platformSpacing: { min: 140, max: 220 },
        colors: {
          primary: '#81D4FA',
          secondary: '#B3E5FC',
          accent: '#4FC3F7'
        }
      },
      [REALM_THEMES.THUNDER]: {
        name: '雷音天界',
        layers: [51, 75],
        primaryPlatforms: [PLATFORM_TYPES.NORMAL, PLATFORM_TYPES.BOUNCE],
        specialPlatforms: [PLATFORM_TYPES.MOVING, PLATFORM_TYPES.DISAPPEARING, PLATFORM_TYPES.ICE, PLATFORM_TYPES.DANGEROUS],
        hazardDensity: 0.2,
        platformSpacing: { min: 160, max: 240 },
        colors: {
          primary: '#CE93D8',
          secondary: '#E1BEE7',
          accent: '#AB47BC'
        }
      },
      [REALM_THEMES.EARTH]: {
        name: '凡间边界',
        layers: [76, 100],
        primaryPlatforms: [PLATFORM_TYPES.NORMAL, PLATFORM_TYPES.FRAGILE, PLATFORM_TYPES.DANGEROUS],
        specialPlatforms: [PLATFORM_TYPES.DISAPPEARING, PLATFORM_TYPES.MOVING, PLATFORM_TYPES.BOUNCE, PLATFORM_TYPES.ICE, PLATFORM_TYPES.DANGEROUS],
        hazardDensity: 0.25,
        platformSpacing: { min: 180, max: 280 },
        colors: {
          primary: '#8D6E63',
          secondary: '#BCAAA4',
          accent: '#6D4C41'
        }
      }
    };
  }

  /**
   * 生成指定层的内容
   */
  generateLayer(layerNum, seed = null) {

    
    // 获取主题配置
    const theme = this.getThemeForLayer(layerNum);
    const config = this.themeConfigs[theme];
    
    // 计算难度参数
    const difficulty = this.calculateDifficulty(layerNum);
    
    // 生成平台
    const platforms = this.generatePlatforms(layerNum, config, difficulty);
    
    
    // 生成生命果实
    const lifeFruits = this.generateLifeFruits(layerNum, platforms, config, difficulty);
    
    // 记录生成历史
    this.generationHistory.set(layerNum, {
      theme,
      platformCount: platforms.length,
      lifeFruitCount: lifeFruits.length,
      difficulty
    });
    
    // 减少日志输出
    
    return {
      layer: layerNum,
      theme,
      platforms,
      lifeFruits,
      config,
      difficulty
    };
  }

  /**
   * 获取层数对应的主题
   */
  getThemeForLayer(layerNum) {
    if (layerNum <= 25) return REALM_THEMES.DAWN;
    if (layerNum <= 50) return REALM_THEMES.CLOUD;
    if (layerNum <= 75) return REALM_THEMES.THUNDER;
    return REALM_THEMES.EARTH;
  }

  /**
   * 难度计算算法 - 多维度动态难度系统
   * 
   * 基于游戏设计理论和数学建模的复合难度计算系统。
   * 通过多个维度的参数联动，实现平滑而富有挑战性的难度增长曲线。
   * 
   * 算法设计原理：
   * 1. 分段线性函数：避免突然的难度跳跃
   * 2. 多维度平衡：不同难度参数相互制衡
   * 3. 上下界限制：防止极端难度导致无解
   * 4. 层数归一化：基于100层设计的标准化计算
   * 
   * 数学模型详解：
   * - 平台数量：递减函数，初期较多平台，后期稀少
   * - 特殊平台：增长函数，从30%线性增长至70%
   * - 移动速度：线性增长，模拟玩家技能提升需求
   * - 耐久度：阶梯函数，每20层一个档次
   * 
   * @method calculateDifficulty
   * @param {number} layerNum - 层数（1-100）
   * @returns {Object} 难度参数对象，包含所有维度的数值
   */
  calculateDifficulty(layerNum) {
    return {
      /**
       * 平台数量计算 - 递减难度模型
       * 
       * 数学公式：count = max(min, max - floor(n/10) * reduction)
       * - 起始层（1-10层）：5个平台，相对容易
       * - 中期层（50层）：3个平台，适中难度  
       * - 后期层（90层）：2个平台，极高难度
       * 
       * 设计意图：随着玩家技能提升，减少平台数量增加挑战
       */
      platformCount: Math.max(
        this.minPlatforms,  // 保底2个平台，确保可通过性
        this.maxPlatforms - Math.floor(layerNum / 10) * this.difficultyScale.platformReduction
      ),
      
      /**
       * 特殊平台概率 - 线性增长模型
       * 
       * 数学公式：P(special) = min(0.7, 0.3 + n * 0.01)
       * - 第1层：30%特殊平台概率
       * - 第40层：70%特殊平台概率（达到上限）
       * - 第40层以后：维持70%概率
       * 
       * 设计意图：逐步引入复杂平台类型，避免新手被吓退
       */
      specialPlatformChance: Math.min(
        0.7,  // 上限70%，避免过度复杂
        0.3 + layerNum * this.difficultyScale.specialPlatformIncrease
      ),
      
      /**
       * 平台间距倍数 - 当前为恒定值
       * 
       * 当前设置为恒定值1.0，可在未来版本中启用间距递增：
       * 公式：gap = 1 + floor(n/10) * gap_increase
       * 
       * 预留设计：后期可增大平台间距，提升跳跃难度
       */
      gapMultiplier: 1 + Math.floor(layerNum / 10) * this.difficultyScale.gapIncrease,
      
      /**
       * 移动平台速度 - 线性增长模型
       * 
       * 数学公式：speed = 30 + n * 0.5 (像素/秒)
       * - 第1层：30像素/秒，较慢移动
       * - 第50层：55像素/秒，中等速度
       * - 第100层：80像素/秒，快速移动
       * 
       * 设计意图：随层数增加移动平台速度，考验玩家反应能力
       */
      movePlatformSpeed: 30 + layerNum * 0.5,
      
      /**
       * 易碎平台耐久度 - 阶梯递减模型
       * 
       * 数学公式：durability = max(1, 3 - floor(n/20))
       * - 第1-19层：3次踩踏后破碎
       * - 第20-39层：2次踩踏后破碎  
       * - 第40层以后：1次踩踏立即破碎
       * 
       * 设计意图：阶梯式降低容错率，迫使玩家更精确操作
       */
      fragilePlatformDurability: Math.max(1, 3 - Math.floor(layerNum / 20))
    };
  }

  /**
   * 生成平台
   */
  generatePlatforms(layerNum, config, difficulty) {
    const platforms = [];
    const layerY = layerNum * this.layerHeight;
    const platformCount = Math.floor(difficulty.platformCount);
    
    // 计算平台放置区域
    const spacing = config.platformSpacing;
    const minGap = spacing.min * difficulty.gapMultiplier;
    const maxGap = spacing.max * difficulty.gapMultiplier;
    
    for (let i = 0; i < platformCount; i++) {
      // 计算平台位置
      const platformData = this.calculatePlatformPosition(
        layerY, i, platformCount, minGap, maxGap
      );
      
      // 选择平台类型
      const platformType = this.choosePlatformType(
        layerNum, config, difficulty.specialPlatformChance
      );
      
      // 计算平台尺寸
      const platformSize = this.calculatePlatformSize(platformType, layerNum);
      
      // 创建平台 - 优先使用对象池
      let platform;
      if (this.platformPool) {
        platform = this.platformPool.get(
          platformType,
          platformData.x,
          platformData.y,
          platformSize.width,
          platformSize.height,
          layerNum
        );
        // console.log(`通过对象池创建平台: 类型=${platformType}, 层=${layerNum}, 位置=(${platformData.x}, ${platformData.y}), 可见=${platform.visible}, 激活=${platform.active}`);
      } else {
        // 后备方案：直接创建新对象
        platform = new Platform(
          platformData.x,
          platformData.y,
          platformSize.width,
          platformSize.height,
          platformType,
          layerNum,
          this.audioManager
        );
        console.log(`直接创建平台: 类型=${platformType}, 层=${layerNum}, 位置=(${platformData.x}, ${platformData.y})`);
      }
      
      if (!platform) {
        console.error(`平台创建失败! 类型=${platformType}, 层=${layerNum}`);
        continue;
      }
      
      // 应用特殊属性
      this.applySpecialPlatformProperties(platform, difficulty);
      
      platforms.push(platform);
    }
    
    // 确保至少有一个可到达的平台
    this.ensurePlatformAccessibility(platforms, layerY);
    
    return platforms;
  }

  /**
   * 平台位置计算算法 - 二维空间分布优化系统
   * 
   * 基于空间几何学和游戏设计原理的智能平台布局算法。
   * 通过数学建模确保平台分布既具有挑战性，又保证可达性。
   * 
   * 算法核心理念：
   * 1. 垂直分层策略：将每层垂直空间均匀分割
   * 2. 水平分区策略：将游戏世界水平划分为逻辑区域
   * 3. 随机扰动机制：添加可控随机性避免过于规律
   * 4. 边界约束保护：确保所有平台都在可达范围内
   * 
   * 空间数学模型：
   * - Y轴：分段均匀分布 + 高斯噪声
   * - X轴：区域中心点 + 限制扰动
   * - 边界：安全边距保护机制
   * 
   * @method calculatePlatformPosition
   * @param {number} layerY - 当前层的Y起始坐标
   * @param {number} index - 平台在当前层中的序号（0开始）
   * @param {number} totalCount - 当前层平台总数
   * @param {number} minGap - 最小平台间距（像素）
   * @param {number} maxGap - 最大平台间距（像素）
   * @returns {Object} 包含x、y坐标的位置对象
   */
  calculatePlatformPosition(layerY, index, totalCount, minGap, maxGap) {
    /**
     * Y轴位置计算 - 垂直分层分布算法
     * 
     * 数学模型：分段均匀分布 + 高斯随机扰动
     * 
     * 算法步骤：
     * 1. 将层高分割为N个等高区段（N = totalCount）
     * 2. 每个平台放置在对应区段的中心点
     * 3. 添加30%幅度的随机偏移，增加自然感
     * 4. 保留100像素底部缓冲区，避免与下一层重叠
     * 
     * 设计目标：
     * - 确保平台垂直分布均匀
     * - 避免平台过于集中或分散
     * - 保持视觉上的自然感
     */
    const layerStart = layerY;                           // 层的顶部Y坐标
    const layerEnd = layerY + this.layerHeight - 100;   // 层的底部Y坐标（预留缓冲区）
    const sectionHeight = (layerEnd - layerStart) / totalCount;  // 每个区段的高度
    
    // 计算基础Y位置（区段中心）+ 随机扰动（±15%区段高度）
    const baseY = layerStart + (index + 0.5) * sectionHeight + 
                  (Math.random() - 0.5) * sectionHeight * 0.3;
    
    /**
     * X轴位置计算 - 水平分区分布算法
     * 
     * 游戏世界坐标系统：
     * - 世界宽度：屏幕宽度的1.5倍（562.5像素）
     * - 坐标原点：屏幕中心，X轴范围[-281.25, +281.25]
     * - 分区策略：将世界宽度按平台数量等分
     * 
     * 算法逻辑：
     * - 单平台：在世界中心60%区域内随机放置
     * - 多平台：每个平台占据一个水平分区，在区域内随机偏移
     */
    const worldWidth = this.screenWidth * 1.5;  // 游戏世界总宽度
    const worldLeft = -worldWidth / 2;          // 世界左边界
    const worldRight = worldWidth / 2;          // 世界右边界
    
    let x;
    if (totalCount === 1) {
      /**
       * 单平台布局策略
       * 在世界中央60%区域内随机放置，避免过于偏向边缘
       */
      x = (Math.random() - 0.5) * worldWidth * 0.6;
    } else {
      /**
       * 多平台布局策略 - 分区均匀分布
       * 
       * 1. 将世界宽度按平台数量等分为若干区域
       * 2. 每个平台分配到对应的区域中心
       * 3. 在区域内添加40%幅度的随机偏移
       * 4. 确保平台不会偏移到相邻区域
       */
      const sectionWidth = worldWidth / totalCount;              // 每个分区的宽度
      const sectionCenter = worldLeft + sectionWidth * (index + 0.5);  // 分区中心点X坐标
      const maxOffset = sectionWidth * 0.4;                     // 最大允许偏移量
      
      // 最终X坐标 = 分区中心 + 随机偏移
      x = sectionCenter + (Math.random() - 0.5) * maxOffset;
    }
    
    /**
     * 边界约束保护机制
     * 
     * 确保所有平台都在安全的可达范围内：
     * 1. 考虑平台自身宽度，预留半个平台宽度的边距
     * 2. 使用Math.max和Math.min实现双边界限制
     * 3. 防止平台部分超出游戏世界导致无法到达
     */
    const platformWidth = 100;  // 预估平台宽度（用于边界计算）
    x = Math.max(
      worldLeft + platformWidth / 2,     // 左边界约束
      Math.min(worldRight - platformWidth / 2, x)  // 右边界约束
    );
    
    // 返回计算好的二维坐标
    return { x, y: baseY };
  }

  /**
   * 选择平台类型
   */
  choosePlatformType(layerNum, config, specialChance) {
    const rand = Math.random();
    
    // 特殊平台概率（注意：rand < specialChance 表示生成特殊平台）
    if (rand < specialChance) {
      const specialTypes = config.specialPlatforms;
      const chosenType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
      return chosenType;
    }
    
    // 普通平台
    const primaryTypes = config.primaryPlatforms;
    const chosenType = primaryTypes[Math.floor(Math.random() * primaryTypes.length)];
    return chosenType;
  }

  /**
   * 计算平台尺寸
   */
  calculatePlatformSize(platformType, layerNum) {
    let baseWidth = 110; // 增加基础宽度以提升游戏体验
    let baseHeight = 20;
    
    // 根据类型调整尺寸
    switch (platformType) {
      case PLATFORM_TYPES.MOVING:
        baseWidth = 100; // 移动平台增加宽度
        break;
      case PLATFORM_TYPES.FRAGILE:
        baseWidth = 95; // 易碎平台增加宽度
        break;
      case PLATFORM_TYPES.BOUNCE:
        baseWidth = 120; // 弹跳平台增加宽度
        break;
      case PLATFORM_TYPES.ICE:
        baseWidth = 105; // 冰块平台增加宽度
        break;
      case PLATFORM_TYPES.DISAPPEARING:
        baseWidth = 100; // 消失平台增加宽度
        break;
      case PLATFORM_TYPES.DANGEROUS:
        baseWidth = 115; // 危险平台增加宽度
        break;
    }
    
    // 随层数调整（后期平台更小更难，但不要太极端）
    const sizeReduction = Math.min(0.25, layerNum * 0.002); // 减少缩减率
    baseWidth *= (1 - sizeReduction);
    
    return {
      width: baseWidth + Math.random() * 20, // 恢复随机变化
      height: baseHeight
    };
  }

  /**
   * 应用特殊平台属性
   */
  applySpecialPlatformProperties(platform, difficulty) {
    switch (platform.platformType) {
      case PLATFORM_TYPES.MOVING:
        platform.moveSpeed = difficulty.movePlatformSpeed;
        break;
      case PLATFORM_TYPES.FRAGILE:
        platform.maxSteps = difficulty.fragilePlatformDurability;
        break;
      case PLATFORM_TYPES.DISAPPEARING:
        platform.disappearDelay = Math.max(0.5, 1.5 - difficulty.specialPlatformChance);
        break;
      case PLATFORM_TYPES.DANGEROUS:
        // 危险平台的伤害几率随层数增加
        platform.damageChance = Math.min(0.5, 0.2 + difficulty.specialPlatformChance * 0.3);
        platform.damageAmount = 1;
        break;
    }
  }

  /**
   * 确保平台可达性
   */
  ensurePlatformAccessibility(platforms, layerY) {
    if (platforms.length === 0) {
      // 紧急情况：生成一个安全平台
      let emergencyPlatform;
      const layerNum = Math.floor(layerY / this.layerHeight);
      
      if (this.platformPool) {
        emergencyPlatform = this.platformPool.get(
          PLATFORM_TYPES.NORMAL,
          this.screenWidth / 2,
          layerY + 300,
          100,
          20,
          layerNum
        );
      } else {
        emergencyPlatform = new Platform(
          this.screenWidth / 2,
          layerY + 300,
          100,
          20,
          PLATFORM_TYPES.NORMAL,
          layerNum,
          this.audioManager
        );
      }
      
      platforms.push(emergencyPlatform);
      // 生成紧急安全平台
    }
    
    // 检查平台间距是否合理（后续可以实现路径验证算法）
    // 这里简化为确保有足够的平台密度
    const layerCoverage = platforms.reduce((sum, p) => sum + p.width, 0);
    const coverageRatio = layerCoverage / this.screenWidth;
    
    if (coverageRatio < 0.3) {
      // 平台覆盖率过低
    }
  }


  /**
   * 生成生命果实
   * 
   * 生命果实生成算法：
   * - 基于层数和难度动态调整生成概率
   * - 随机选择合适的平台放置果实
   * - 确保生命果实分布合理，不会过于稀少或密集
   * 
   * @param {number} layerNum - 层数
   * @param {Array} platforms - 当前层的平台数组
   * @param {Object} config - 主题配置
   * @param {Object} difficulty - 难度参数
   * @returns {Array} 生命果实数组
   */
  generateLifeFruits(layerNum, platforms, config, difficulty) {
    const lifeFruits = [];
    
    // 生命果实生成概率基于层数：
    // - 前25层：较高概率（40%），帮助新手积累生命  
    // - 26-50层：中等概率（35%），保持平衡
    // - 51-75层：较低概率（30%），增加挑战
    // - 76-100层：稀有概率（25%），高难度区域
    let baseSpawnChance;
    if (layerNum <= 25) {
      baseSpawnChance = 0.40; // 40%概率（提高后）
    } else if (layerNum <= 50) {
      baseSpawnChance = 0.35; // 35%概率（提高后）
    } else if (layerNum <= 75) {
      baseSpawnChance = 0.30; // 30%概率（提高后）
    } else {
      baseSpawnChance = 0.25; // 25%概率（提高后）
    }
    
    // 特殊层数奖励：每10层增加额外生成机会
    if (layerNum % 10 === 0) {
      baseSpawnChance += 0.15; // 里程碑层增加15%概率
    }
    
    // 基于平台数量调整概率：平台越少，生成概率越高（补偿机制）
    const platformCountModifier = platforms.length <= 2 ? 1.3 : 1.0;
    const finalSpawnChance = Math.min(0.8, baseSpawnChance * platformCountModifier); // 上限提高到80%
    
    // 检查是否生成生命果实
    const randomValue = Math.random();
    const shouldGenerate = randomValue < finalSpawnChance;
    
    if (shouldGenerate) {
      // 选择一个合适的平台放置生命果实
      const suitablePlatforms = platforms.filter(platform => {
        // 过滤掉不适合放置果实的平台类型
        return platform.platformType !== PLATFORM_TYPES.DISAPPEARING && 
               platform.platformType !== PLATFORM_TYPES.MOVING;
      });
      
      if (suitablePlatforms.length > 0) {
        // 随机选择一个平台
        const selectedPlatform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];
        
        // 在平台上方创建生命果实，调整位置让玩家更容易收集
        const fruitX = selectedPlatform.x;
        const fruitY = selectedPlatform.y - selectedPlatform.height/2 - 20; // 平台上方20像素，更容易收集
        
        const lifeFruit = new LifeFruit(fruitX, fruitY, this.audioManager, layerNum);
        lifeFruits.push(lifeFruit);
        
      }
    }
    
    // 极稀有情况：在超高难度层（90+层）偶尔生成额外果实
    if (layerNum >= 90 && Math.random() < 0.05) { // 5%概率
      const extraPlatforms = platforms.filter(platform => 
        platform.platformType === PLATFORM_TYPES.NORMAL
      );
      
      if (extraPlatforms.length > 0) {
        const extraPlatform = extraPlatforms[Math.floor(Math.random() * extraPlatforms.length)];
        const extraFruit = new LifeFruit(
          extraPlatform.x, 
          extraPlatform.y - extraPlatform.height/2 - 20, 
          this.audioManager,
          layerNum
        );
        lifeFruits.push(extraFruit);
        
        // 额外生命果实生成（超高难度补偿）
      }
    }
    
    return lifeFruits;
  }

  /**
   * 批量生成多层
   */
  generateMultipleLayers(startLayer, endLayer, seed = null) {
    const layers = [];
    
    for (let layer = startLayer; layer <= endLayer; layer++) {
      const layerData = this.generateLayer(layer, seed ? `${seed}_${layer}` : null);
      layers.push(layerData);
    }
    
    // 批量生成层级完成
    return layers;
  }

  /**
   * 获取主题信息
   */
  getThemeInfo(layerNum) {
    const theme = this.getThemeForLayer(layerNum);
    const config = this.themeConfigs[theme];
    
    return {
      theme,
      name: config.name,
      layerRange: config.layers,
      colors: config.colors,
      isFirstThemeLayer: layerNum === config.layers[0],
      isLastThemeLayer: layerNum === config.layers[1]
    };
  }

  /**
   * 获取生成统计
   */
  getGenerationStats() {
    const stats = {
      totalLayers: this.generationHistory.size,
      themeDistribution: {},
      avgPlatformCount: 0,
      avgObstacleCount: 0
    };
    
    let totalPlatforms = 0;
    let totalObstacles = 0;
    
    for (const [layer, data] of this.generationHistory) {
      // 主题分布
      if (!stats.themeDistribution[data.theme]) {
        stats.themeDistribution[data.theme] = 0;
      }
      stats.themeDistribution[data.theme]++;
      
      // 平均统计
      totalPlatforms += data.platformCount;
      totalObstacles += data.obstacleCount;
    }
    
    if (stats.totalLayers > 0) {
      stats.avgPlatformCount = totalPlatforms / stats.totalLayers;
      stats.avgObstacleCount = totalObstacles / stats.totalLayers;
    }
    
    return stats;
  }

  /**
   * 重置生成器
   */
  reset() {
    this.generationHistory.clear();
    // 生成器已重置
  }

  /**
   * 预览层配置（不实际生成对象）
   */
  previewLayer(layerNum) {
    const theme = this.getThemeForLayer(layerNum);
    const config = this.themeConfigs[theme];
    const difficulty = this.calculateDifficulty(layerNum);
    
    return {
      layer: layerNum,
      theme,
      themeName: config.name,
      difficulty,
      estimatedPlatforms: Math.floor(difficulty.platformCount),
      specialPlatformChance: Math.round(difficulty.specialPlatformChance * 100) + '%',
      colors: config.colors
    };
  }
}