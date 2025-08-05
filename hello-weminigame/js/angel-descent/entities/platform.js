/**
 * @file platform.js
 * @description 天使下凡一百层游戏平台类
 */

import Sprite from '../core/sprite.js';
import { resourceManager } from '../../runtime/resource-manager.js';

/**
 * 平台类型枚举
 */
export const PLATFORM_TYPES = {
  NORMAL: 'normal',          // 普通平台
  FRAGILE: 'fragile',        // 易碎平台
  MOVING: 'moving',          // 移动平台
  DISAPPEARING: 'disappearing', // 消失平台
  ICE: 'ice',               // 冰块平台（滑溜）
  BOUNCE: 'bounce',         // 弹跳平台
  DANGEROUS: 'dangerous'    // 危险平台（会造成伤害）
};

/**
 * 平台类
 */
export default class Platform extends Sprite {
  constructor(x, y, width = 80, height = 20, type = PLATFORM_TYPES.NORMAL, layer = 1, audioManager = null) {
    super(x, y, width, height);
    
    // 平台属性
    this.platformType = type;
    this.layer = layer;
    this.solid = true;
    this.activated = false; // 是否被激活过
    this.stepCount = 0;     // 被踩踏次数
    
    // 音频管理器引用
    this.audioManager = audioManager;
    
    // 防止重复触发的状态跟踪
    this.lastContactedPlayer = null;
    
    // 物理属性（先初始化默认值）
    this.friction = 1.0; // 摩擦力（影响玩家水平移动）
    this.bounciness = 0; // 弹性（影响玩家垂直反弹）
    
    // 类型特定属性（会覆盖上面的默认值）
    this.initializeTypeProperties();
    
    // 视觉属性
    this.baseColor = '#808080'; // 统一的基础平台颜色（灰色）
    this.color = this.getPlatformTypeColor(type);
    this.edgeColor = this.getPlatformTypeEdgeColor(type);
    this.glowIntensity = 0;
    
    // 动画属性
    this.animationTime = 0;
    this.shakeAmount = 0;
    this.flashTime = 0;
    
    // 缩放属性
    this.scale = { x: 1.0, y: 1.0 };
    
    // 特效动画状态
    this.impactTime = 0;        // 踩踏冲击效果时间
    this.impactIntensity = 0;   // 冲击强度
    this.hoverGlow = 0;         // 悬停发光强度
    this.pulsePhase = 0;        // 脉动相位
    this.trailAlpha = 0;        // 轨迹透明度
    this.crackProgress = 0;     // 裂纹进展（易碎平台）
    this.energyRings = [];      // 能量环数组（弹跳平台）
    this.surfaceShine = 0;      // 表面光泽（冰块平台）
    this.dissolveEffect = 0;    // 溶解效果（消失平台）
    this.spikeAnimation = 0;    // 尖刺动画（危险平台）
    
    // 踩踏冲击波特效系统
    this.shockwaves = [];       // 冲击波数组
    this.maxShockwaves = 3;     // 最大冲击波数量
    
    // 粒子特效系统
    this.particles = [];        // 粒子数组
    
    this.type = 'platform';
    this.addTag('platform');
    
    // 平台创建完成
  }

  /**
   * 初始化类型特定属性
   */
  initializeTypeProperties() {
    switch (this.platformType) {
      case PLATFORM_TYPES.NORMAL:
        this.maxSteps = -1; // 无限耐久
        this.friction = 1.0;
        break;
        
      case PLATFORM_TYPES.FRAGILE:
        this.maxSteps = 3; // 踩3次就碎
        this.friction = 1.0;
        break;
        
      case PLATFORM_TYPES.MOVING:
        this.maxSteps = -1;
        this.friction = 1.0;
        this.moveSpeed = 30; // 移动速度
        this.moveRange = 60; // 移动范围
        this.startX = this.x;
        this.moveDirection = 1;
        break;
        
      case PLATFORM_TYPES.DISAPPEARING:
        this.maxSteps = 1; // 踩一次就消失
        this.disappearDelay = 1.0; // 消失延迟
        this.disappearTimer = 0;
        this.friction = 1.0;
        break;
        
      case PLATFORM_TYPES.ICE:
        this.maxSteps = -1;
        this.friction = 0.3; // 低摩擦力，滑溜
        this.lastFreezeTime = 0; // 上次冰冻时间
        this.freezeCooldown = 3.0; // 冰冻冷却时间（秒）
        break;
        
      case PLATFORM_TYPES.BOUNCE:
        this.maxSteps = -1;
        this.friction = 1.0;
        this.bounciness = 1.5; // 弹跳力度
        break;
        
      case PLATFORM_TYPES.DANGEROUS:
        this.maxSteps = -1;
        this.friction = 1.0;
        this.damageChance = 0.3; // 30%几率造成伤害
        this.damageAmount = 1;
        break;
    }
  }

  /**
   * 根据平台类型获取特定颜色（统一外观设计）
   * 所有平台使用统一的颜色方案，不随主题变化
   */
  getPlatformTypeColor(type) {
    switch (type) {
      case PLATFORM_TYPES.NORMAL:
        return '#808080'; // 灰色，经典平台颜色
        
      case PLATFORM_TYPES.FRAGILE:
        return '#8B4513'; // 棕色，表示易碎
        
      case PLATFORM_TYPES.MOVING:
        return '#FFD700'; // 金色，表示移动
        
      case PLATFORM_TYPES.DISAPPEARING:
        return '#FF69B4'; // 粉红色，表示会消失
        
      case PLATFORM_TYPES.ICE:
        return '#87CEEB'; // 天蓝色，表示冰块
        
      case PLATFORM_TYPES.BOUNCE:
        return '#32CD32'; // 绿色，表示弹跳
        
      case PLATFORM_TYPES.DANGEROUS:
        return '#DC143C'; // 深红色，表示危险
        
      default:
        return '#808080'; // 默认使用标准灰色
    }
  }

  /**
   * 根据平台类型获取边框颜色
   */
  getPlatformTypeEdgeColor(type) {
    switch (type) {
      case PLATFORM_TYPES.NORMAL:
        return '#FFFFFF';
        
      case PLATFORM_TYPES.FRAGILE:
        return '#654321'; // 深棕色边框
        
      case PLATFORM_TYPES.MOVING:
        return '#FFA500'; // 橙色边框
        
      case PLATFORM_TYPES.DISAPPEARING:
        return '#FF1493'; // 深粉红色边框
        
      case PLATFORM_TYPES.ICE:
        return '#4682B4'; // 钢蓝色边框
        
      case PLATFORM_TYPES.BOUNCE:
        return '#228B22'; // 森林绿边框
        
      case PLATFORM_TYPES.DANGEROUS:
        return '#8B0000'; // 暗红色边框
        
      default:
        return '#FFFFFF';
    }
  }

  /**
   * 更新平台逻辑
   */
  update(deltaTime) {
    // 即使平台被销毁，也要继续更新冲击波动画和粒子
    this.updateShockwaves(deltaTime);
    this.updateParticles(deltaTime);
    
    // 如果平台已销毁，只更新冲击波和粒子，跳过其他逻辑
    if (this.destroyed) {
      return;
    }
    
    // 更新动画时间
    this.animationTime += deltaTime;
    
    // 更新类型特定逻辑
    this.updateTypeSpecific(deltaTime);
    
    // 更新视觉效果
    this.updateVisualEffects(deltaTime);
    
    // 调用父类更新
    super.update(deltaTime);
  }
  
  /**
   * 更新冲击波动画（独立方法）
   */
  updateShockwaves(deltaTime) {
    // 冲击波动画更新
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const shockwave = this.shockwaves[i];
      shockwave.life -= deltaTime * 2.5; // 较快消失
      shockwave.radius = shockwave.maxRadius * (1 - shockwave.life);
      shockwave.alpha = shockwave.life * 0.6;
      shockwave.lineWidth = Math.max(1, shockwave.maxLineWidth * shockwave.life);
      
      if (shockwave.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  /**
   * 更新类型特定逻辑
   */
  updateTypeSpecific(deltaTime) {
    switch (this.platformType) {
      case PLATFORM_TYPES.MOVING:
        this.updateMovingPlatform(deltaTime);
        break;
        
      case PLATFORM_TYPES.DISAPPEARING:
        this.updateDisappearingPlatform(deltaTime);
        break;
        
      case PLATFORM_TYPES.ICE:
        this.updateIcePlatform(deltaTime);
        break;
    }
  }

  /**
   * 更新移动平台
   */
  updateMovingPlatform(deltaTime) {
    // 保存旧位置用于生成轨迹
    const oldX = this.x;
    
    // 水平移动
    this.x += this.moveSpeed * this.moveDirection * deltaTime;
    
    // 检查移动边界
    if (this.x <= this.startX - this.moveRange) {
      this.x = this.startX - this.moveRange;
      this.moveDirection = 1;
    } else if (this.x >= this.startX + this.moveRange) {
      this.x = this.startX + this.moveRange;
      this.moveDirection = -1;
    }
    
    // 优化：添加粒子生成间隔控制，显著减少粒子生成频率
    if (!this.lastTrailTime) this.lastTrailTime = 0;
    const currentTime = Date.now();
    
    // 只有在平台明显移动且距离上次生成超过200ms时才生成粒子
    if (Math.abs(this.x - oldX) > 0.1 && 
        (currentTime - this.lastTrailTime) > 200 && 
        Math.random() < 0.2) { // 概率从60%降到20%
      this.createMovingTrailParticles();
      this.lastTrailTime = currentTime;
    }
  }

  /**
   * 更新消失平台
   */
  updateDisappearingPlatform(deltaTime) {
    // 如果倒计时已启动（disappearTimer > 0），开始倒计时
    if (this.disappearTimer > 0) {
      this.disappearTimer -= deltaTime;
      
      // 计算消失进度 (0 = 开始消失, 1 = 完全消失)
      const disappearProgress = 1 - (this.disappearTimer / this.disappearDelay);
      this.dissolveEffect = disappearProgress;
      
      // 闪烁警告效果 - 随着时间加快
      const flashSpeed = 3 + disappearProgress * 5;
      this.flashTime += deltaTime * flashSpeed;
      
      // 增强警告效果
      this.glowIntensity = 0.5 + Math.sin(this.flashTime * 10) * 0.5;
      this.pulsePhase += deltaTime * 8;
      
      if (this.disappearTimer <= 0) {
        // 创建消失特效
        this.createVanishEffect();
        // 消失平台消失
        this.destroy();
      }
    }
  }

  /**
   * 更新冰块平台
   */
  updateIcePlatform(deltaTime) {
    // 冰块发光效果
    this.glowIntensity = 0.3 + Math.sin(this.animationTime * 3) * 0.2;
  }

  /**
   * 更新视觉效果
   */
  updateVisualEffects(deltaTime) {
    // 优化：只更新活跃的视觉效果，减少不必要的计算
    let hasActiveEffects = false;
    
    // 震动效果衰减
    if (this.shakeAmount > 0) {
      this.shakeAmount = Math.max(0, this.shakeAmount - deltaTime * 12); // 加快衰减
      hasActiveEffects = true;
    }
    
    // 闪烁效果衰减
    if (this.flashTime > 0) {
      this.flashTime = Math.max(0, this.flashTime - deltaTime * 4); // 加快衰减
      hasActiveEffects = true;
    }
    
    // 冲击效果更新
    if (this.impactTime > 0) {
      this.impactTime -= deltaTime;
      this.impactIntensity = Math.max(0, this.impactTime / 0.4); // 缩短持续时间
      hasActiveEffects = true;
    }
    
    // 简化缩放恢复（只在真正需要时计算）
    if (this.scale.y < 0.98 || this.scale.x > 1.02) {
      this.scale.y = Math.min(1.0, this.scale.y + deltaTime * 6); // 加快恢复
      this.scale.x = Math.max(1.0, this.scale.x - deltaTime * 3); // 加快恢复
      hasActiveEffects = true;
    } else {
      // 直接重置到1.0，避免微小差异的持续计算
      this.scale.y = 1.0;
      this.scale.x = 1.0;
    }
    
    // 优化：减少能量环动画频率，只保留关键特效
    if (this.energyRings.length > 0) {
      for (let i = this.energyRings.length - 1; i >= 0; i--) {
        const ring = this.energyRings[i];
        ring.life -= deltaTime * 3; // 加快消失速度
        ring.radius = ring.maxRadius * (1 - ring.life);
        ring.alpha = ring.life * 0.6; // 降低透明度
        
        if (ring.life <= 0) {
          this.energyRings.splice(i, 1);
        }
      }
      hasActiveEffects = true;
    }
    
    // 发光效果衰减
    if (this.glowIntensity > 0.05) { // 只有明显发光时才更新
      this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime * 3); // 加快衰减
      hasActiveEffects = true;
    } else {
      this.glowIntensity = 0; // 直接清零
    }
    
    // 优化：简化持续动画，减少计算频率
    if (this.platformType === PLATFORM_TYPES.ICE && hasActiveEffects) {
      this.surfaceShine = (Math.sin(this.animationTime * 1.5) + 1) * 0.3; // 减慢动画
    }
    
    // 减少脉动更新频率
    if (hasActiveEffects) {
      this.pulsePhase += deltaTime * 2; // 减慢脉动
    }
  }

  /**
   * 玩家踩踏平台
   */
  onPlayerStep(player) {
    if (!this.solid || this.destroyed) return false;
    
    // 只有第一次被踩踏才创建冲击波
    const isFirstStep = !this.activated;
    
    this.activated = true;
    this.stepCount++;
    
    // 只在第一次踩踏时创建踩踏效果（包括冲击波）
    if (isFirstStep) {
      this.createStepEffect();
    }
    
    // 处理类型特定效果
    this.handleTypeSpecificStep(player);
    
    return true;
  }

  /**
   * 处理类型特定的踩踏效果
   */
  handleTypeSpecificStep(player) {
    switch (this.platformType) {
      case PLATFORM_TYPES.FRAGILE:
        this.handleFragileStep(player);
        break;
        
      case PLATFORM_TYPES.DISAPPEARING:
        this.handleDisappearingStep(player);
        break;
        
      case PLATFORM_TYPES.BOUNCE:
        this.handleBounceStep(player);
        break;
        
      case PLATFORM_TYPES.ICE:
        this.handleIceStep(player);
        break;
        
      case PLATFORM_TYPES.DANGEROUS:
        this.handleDangerousStep(player);
        break;
    }
  }

  /**
   * 处理易碎平台踩踏
   */
  handleFragileStep(player) {
    // 增强的震动效果
    this.shakeAmount = 6 + this.stepCount * 2;
    this.impactTime = 0.4;
    this.impactIntensity = 0.8;
    
    // 逐渐增加裂纹
    this.crackProgress = Math.min(1.0, this.stepCount / this.maxSteps);
    
    // 检查是否需要破碎
    if (this.stepCount >= this.maxSteps) {
      // 易碎平台破碎时不造成直接伤害，只是消失
      // 玩家需要找到其他平台落脚，如果掉落过深才会触发游戏失败
      this.breakPlatform();
    } else {
      // 改变颜色警告，每次踩踏都变得更红
      const damageRatio = this.stepCount / this.maxSteps;
      const r = Math.floor(139 + (255 - 139) * damageRatio); // 从棕色变红
      const g = Math.floor(69 * (1 - damageRatio));
      const b = Math.floor(19 * (1 - damageRatio));
      this.color = `rgb(${r}, ${g}, ${b})`;
      
      // 强化发光警告
      this.glowIntensity = Math.max(this.glowIntensity, damageRatio * 1.2);
      
      // 闪烁警告
      this.flashTime = 0.5;
    }
  }

  /**
   * 处理消失平台踩踏
   */
  handleDisappearingStep(player) {
    // 消失平台第一次被踩踏时就开始倒计时
    if (this.stepCount === 1 && this.disappearTimer <= 0) {
      // 开始消失倒计时，但不造成伤害
      this.disappearTimer = this.disappearDelay;
      this.flashTime = 0; // 重置闪烁计时器
      
      // 播放消失音效 - 在玩家踩上去时立即播放
      if (this.audioManager) {
        this.audioManager.playPlatformVanish();
      }
      
      // 消失特效
      this.impactTime = 0.4;
      this.impactIntensity = 0.7;
      this.glowIntensity = 1.0;
      this.shakeAmount = 2;  // 轻微震动提示即将消失
      
      // 消失平台只是消失，不直接伤害玩家
      // 玩家需要在平台消失前跳到其他平台
      // 消失平台开始倒计时
    }
  }

  /**
   * 处理弹跳平台踩踏
   */
  handleBounceStep(player) {
    // 安全检查：确保player和velocity存在
    if (!player || !player.velocity) {
      // 玩家对象或velocity属性未定义，跳过弹跳处理
      return;
    }
    
    // 给玩家强力的向上速度
    player.velocity.y = -400 * this.bounciness;
    
    // 玩家不再在地面上（开始弹跳）
    player.onGround = false;
    
    // 增强的弹跳特效
    this.impactTime = 0.6;          // 冲击效果持续时间
    this.impactIntensity = 1.0;     // 最大冲击强度
    this.glowIntensity = 1.5;       // 强烈发光
    this.shakeAmount = 2;           // 轻微震动效果（弹跳时需要）
    
    // 弹性压缩效果（改用动画而不是setTimeout）
    this.scale.y = 0.6;             // 更强的压缩
    this.scale.x = 1.2;             // 水平扩张
    
    // 创建弹跳粒子特效
    this.createBounceParticles();
    
    // 创建能量环效果
    this.energyRings.push({
      radius: 0,
      maxRadius: this.width * 1.5,
      life: 1.0,
      alpha: 0.8
    });
    
    // 如果有多个环，创建延迟环
    setTimeout(() => {
      if (this.energyRings) {
        this.energyRings.push({
          radius: 0,
          maxRadius: this.width * 2.0,
          life: 1.0,
          alpha: 0.6
        });
      }
    }, 100);
  }

  /**
   * 处理冰块平台踩踏
   */
  handleIceStep(player) {
    // 冰块特效增强
    this.impactTime = 0.5;
    this.impactIntensity = 0.4;
    this.surfaceShine = 1.0; // 强化表面光泽
    this.glowIntensity = Math.max(this.glowIntensity, 0.8);
    
    // 创建冰花效果
    this.createIceSparkles();
    
    // 检查冷却时间，防止重复冰冻
    const currentTime = Date.now() / 1000; // 转换为秒
    if (player && player.freeze && (currentTime - this.lastFreezeTime > this.freezeCooldown)) {
      player.freeze(2.0); // 冰冻2秒
      this.lastFreezeTime = currentTime; // 记录冰冻时间
      
      // 冰冻时的视觉效果
      this.shakeAmount = 2;
      this.flashTime = 0.5;
      // 玩家被冰冻
    }
  }

  /**
   * 处理危险平台踩踏
   */
  handleDangerousStep(player) {
    // 危险平台有几率对玩家造成伤害
    if (Math.random() < this.damageChance && player && player.takeDamage) {
      player.takeDamage(this.damageAmount, 'dangerous_platform');
      
      // 创建伤害视觉效果
      this.createDamageEffect();
    }
    
    // 危险平台会发光警告
    this.glowIntensity = Math.max(this.glowIntensity, 0.8);
  }

  /**
   * 创建踩踏效果
   */
  createStepEffect() {
    // 通用踩踏反馈效果 - 只保留很轻微的视觉反馈
    this.impactTime = 0.2;          // 短暂冲击持续时间
    this.impactIntensity = 0.3;     // 很轻微冲击强度
    // this.shakeAmount = 2;        // 移除通用震动
    // this.flashTime = 0.1;        // 移除通用闪烁
    this.glowIntensity = Math.max(this.glowIntensity, 0.2); // 很轻微发光效果
    
    // 创建踩踏冲击波
    this.createShockwave();
  }
  
  /**
   * 创建踩踏冲击波特效
   */
  createShockwave() {
    // 限制最大冲击波数量
    if (this.shockwaves.length >= this.maxShockwaves) {
      this.shockwaves.shift(); // 移除最旧的冲击波
    }
    
    // 根据平台类型设置不同的冲击波颜色和大小
    let color = '#FFFFFF';
    let maxRadius = this.width * 1.5;
    let maxLineWidth = 3;
    
    switch (this.platformType) {
      case PLATFORM_TYPES.NORMAL:
        color = '#FFFFFF'; // 白色 - 普通平台
        maxRadius = this.width * 1.5;
        maxLineWidth = 3;
        break;
      case PLATFORM_TYPES.BOUNCE:
        color = '#00FF00'; // 亮绿色 - 弹跳平台
        maxRadius = this.width * 2.2;
        maxLineWidth = 5;
        break;
      case PLATFORM_TYPES.ICE:
        color = '#00BFFF'; // 深天蓝色 - 冰块平台
        maxRadius = this.width * 1.8;
        maxLineWidth = 4;
        break;
      case PLATFORM_TYPES.DANGEROUS:
        color = '#FF0000'; // 纯红色 - 危险平台
        maxRadius = this.width * 1.6;
        maxLineWidth = 4;
        break;
      case PLATFORM_TYPES.FRAGILE:
        color = '#FF6600'; // 更亮的橙红色 - 易碎平台
        maxRadius = this.width * 1.6; // 增大半径
        maxLineWidth = 3; // 增加线宽
        break;
      case PLATFORM_TYPES.DISAPPEARING:
        color = '#FF69B4'; // 亮粉色 - 消失平台
        maxRadius = this.width * 1.7;
        maxLineWidth = 3;
        break;
      case PLATFORM_TYPES.MOVING:
        color = '#FFFF00'; // 纯黄色 - 移动平台
        maxRadius = this.width * 1.6;
        maxLineWidth = 3;
        break;
      default:
        color = '#FFD700'; // 金色 - 默认未知平台
        maxRadius = this.width * 1.5;
        maxLineWidth = 3;
        break;
    }
    
    // 创建新冲击波
    const shockwave = {
      x: this.x,
      y: this.y,
      radius: 0,
      maxRadius: maxRadius + Math.random() * 20, // 添加随机变化
      life: 1.0,
      alpha: 0.8,
      color: color,
      lineWidth: maxLineWidth,
      maxLineWidth: maxLineWidth
    };
    
    this.shockwaves.push(shockwave);
  }

  /**
   * 创建冰花效果
   */
  createIceSparkles() {
    // 冰花粒子效果
  }

  /**
   * 创建伤害效果
   */
  createDamageEffect() {
    // 设置红色闪烁效果
    this.flashTime = 0.5;
    this.shakeAmount = 8;
  }

  /**
   * 破碎平台
   */
  breakPlatform() {
    // 创建破碎效果
    this.createBreakEffect();
    
    // 销毁平台
    this.destroy();
  }

  /**
   * 创建破碎效果
   */
  createBreakEffect() {
    // 播放破碎音效
    if (this.audioManager) {
      this.audioManager.playPlatformBreak();
    }
    
    // 创建破碎粒子效果
    this.createBreakParticles();
  }

  /**
   * 创建消失特效
   */
  createVanishEffect() {
    // 播放消失音效
    if (this.audioManager) {
      this.audioManager.playPlatformVanish();
    }
    
    // 创建消失粒子效果
    this.createVanishParticles();
  }

  /**
   * 创建消失粒子特效
   */
  createVanishParticles() {
    // 确保particles数组存在
    if (!this.particles) {
      this.particles = [];
    }

    // 优化：减少闪光星尘粒子从12个到8个，减少33%的粒子生成
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
      const speed = 40 + Math.random() * 60;
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: Math.cos(angle) * speed * 0.3, // 较慢的水平扩散
        vy: Math.sin(angle) * speed - Math.abs(Math.cos(angle)) * 80, // 向上飘散
        size: 2 + Math.random() * 3,
        life: 2.0 + Math.random() * 1.0,
        maxLife: 2.0 + Math.random() * 1.0,
        color: Math.random() < 0.7 ? '#FF69B4' : '#FFB6C1', // 70%深粉，30%浅粉
        type: 'vanish_sparkle'
      };
      this.particles.push(particle);
    }
    
    // 优化：减少魔法光点从8个到5个，减少37%的粒子生成
    for (let i = 0; i < 5; i++) {
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: (Math.random() - 0.5) * 20,
        vy: -30 - Math.random() * 50, // 向上浮起
        size: 3 + Math.random() * 4,
        life: 1.8 + Math.random() * 0.8,
        maxLife: 1.8 + Math.random() * 0.8,
        color: '#FFFFFF', // 纯白光点
        type: 'vanish_light'
      };
      this.particles.push(particle);
    }
    
    // 创建消散涟漪效果
    for (let i = 0; i < 3; i++) {
      const particle = {
        x: this.x,
        y: this.y,
        vx: 0,
        vy: 0,
        size: 5 + i * 8, // 不同大小的涟漪
        life: 1.5 + i * 0.3,
        maxLife: 1.5 + i * 0.3,
        color: '#FF69B4',
        type: 'vanish_ripple',
        radius: 10 + i * 15, // 涟漪半径
        expandSpeed: 60 + i * 20 // 扩展速度
      };
      this.particles.push(particle);
    }
  }

  /**
   * 创建弹跳能量粒子特效
   */
  createBounceParticles() {
    // 确保particles数组存在
    if (!this.particles) {
      this.particles = [];
    }

    // 创建能量爆发粒子（向上抛射）
    for (let i = 0; i < 15; i++) {
      const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.8; // 主要向上，略有扩散
      const speed = 120 + Math.random() * 100;
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y - this.height/2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        life: 1.2 + Math.random() * 0.6,
        maxLife: 1.2 + Math.random() * 0.6,
        color: Math.random() < 0.7 ? '#32CD32' : '#00FF00', // 70%中绿，30%亮绿
        type: 'bounce_energy'
      };
      this.particles.push(particle);
    }
    
    // 创建能量脉冲粒子（向四周扩散）
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 80 + Math.random() * 60;
      const particle = {
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.5, // 减少垂直速度
        size: 3 + Math.random() * 2,
        life: 1.0 + Math.random() * 0.5,
        maxLife: 1.0 + Math.random() * 0.5,
        color: '#00FF00', // 亮绿色能量
        type: 'bounce_pulse'
      };
      this.particles.push(particle);
    }
    
    // 创建闪电效果粒子
    for (let i = 0; i < 8; i++) {
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width * 1.5,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: (Math.random() - 0.5) * 30,
        vy: -60 - Math.random() * 40, // 向上移动
        size: 1 + Math.random() * 2,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
        color: '#FFFFFF', // 白色闪电
        type: 'bounce_spark'
      };
      this.particles.push(particle);
    }
  }

  /**
   * 创建移动平台轨迹粒子特效
   */
  createMovingTrailParticles() {
    // 确保particles数组存在
    if (!this.particles) {
      this.particles = [];
    }

    // 优化：减少能量尾迹粒子从3个到2个，减少33%的粒子生成
    for (let i = 0; i < 2; i++) {
      const offsetX = -this.moveDirection * (this.width/2 + 5 + i * 3); // 在平台后方
      const particle = {
        x: this.x + offsetX + (Math.random() - 0.5) * 8,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: -this.moveDirection * (10 + Math.random() * 15), // 向相反方向飘移
        vy: (Math.random() - 0.5) * 20,
        size: 2 + Math.random() * 2,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
        color: Math.random() < 0.7 ? '#FFD700' : '#FFFF00', // 70%金色，30%黄色
        type: 'trail_energy'
      };
      this.particles.push(particle);
    }
    
    // 优化：降低推进光点生成概率从40%到25%，减少37%的粒子频率
    if (Math.random() < 0.25) { // 25%概率产生
      const particle = {
        x: this.x + this.moveDirection * this.width/2,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: this.moveDirection * (20 + Math.random() * 15),
        vy: (Math.random() - 0.5) * 30,
        size: 1 + Math.random() * 2,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.6 + Math.random() * 0.3,
        color: '#FFFFFF', // 白色推进光点
        type: 'trail_thrust'
      };
      this.particles.push(particle);
    }
    
    // 优化：降低电弧效果生成概率从20%到12%，减少40%的粒子频率
    if (Math.random() < 0.12) { // 12%概率产生
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y - this.height/2 - 2,
        vx: (Math.random() - 0.5) * 40,
        vy: -10 - Math.random() * 20,
        size: 1,
        life: 0.5 + Math.random() * 0.2,
        maxLife: 0.5 + Math.random() * 0.2,
        color: '#00FFFF', // 青色电弧
        type: 'trail_arc'
      };
      this.particles.push(particle);
    }
  }

  /**
   * 更新粒子系统
   * @param {number} deltaTime - 时间间隔
   */
  updateParticles(deltaTime) {
    if (!this.particles) return;
    
    // 更新粒子状态
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // 应用重力（只对破碎粒子）
      if (particle.type && particle.type.startsWith('break_')) {
        particle.vy += 300 * deltaTime; // 重力加速度
      }
      // 消失粒子特殊物理行为
      else if (particle.type && particle.type.startsWith('vanish_')) {
        if (particle.type === 'vanish_ripple') {
          // 涟漪扩展
          particle.radius += particle.expandSpeed * deltaTime;
        } else {
          // 消失粒子轻微向上飘
          particle.vy -= 20 * deltaTime; // 反重力效果
        }
      }
      // 弹跳粒子特殊物理行为
      else if (particle.type && particle.type.startsWith('bounce_')) {
        if (particle.type === 'bounce_energy' || particle.type === 'bounce_pulse') {
          // 弹跳能量粒子应用重力但较轻
          particle.vy += 200 * deltaTime; // 较轻的重力
        } else if (particle.type === 'bounce_spark') {
          // 闪电粒子不受重力影响，保持向上运动
          particle.vy -= 10 * deltaTime; // 轻微减速但继续向上
        }
      }
      // 移动轨迹粒子特殊物理行为
      else if (particle.type && particle.type.startsWith('trail_')) {
        if (particle.type === 'trail_energy') {
          // 轨迹能量粒子轻微向上飘并减速
          particle.vy -= 15 * deltaTime; // 轻微上升
          particle.vx *= 0.95; // 水平减速
        } else if (particle.type === 'trail_thrust') {
          // 推进粒子保持运动方向
          particle.vy -= 5 * deltaTime; // 轻微上升
        } else if (particle.type === 'trail_arc') {
          // 电弧粒子不受重力影响
          particle.vy -= 5 * deltaTime; // 继续向上
        }
      }
      
      // 更新位置
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // 更新生命值
      particle.life -= deltaTime;
      particle.alpha = Math.max(0, particle.life / particle.maxLife);
      
      // 应用阻力
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      // 移除死亡粒子
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * 创建破碎粒子特效
   */
  createBreakParticles() {
    // 确保particles数组存在
    if (!this.particles) {
      this.particles = [];
    }

    // 创建大块碎片粒子（木屑效果）
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
      const speed = 100 + Math.random() * 80;
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50, // 轻微向上抛射
        size: 3 + Math.random() * 4,
        life: 1.5 + Math.random() * 0.8,
        maxLife: 1.5 + Math.random() * 0.8,
        color: '#8B4513', // 棕色木屑
        type: 'break_chunk'
      };
      this.particles.push(particle);
    }
    
    // 创建小块碎屑粒子
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: 1 + Math.random() * 2,
        life: 1.0 + Math.random() * 0.6,
        maxLife: 1.0 + Math.random() * 0.6,
        color: Math.random() < 0.6 ? '#D2691E' : '#CD853F', // 60%深棕，40%浅棕
        type: 'break_debris'
      };
      this.particles.push(particle);
    }
    
    // 创建灰尘云效果
    for (let i = 0; i < 6; i++) {
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width * 1.2,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 30,
        size: 4 + Math.random() * 6,
        life: 2.0 + Math.random() * 1.0,
        maxLife: 2.0 + Math.random() * 1.0,
        color: '#A0A0A0', // 灰色灰尘
        type: 'break_dust'
      };
      this.particles.push(particle);
    }
  }

  /**
   * 检查与玩家的碰撞
   */
  checkCollisionWithPlayer(player) {
    if (!this.solid || this.destroyed) return false;
    
    // AABB碰撞检测 - 使用Player的精确脚步碰撞盒而不是整体尺寸
    const playerLeft = player.x + player.collisionBox.x;
    const playerRight = player.x + player.collisionBox.x + player.collisionBox.width;
    const playerTop = player.y + player.collisionBox.y;
    const playerBottom = player.y + player.collisionBox.y + player.collisionBox.height;
    
    // 使用视觉宽度进行碰撞检测，与渲染效果保持一致
    const visualWidth = this.width * 1.4;
    const platformLeft = this.x - visualWidth/2;
    const platformRight = this.x + visualWidth/2;
    const platformTop = this.y - this.height/2;
    const platformBottom = this.y + this.height/2;
    
    // 检查重叠
    const overlapping = playerRight > platformLeft && 
                       playerLeft < platformRight && 
                       playerBottom > platformTop && 
                       playerTop < platformBottom;
    
    // 改进的着陆检测逻辑
    // 1. 玩家必须正在向下移动
    // 2. 玩家从上方接触平台（避免从侧面或下方触发）
    // 3. 确保是首次接触这个平台
    const isMovingDown = player.velocity.y > 0;
    const isFallingFromAbove = player.y < this.y; // 玩家中心点在平台中心点上方
    const isFirstContact = this.lastContactedPlayer !== player;
    
    // 只有满足所有着陆条件时才认为是有效碰撞
    if (overlapping && isMovingDown && isFallingFromAbove && isFirstContact) {
      this.lastContactedPlayer = player;
      // 设置一个短暂的标记，防止同一帧内重复触发
      this.lastContactFrame = player.totalDistance || Date.now();
      return true;
    }
    
    // 改进的接触状态重置逻辑
    // 当玩家明显离开平台时（Y坐标差距较大或不再重叠）才重置
    const playerFarFromPlatform = !overlapping || Math.abs(player.y - this.y) > 50;
    if (playerFarFromPlatform) {
      this.lastContactedPlayer = null;
      this.lastContactFrame = null;
    }
    
    return false;
  }

  /**
   * 混合两种颜色
   */
  mixColors(color1, color2, ratio) {
    // 简单的颜色混合实现
    return color1; // 暂时返回原色，后续可以实现真正的颜色混合
  }

  /**
   * 获取摩擦力
   */
  getFriction() {
    return this.friction;
  }

  /**
   * 获取弹性
   */
  getBounciness() {
    return this.bounciness;
  }

  /**
   * 渲染平台
   */
  render(ctx) {
    // 即使平台被销毁，也要继续渲染冲击波和粒子（如果存在）
    if (this.shockwaves.length > 0) {
      this.renderShockwaves(ctx, 0, 0);
    }
    if (this.particles && this.particles.length > 0) {
      this.renderParticles(ctx);
    }
    
    if (!this.visible || this.destroyed) return;
    
    // 应用震动效果
    let offsetX = 0, offsetY = 0;
    if (this.shakeAmount > 0) {
      offsetX = (Math.random() - 0.5) * this.shakeAmount;
      offsetY = (Math.random() - 0.5) * this.shakeAmount;
    }
    
    // 应用闪烁效果
    if (this.flashTime > 0 && Math.floor(this.flashTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    
    // 绘制平台主体
    const halfWidth = this.width * this.anchor.x;
    const halfHeight = this.height * this.anchor.y;
    
    // 应用缩放效果
    const scaledWidth = this.width * this.scale.x;
    const scaledHeight = this.height * this.scale.y;
    const scaledHalfWidth = scaledWidth * this.anchor.x;
    const scaledHalfHeight = scaledHeight * this.anchor.y;
    
    // 计算绘制位置
    const drawX = this.x - scaledHalfWidth + offsetX;
    const drawY = this.y - scaledHalfHeight + offsetY;
    
    // 尝试使用图像渲染
    const platformImage = resourceManager.getPlatformByType(this.platformType);
    if (platformImage && platformImage.complete) {
      // 图像渲染 - 调整为更厚的显示效果但保持碰撞体积不变
      const imageWidthScale = 1.4; // 水平稍微放大
      const imageHeightScale = 1.2; // 垂直放大，显示更厚
      const imageWidth = scaledWidth * imageWidthScale;
      const imageHeight = scaledHeight * imageHeightScale;
      
      // 水平居中，垂直居中对齐
      const imageX = drawX - (imageWidth - scaledWidth) / 2;
      const imageY = drawY - (imageHeight - scaledHeight) / 2;
      
      ctx.drawImage(
        platformImage,
        imageX,
        imageY,
        imageWidth,
        imageHeight
      );
      
      // 为特殊平台类型添加颜色覆盖
      this.applyColorOverlay(ctx, imageX, imageY, imageWidth, imageHeight);
    } else {
      // 回退到纯色渲染
      ctx.fillStyle = this.color;
      ctx.fillRect(drawX, drawY, scaledWidth, scaledHeight);
      
      // 绘制边框
      ctx.strokeStyle = this.edgeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, drawY, scaledWidth, scaledHeight);
    }
    
    // 绘制类型特有的装饰
    this.renderTypeSpecificDecorations(ctx, offsetX, offsetY);
    
    // 重置效果
    ctx.globalAlpha = 1;
  }

  /**
   * 为特殊平台类型应用颜色覆盖
   */
  applyColorOverlay(ctx, imageX, imageY, imageWidth, imageHeight) {
    switch (this.platformType) {
      case PLATFORM_TYPES.DISAPPEARING:
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#FF0080'; // 极其鲜艳的粉色 (Magenta/Hot Pink)
        ctx.globalAlpha = 0.8;
        ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
        ctx.restore();
        break;
        
      case PLATFORM_TYPES.MOVING:
        // 金色平台：使用多层渲染强制覆盖灰色
        ctx.save();
        
        // 第一层：白色打底，提亮底色
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
        
        // 第二层：金色覆盖
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = '#FFD700';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
        
        // 第三层：再次金色加强
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = '#FFA500';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
        
        ctx.restore();
        break;
        
      default:
        return; // 其他类型不需要颜色覆盖
    }
  }

  /**
   * 渲染类型特有的装饰
   */
  renderTypeSpecificDecorations(ctx, offsetX, offsetY) {
    // 应用缩放效果
    const scaledWidth = this.width * this.scale.x;
    const scaledHeight = this.height * this.scale.y;
    const scaledHalfWidth = scaledWidth * this.anchor.x;
    const scaledHalfHeight = scaledHeight * this.anchor.y;
    const x = this.x - scaledHalfWidth + offsetX;
    const y = this.y - scaledHalfHeight + offsetY;
    
    switch (this.platformType) {
      case PLATFORM_TYPES.FRAGILE:
        // 增强的裂纹渲染
        if (this.crackProgress > 0) {
          const crackAlpha = 0.6 + this.impactIntensity * 0.4;
          const crackWidth = 2 + this.impactIntensity * 3;
          
          ctx.save();
          ctx.strokeStyle = `rgba(139, 0, 0, ${crackAlpha})`;
          ctx.lineWidth = crackWidth;
          
          // 主裂纹 - 动态生长
          const mainCrackProgress = Math.min(1, this.crackProgress * 3);
          if (mainCrackProgress > 0) {
            ctx.beginPath();
            const endY = y + scaledHeight * mainCrackProgress;
            ctx.moveTo(x + scaledWidth/4, y);
            ctx.lineTo(x + scaledWidth*3/4, endY);
            ctx.stroke();
          }
          
          // 第二条裂纹
          const secondCrackProgress = Math.max(0, (this.crackProgress - 0.33) * 3);
          if (secondCrackProgress > 0) {
            ctx.beginPath();
            const endY = y + scaledHeight * secondCrackProgress;
            ctx.moveTo(x + scaledWidth*3/4, y);
            ctx.lineTo(x + scaledWidth/4, endY);
            ctx.stroke();
          }
          
          // 第三条裂纹 - 垂直
          const thirdCrackProgress = Math.max(0, (this.crackProgress - 0.66) * 3);
          if (thirdCrackProgress > 0) {
            ctx.beginPath();
            const endY = y + scaledHeight * thirdCrackProgress;
            ctx.moveTo(x + scaledWidth/2, y);
            ctx.lineTo(x + scaledWidth/2, endY);
            ctx.stroke();
          }
          
          ctx.restore();
          
          // 碎片效果 - 在即将破碎时
          if (this.crackProgress > 0.8 && this.impactIntensity > 0) {
            ctx.save();
            for (let i = 0; i < 5; i++) {
              const debrisX = x + Math.random() * scaledWidth;
              const debrisY = y + Math.random() * scaledHeight;
              const debrisSize = 2 + Math.random() * 3;
              
              ctx.fillStyle = `rgba(139, 69, 19, ${this.impactIntensity})`;
              ctx.fillRect(
                debrisX - debrisSize/2, 
                debrisY - debrisSize/2, 
                debrisSize, 
                debrisSize
              );
            }
            ctx.restore();
          }
        }
        break;
        
      case PLATFORM_TYPES.ICE:
        // 动态表面光泽效果
        const shineIntensity = this.surfaceShine * (0.3 + this.impactIntensity * 0.7);
        const shineOffset = (this.animationTime * 50) % (scaledWidth + 20) - 10;
        
        // 移动的光泽条纹
        const gradient = ctx.createLinearGradient(x + shineOffset - 10, y, x + shineOffset + 10, y);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${shineIntensity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x + shineOffset - 10, y, 20, scaledHeight);
        
        // 增强的边缘冰霜效果
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + this.glowIntensity * 0.4})`;
        ctx.fillRect(x + 2, y + 2, scaledWidth - 4, 2);
        ctx.fillRect(x + 2, y + scaledHeight - 4, scaledWidth - 4, 2);
        
        // 边缘结霜 - 锯齿状效果
        ctx.fillStyle = `rgba(240, 248, 255, ${0.8 + this.impactIntensity * 0.2})`;
        for (let i = 0; i < scaledWidth; i += 8) {
          const frostHeight = 2 + Math.sin(i * 0.5 + this.animationTime * 3) * 1;
          // 顶部结霜
          ctx.fillRect(x + i, y - 1, 3, frostHeight);
          // 底部结霜
          ctx.fillRect(x + i, y + scaledHeight - frostHeight + 1, 3, frostHeight);
        }
        
        // 增强的冰晶装饰
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + this.impactIntensity * 0.2})`;
        for (let i = 0; i < 3; i++) {
          const crystalX = x + (i + 1) * scaledWidth / 4;
          const crystalY = y + scaledHeight / 2;
          const crystalSize = 1 + this.impactIntensity * 1;
          
          // 主冰晶
          ctx.fillRect(crystalX - crystalSize, crystalY - crystalSize * 2, crystalSize * 2, crystalSize * 4);
          ctx.fillRect(crystalX - crystalSize * 2, crystalY - crystalSize, crystalSize * 4, crystalSize * 2);
          
          // 小装饰点
          ctx.fillRect(crystalX - 0.5, crystalY - 4, 1, 1);
          ctx.fillRect(crystalX - 0.5, crystalY + 4, 1, 1);
        }
        
        // 冰花粒子效果（踩踏时）
        if (this.impactIntensity > 0) {
          ctx.fillStyle = `rgba(173, 216, 230, ${this.impactIntensity})`;
          for (let i = 0; i < 8; i++) {
            const sparkleX = x + Math.random() * scaledWidth;
            const sparkleY = y + Math.random() * scaledHeight;
            const sparkleSize = 1 + Math.random() * 2;
            ctx.fillRect(sparkleX, sparkleY, sparkleSize, sparkleSize);
          }
        }
        break;
        
      case PLATFORM_TYPES.BOUNCE:
        // 绘制能量环效果
        for (const ring of this.energyRings) {
          ctx.strokeStyle = `rgba(0, 255, 100, ${ring.alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // 增强的弹簧图案
        const springGlow = 0.5 + this.impactIntensity * 0.5;
        ctx.strokeStyle = `rgba(255, 215, 0, ${springGlow})`;
        ctx.lineWidth = 3 + this.impactIntensity * 2;
        ctx.beginPath();
        
        // 弹簧螺旋效果（带动画）
        for (let i = 0; i < 4; i++) {
          const springX = x + (i + 1) * scaledWidth / 5;
          const segments = 6;
          let lastY = y + 3;
          
          ctx.moveTo(springX, lastY);
          for (let j = 1; j < segments; j++) {
            const segmentY = y + 3 + (j * (scaledHeight - 6) / segments);
            const zigzag = (j % 2 === 0) ? -3 : 3;
            const animatedZigzag = zigzag * (1 + this.impactIntensity * 0.5);
            ctx.lineTo(springX + animatedZigzag, segmentY);
          }
          ctx.lineTo(springX, y + scaledHeight - 3);
        }
        ctx.stroke();
        
        // 底部波纹效果
        if (this.impactIntensity > 0) {
          const waveHeight = 6 * this.impactIntensity;
          const waveFreq = 8;
          ctx.strokeStyle = `rgba(0, 255, 100, ${this.impactIntensity * 0.6})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y + scaledHeight + 5);
          
          for (let px = 0; px <= scaledWidth; px += 2) {
            const waveY = y + scaledHeight + 5 + Math.sin((px / scaledWidth) * Math.PI * waveFreq) * waveHeight;
            ctx.lineTo(x + px, waveY);
          }
          ctx.stroke();
        }
        break;
        
      case PLATFORM_TYPES.MOVING:
        // 绘制方向箭头和移动轨迹
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        
        const arrowSize = 4;
        const arrowY = y + scaledHeight / 2;
        
        if (this.moveDirection > 0) {
          // 右箭头
          ctx.moveTo(x + scaledWidth - 8, arrowY);
          ctx.lineTo(x + scaledWidth - 8 - arrowSize, arrowY - arrowSize);
          ctx.lineTo(x + scaledWidth - 8 - arrowSize, arrowY + arrowSize);
        } else {
          // 左箭头
          ctx.moveTo(x + 8, arrowY);
          ctx.lineTo(x + 8 + arrowSize, arrowY - arrowSize);
          ctx.lineTo(x + 8 + arrowSize, arrowY + arrowSize);
        }
        ctx.fill();
        
        // 绘制移动轨迹指示
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y + scaledHeight + 5);
        ctx.lineTo(x + scaledWidth, y + scaledHeight + 5);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
        
      case PLATFORM_TYPES.DISAPPEARING:
        // 高级溶解效果
        if (this.disappearTimer > 0) {
          const warningIntensity = this.dissolveEffect;
          
          // 边缘溶解效果已移除 - 避免红色视觉干扰
          
          // 消失粒子效果和虚线边框已移除 - 避免红色视觉干扰
        }
        break;
        
      case PLATFORM_TYPES.DANGEROUS:
        // 使用视觉尺寸进行特效绘制，与图像渲染保持一致
        const visualWidth = scaledWidth * 1.4;
        const visualHeight = scaledHeight * 1.2;
        const visualX = x - (visualWidth - scaledWidth) / 2;
        const visualY = y - (visualHeight - scaledHeight) / 2;
        
        // 绘制增强的尖刺装饰
        const spikeAnimation = Math.sin(this.animationTime * 6) * 0.3; // 温和的动画幅度
        
        // 主要尖刺（从平台表面朝上）- 更大更明显
        ctx.fillStyle = '#FF0000'; // 更鲜艳的红色
        ctx.strokeStyle = '#8B0000'; // 深红色边框
        ctx.lineWidth = 3; // 更粗的边框
        
        for (let i = 0; i < Math.floor(visualWidth / 10); i++) { // 更密集的尖刺
          const spikeX = visualX + 6 + i * 10;
          const spikeHeight = 15 + spikeAnimation * 3; // 适度的尖刺高度变化
          ctx.beginPath();
          ctx.moveTo(spikeX, visualY);
          ctx.lineTo(spikeX - 7, visualY + spikeHeight); // 更宽的底部
          ctx.lineTo(spikeX + 7, visualY + spikeHeight);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        
        // 危险警告标记
        ctx.fillStyle = '#FFFF00';
        ctx.strokeStyle = '#FF5722'; // 一致的警告色
        ctx.lineWidth = 3;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        
        // 绘制带边框的警告符号，使其更明显
        const warningY = visualY + visualHeight/2 + 6;
        ctx.strokeText('⚠', visualX + visualWidth/2, warningY);
        ctx.fillText('⚠', visualX + visualWidth/2, warningY);
        
        break;
    }
  }
  
  /**
   * 渲染冲击波特效
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} offsetX - X轴偏移
   * @param {number} offsetY - Y轴偏移
   */
  renderShockwaves(ctx, offsetX = 0, offsetY = 0) {
    if (this.shockwaves.length === 0) return;
    
    ctx.save();
    
    for (const shockwave of this.shockwaves) {
      // 设置透明度
      ctx.globalAlpha = shockwave.alpha;
      
      // 设置冲击波样式
      ctx.strokeStyle = shockwave.color;
      ctx.lineWidth = shockwave.lineWidth;
      ctx.lineCap = 'round';
      
      // 增强发光效果，根据平台类型调整发光强度
      
      // 为特殊平台类型添加额外的发光强度
      if (shockwave.color === '#FF0000' || // 危险平台
          shockwave.color === '#00FF00' || // 弹跳平台
          shockwave.color === '#00BFFF') { // 冰块平台
      }
      
      // 绘制冲击波圆环
      ctx.beginPath();
      ctx.arc(
        shockwave.x + offsetX, 
        shockwave.y + offsetY, 
        shockwave.radius, 
        0, 
        Math.PI * 2
      );
      ctx.stroke();
      
      // 绘制多层次冲击波效果
      if (shockwave.life > 0.5) {
        // 内层冲击波
        ctx.globalAlpha = shockwave.alpha * 0.6;
        ctx.lineWidth = Math.max(1, shockwave.lineWidth * 0.7);
        ctx.beginPath();
        ctx.arc(
          shockwave.x + offsetX, 
          shockwave.y + offsetY, 
          shockwave.radius * 0.6, 
          0, 
          Math.PI * 2
        );
        ctx.stroke();
        
        // 核心亮环
        ctx.globalAlpha = shockwave.alpha * 0.8;
        ctx.lineWidth = Math.max(1, shockwave.lineWidth * 0.3);
        ctx.beginPath();
        ctx.arc(
          shockwave.x + offsetX, 
          shockwave.y + offsetY, 
          shockwave.radius * 0.3, 
          0, 
          Math.PI * 2
        );
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }

  /**
   * 渲染粒子特效
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderParticles(ctx) {
    if (!this.particles || this.particles.length === 0) return;
    
    ctx.save();
    
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.alpha || (particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      
      const size = particle.size || 2;
      const halfSize = size / 2;
      
      // 根据粒子类型应用不同的渲染效果
      if (particle.type === 'break_chunk') {
        // 大块碎片 - 添加轻微发光
        ctx.fillRect(particle.x - halfSize, particle.y - halfSize, size, size);
      } else if (particle.type === 'break_debris') {
        // 小碎屑 - 基本渲染
        ctx.fillRect(particle.x - halfSize, particle.y - halfSize, size, size);
      } else if (particle.type === 'break_dust') {
        // 灰尘云 - 圆形渲染，强烈发光
        ctx.globalAlpha = particle.alpha * 0.6; // 更透明
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, halfSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'vanish_sparkle') {
        // 消失闪光星尘 - 强烈发光的菱形
        ctx.globalAlpha = particle.alpha * 0.8;
        // 绘制菱形
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(Date.now() * 0.005); // 旋转效果
        ctx.fillRect(-halfSize, -halfSize, size, size);
        ctx.restore();
      } else if (particle.type === 'vanish_light') {
        // 消失光点 - 超强发光的圆形
        ctx.globalAlpha = particle.alpha;
        ctx.globalCompositeOperation = 'screen'; // 屏幕混合模式增强发光
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, halfSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; // 重置混合模式
      } else if (particle.type === 'vanish_ripple') {
        // 消失涟漪 - 扩散的圆环
        ctx.globalAlpha = particle.alpha * 0.4;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (particle.type === 'bounce_energy') {
        // 弹跳能量粒子 - 强烈发光的圆形
        ctx.globalAlpha = particle.alpha * 0.9;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, halfSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'bounce_pulse') {
        // 弹跳脉冲粒子 - 菱形带发光
        ctx.globalAlpha = particle.alpha;
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(Date.now() * 0.01); // 更快旋转
        ctx.fillRect(-halfSize, -halfSize, size, size);
        ctx.restore();
      } else if (particle.type === 'bounce_spark') {
        // 弹跳闪电粒子 - 强烈闪烁的线条
        ctx.globalAlpha = particle.alpha * (0.7 + 0.3 * Math.sin(Date.now() * 0.02)); // 闪烁效果
        ctx.globalCompositeOperation = 'screen'; // 屏幕混合模式
        // 绘制为短线条而不是方块
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x - halfSize, particle.y);
        ctx.lineTo(particle.x + halfSize, particle.y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over'; // 重置混合模式
      } else if (particle.type === 'trail_energy') {
        // 移动轨迹能量粒子 - 带拖尾的圆形
        ctx.globalAlpha = particle.alpha * 0.8;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, halfSize, 0, Math.PI * 2);
        ctx.fill();
        // 添加拖尾效果
        ctx.globalAlpha = particle.alpha * 0.3;
        ctx.fillRect(particle.x - size, particle.y - halfSize/2, size * 2, halfSize);
      } else if (particle.type === 'trail_thrust') {
        // 推进光点 - 强烈发光的小点
        ctx.globalAlpha = particle.alpha;
        ctx.globalCompositeOperation = 'screen'; // 屏幕混合模式
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, halfSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; // 重置混合模式
      } else if (particle.type === 'trail_arc') {
        // 电弧粒子 - 闪烁的锯齿线
        ctx.globalAlpha = particle.alpha * (0.6 + 0.4 * Math.sin(Date.now() * 0.03)); // 闪烁
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // 绘制锯齿形状
        const zigzagWidth = size * 2;
        ctx.moveTo(particle.x - zigzagWidth, particle.y);
        ctx.lineTo(particle.x, particle.y - zigzagWidth/2);
        ctx.lineTo(particle.x + zigzagWidth, particle.y);
        ctx.stroke();
      }
      
    }
    
    ctx.restore();
  }

  /**
   * 获取平台信息
   */
  getInfo() {
    return {
      type: this.platformType,
      layer: this.layer,
      stepCount: this.stepCount,
      maxSteps: this.maxSteps,
      solid: this.solid,
      activated: this.activated,
      friction: this.friction,
      bounciness: this.bounciness
    };
  }

  /**
   * 重置平台状态以供对象池复用
   * 
   * 重置所有平台特定的状态和属性，确保对象可以安全复用。
   * 继承自Sprite的基础重置方法，并添加平台特有的状态重置。
   */
  reset() {
    // 调用父类重置方法
    super.reset();
    
    // 重置平台特有状态
    this.activated = false;
    this.stepCount = 0;
    this.lastContactedPlayer = null;
    
    // 重置物理属性到默认值（将被initializeTypeProperties覆盖）
    this.friction = 1.0;
    this.bounciness = 0;
    this.solid = true;
    
    // 重置视觉属性
    this.glowIntensity = 0;
    this.animationTime = 0;
    this.shakeAmount = 0;
    this.flashTime = 0;
    this.scale = { x: 1.0, y: 1.0 };
    
    // 重置特效动画状态
    this.impactTime = 0;
    this.impactIntensity = 0;
    
    // 重置移动平台状态
    this.moveDirection = 1;
    this.moveSpeed = 50;
    this.moveBounds = { left: 50, right: 350 };
    this.moveRange = 60;
    this.startX = 0;  // 将在resetPlatform中被正确设置
    
    // 重置易碎平台状态
    this.maxSteps = -1;
    this.crackProgress = 0;
    this.destructionTimer = 0;
    
    // 重置消失平台状态
    this.disappearTimer = 0;
    this.disappearDelay = 1.0;
    this.isDisappearing = false;
    
    // 重置危险平台状态
    this.damageChance = 0.3;
    this.damageAmount = 1;
    
    // 重置视觉颜色属性（将在resetPlatform中被重新设置）
    this.baseColor = '#808080';
    this.color = '#808080';
    this.edgeColor = '#606060';
    
    // 重置特效数组
    this.particles = [];
    this.shockwaves = [];
    this.energyRings = [];
    
    // 重置特效属性
    this.surfaceShine = 0;
    this.dissolveEffect = 0;
    this.spikeAnimation = 0;
    
    // 重置对象池相关属性
    this.pooled = false;
    this.lastUsedTime = Date.now();
  }

  /**
   * 克隆平台
   */
  clone() {
    const clone = new Platform(this.x, this.y, this.width, this.height, this.platformType, this.layer, this.audioManager);
    clone.lastContactedPlayer = null; // 确保克隆的平台有正确的初始状态
    return clone;
  }
}