/**
 * @file player.js
 * @description 天使下凡一百层游戏玩家类
 */

import Sprite from '../core/sprite.js';
import AnimationManager, { TRANSITION_MODES } from '../core/animation-manager.js';
import { LOOP_MODES } from '../core/animation.js';


/**
 * 玩家类
 */
export default class Player extends Sprite {
  constructor(x = 187.5, y = 100, audioManager = null) {
    // 调整渲染尺寸为适中大小 (60x90 * 0.7 = 42x63)
    super(x, y, 42, 63);
    
    // 音频管理器引用
    this.audioManager = audioManager;
    
    // 上一帧的地面状态，用于检测真正的着陆
    this.wasOnGroundLastFrame = false;
    
    // 音效播放冷却机制 - 优化性能
    this.lastLandingSoundTime = 0;  // 上次播放落地音效的时间
    this.landingSoundCooldown = 400; // 增加落地音效冷却时间到400毫秒，减少音效频率
    
    // 玩家特有属性
    this.lives = 3;
    this.maxLives = 3;
    this.score = 0;
    this.fallDistance = 0;
    this.totalDistance = 0;
    
    
    // 物理属性
    this.gravity = 980; // 重力加速度 (像素/秒²)
    this.horizontalSpeed = 200; // 水平移动速度
    this.maxFallSpeed = 600; // 最大下降速度
    this.onGround = false;
    this.groundTime = 0; // 在地面停留的时间
    
    // 状态属性
    this.isInvulnerable = false; // 无敌状态
    this.invulnerabilityTime = 0; // 无敌时间
    this.lastHitTime = 0; // 上次受伤时间
    this.isFrozen = false; // 冰冻状态
    this.freezeTime = 0; // 冰冻剩余时间
    this.frozenColor = '#00BFFF'; // 冰冻时的颜色 - 更亮的深天蓝色
    this.frozenOverlayColor = '#87CEEB'; // 冰冻覆盖层颜色
    this.frozenGlowColor = '#00FFFF'; // 冰冻发光颜色 - 青色
    
    // 输入状态
    this.inputState = {
      leftPressed: false,
      rightPressed: false
    };
    
    // 视觉属性
    this.color = '#FFD54F'; // 天使金色
    this.invulnerableColor = '#FFFFFF'; // 无敌时的纯白色
    this.blinkTime = 0;
    
    // 粒子效果（简单实现）
    this.particles = [];
    
    // 屏幕震动效果
    this.shakeAmount = 0;
    
    // 角色图像资源
    this.characterImages = new Map(); // 存储加载的角色图像
    this.useImageRendering = false;   // 是否使用图像渲染（fallback到几何渲染）
    
    // 动画系统
    this.animationManager = new AnimationManager({
      defaultTransitionMode: TRANSITION_MODES.SMOOTH,
      transitionDuration: 0.1
    });
    this.characterEffects = new Map(); // 存储加载的特效图像
    this.useAnimations = false; // 是否使用动画特效
    
    // 动画状态跟踪
    this.lastAnimationState = null; // 上次的动画状态
    
    // 光环特效系统
    this.haloSystem = {
      enabled: true,           // 是否启用光环
      radius: 35,              // 光环半径
      innerRadius: 25,         // 内环半径
      thickness: 8,            // 光环厚度
      opacity: 0.6,            // 基础透明度
      pulsePhase: 0,           // 脉动相位
      pulseSpeed: 3,           // 脉动速度
      rotationSpeed: 1,        // 旋转速度
      rotation: 0,             // 当前旋转角度
      segments: 12,            // 光环分段数
      colors: {
        normal: '#FFD700',     // 正常状态金色
        hurt: '#FF4444',       // 受伤状态红色
        frozen: '#00FFFF',     // 冰冻状态青色 - 更明显
        invulnerable: '#FFFFFF' // 无敌状态白色
      }
    };
    
    
    // 设置精确的脚步碰撞盒 - 基于天使脚步大小而不是整体图像大小
    // 碰撞盒尺寸：12x8像素（保持不变，精确的脚步碰撞）
    // 位置：底部中心，模拟天使的脚部接触地面的区域
    this.collisionBox = {
      x: -6,          // 相对于精灵中心的X偏移 (-6到+6，总宽度12)
      y: 23.5,        // 相对于精灵中心的Y偏移 (63/2 - 8 = 23.5，位于底部)
      width: 12,      // 脚步碰撞宽度
      height: 8       // 脚步碰撞高度
    };
    
    this.type = 'player';
    this.addTag('player');
    
    // 玩家创建完成
  }

  /**
   * 设置角色图像资源
   * @param {Map<string, Image|null>} characterImages - 角色图像Map
   */
  setCharacterImages(characterImages) {
    this.characterImages = characterImages;
    // 检查是否有有效的图像资源
    this.useImageRendering = characterImages && 
      Array.from(characterImages.values()).some(img => img !== null);
    
    // 图像设置完成
  }
  
  /**
   * 设置角色特效动画资源
   * @param {Map<string, Image|null>} characterEffects - 特效图像Map
   */
  setCharacterEffects(characterEffects) {
    this.characterEffects = characterEffects;
    
    // 检查是否有有效的特效资源
    this.useAnimations = characterEffects && 
      Array.from(characterEffects.values()).some(img => img !== null);
    
    if (this.useAnimations) {
      this.setupAnimations();
    }
    
    // 特效设置完成
  }
  
  /**
   * 设置动画
   * @private
   */
  setupAnimations() {
    // 清除现有动画
    this.animationManager.stopAll();
    
    // 下降动画帧不存在，跳过创建
    
    // 创建左移动画
    const leftFrames = [
      this.characterEffects.get('move_left_01'),
      this.characterEffects.get('move_left_02')
    ].filter(frame => frame !== null && frame !== undefined);
    
    if (leftFrames.length > 0) {
      this.animationManager.addAnimation('move_left', leftFrames, {
        frameRate: 6,
        loopMode: LOOP_MODES.LOOP
      });
    }
    
    // 创建右移动画
    const rightFrames = [
      this.characterEffects.get('move_right_01'),
      this.characterEffects.get('move_right_02')
    ].filter(frame => frame !== null && frame !== undefined);
    
    if (rightFrames.length > 0) {
      this.animationManager.addAnimation('move_right', rightFrames, {
        frameRate: 6,
        loopMode: LOOP_MODES.LOOP
      });
    }
    
    // 动画设置完成
  }

  /**
   * 根据当前状态获取对应的角色图像
   * @returns {Image|null} 当前状态的角色图像
   */
  getCurrentStateImage() {
    // 优先使用动画帧
    if (this.useAnimations) {
      const animationFrame = this.animationManager.getCurrentFrame();
      if (animationFrame) {
        return animationFrame;
      }
    }
    
    // 如果没有动画或动画帧不可用，使用静态图像
    if (!this.useImageRendering || !this.characterImages) {
      return null;
    }

    let targetImage = null;

    // 受伤后显示受伤状态，持续整个无敌时间
    if (this.isInvulnerable) {
      targetImage = this.characterImages.get('hurt');
      // 如果hurt图像不存在，使用normal作为备用
      if (!targetImage) {
        targetImage = this.characterImages.get('normal');
      }
    }
    // 下落状态显示下落图像（向下移动且速度超过100像素/秒）
    else if (this.velocity.y > 100) {
      targetImage = this.characterImages.get('fall');
      // 如果fall图像不存在，使用normal作为备用
      if (!targetImage) {
        targetImage = this.characterImages.get('normal');
      }
    }
    // 冰冻状态使用正常图像（不使用frozen图像，仅通过特效显示冰冻状态）
    else if (this.isFrozen) {
      targetImage = this.characterImages.get('normal');
    }
    // 正常状态使用正常图像
    else {
      targetImage = this.characterImages.get('normal');
    }
    
    // 最终备用：如果所有图像都不存在，返回null（将使用几何渲染）
    return targetImage || null;
  }

  /**
   * 设置输入状态
   * @param {boolean} leftPressed - 是否按下左键
   * @param {boolean} rightPressed - 是否按下右键
   */
  setInput(leftPressed, rightPressed) {
    this.inputState.leftPressed = leftPressed;
    this.inputState.rightPressed = rightPressed;
    
    // 如果所有输入都被重置为false，立即停止所有动画
    if (!leftPressed && !rightPressed && this.useAnimations) {
      this.animationManager.stopAll();
      this.lastAnimationState = null;
    }
  }

  /**
   * 更新玩家逻辑
   * @param {number} deltaTime - 时间间隔
   */
  update(deltaTime) {
    // 更新输入处理
    this.updateInput(deltaTime);
    
    // 更新物理
    this.updatePhysics(deltaTime);
    
    // 更新状态
    this.updateStates(deltaTime);
    
    // 更新动画
    this.updateAnimations(deltaTime);
    
    // 更新粒子效果
    this.updateParticles(deltaTime);
    
    // 调用父类更新
    super.update(deltaTime);
  }

  /**
   * 更新输入处理
   * @param {number} deltaTime - 时间间隔
   */
  updateInput(deltaTime) {
    // 冰冻状态下不能移动
    if (this.isFrozen) {
      this.velocity.x = 0;
      return;
    }
    
    // 水平移动
    if (this.inputState.leftPressed) {
      this.velocity.x = -this.horizontalSpeed;
    } else if (this.inputState.rightPressed) {
      this.velocity.x = this.horizontalSpeed;
    } else {
      // 空气阻力，减缓水平移动（减少阻力让移动更灵活）
      this.velocity.x *= 0.85; // 从0.8提升到0.85，减少阻力
      if (Math.abs(this.velocity.x) < 5) { // 从10降到5，允许更小的速度保持
        this.velocity.x = 0;
      }
    }
  }

  /**
   * 更新物理
   * @param {number} deltaTime - 时间间隔
   */
  updatePhysics(deltaTime) {
    // 应用重力
    if (!this.onGround) {
      this.velocity.y += this.gravity * deltaTime;
      // 限制最大下降速度
      this.velocity.y = Math.min(this.velocity.y, this.maxFallSpeed);
    } else {
      this.groundTime += deltaTime;
    }
    
    // 更新位置
    const oldY = this.y;
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    
    
    // 边界检查（左右）- 适度扩展移动范围，创建合理的游戏世界
    const screenWidth = 375;
    const worldWidth = screenWidth * 1.5; // 游戏世界宽度是屏幕的1.5倍
    const worldLeft = -worldWidth; // 左边界扩展到屏幕左侧1.5倍屏幕宽度
    const worldRight = worldWidth; // 右边界扩展到屏幕右侧1.5倍屏幕宽度
    
    // 检查边界警告区域
    const warningZone = worldWidth * 0.15; // 警告区域为边界内15%
    const leftWarningZone = worldLeft + warningZone;
    const rightWarningZone = worldRight - warningZone;
    
    // 生成边界警告粒子
    if (this.x < leftWarningZone || this.x > rightWarningZone) {
      this.createBoundaryWarningParticles(this.x < leftWarningZone ? 'left' : 'right');
    }
    
    this.x = Math.max(worldLeft, Math.min(worldRight, this.x));
    
    // 计算下降距离
    if (this.y > oldY && this.velocity.y > 0) {
      const fallDelta = this.y - oldY;
      this.fallDistance += fallDelta;
      this.totalDistance += fallDelta;
    }
    
    // 保存上一帧的地面状态
    this.wasOnGroundLastFrame = this.onGround;
    
    // 重置地面状态（将在碰撞检测中重新设置）
    this.onGround = false;
  }


  /**
   * 更新状态
   * @param {number} deltaTime - 时间间隔
   */
  updateStates(deltaTime) {
    // 更新无敌状态
    if (this.isInvulnerable) {
      this.invulnerabilityTime -= deltaTime;
      if (this.invulnerabilityTime <= 0) {
        this.isInvulnerable = false;
        this.invulnerabilityTime = 0;
      }
      
      // 闪烁效果
      this.blinkTime += deltaTime;
    }
    
    // 更新冰冻状态
    if (this.isFrozen) {
      this.freezeTime -= deltaTime;
      
      // 持续产生冰冻粒子效果
      if (Math.random() < 0.3) { // 30%概率每帧产生粒子
        this.createOngoingFreezeEffect();
      }
      
      if (this.freezeTime <= 0) {
        this.isFrozen = false;
        this.freezeTime = 0;
        // 玩家解除冰冻
      }
    }
    
    // 更新光环动画
    this.updateHaloSystem(deltaTime);
    
    // 更新震动效果
    if (this.shakeAmount > 0) {
      this.shakeAmount = Math.max(0, this.shakeAmount - deltaTime * 15); // 快速衰减震动
    }
    
  }
  
  /**
   * 更新光环系统
   * @param {number} deltaTime - 时间间隔
   */
  updateHaloSystem(deltaTime) {
    if (!this.haloSystem.enabled) return;
    
    // 更新脉动相位
    this.haloSystem.pulsePhase += deltaTime * this.haloSystem.pulseSpeed;
    
    // 更新旋转角度
    this.haloSystem.rotation += deltaTime * this.haloSystem.rotationSpeed;
    if (this.haloSystem.rotation > Math.PI * 2) {
      this.haloSystem.rotation -= Math.PI * 2;
    }
    
    // 根据状态调整光环参数
    if (this.isInvulnerable) {
      // 无敌状态下光环更亮，脉动更快
      this.haloSystem.pulseSpeed = 6;
      this.haloSystem.opacity = 0.8;
    } else if (this.isFrozen) {
      // 冰冻状态下光环较慢
      this.haloSystem.pulseSpeed = 1.5;
      this.haloSystem.opacity = 0.7;
    } else {
      // 正常状态
      this.haloSystem.pulseSpeed = 3;
      this.haloSystem.opacity = 0.6;
    }
  }
  
  
  /**
   * 更新动画
   * @param {number} deltaTime - 时间间隔
   */
  updateAnimations(deltaTime) {
    if (!this.useAnimations) {
      return;
    }
    
    // 根据当前状态确定应该播放的动画
    const currentAnimationState = this.determineAnimationState();
    
    // 如果动画状态发生变化，切换动画
    if (currentAnimationState !== this.lastAnimationState) {
      this.switchToAnimation(currentAnimationState);
      this.lastAnimationState = currentAnimationState;
    }
    
    // 更新动画管理器
    this.animationManager.update(deltaTime);
  }
  
  /**
   * 确定当前应该播放的动画状态
   * @returns {string|null} 动画状态名称
   * @private
   */
  determineAnimationState() {
    // 如果被冰冻，不播放移动动画
    if (this.isFrozen) {
      return null;
    }
    
    // 根据移动状态确定动画
    if (this.inputState.leftPressed && this.animationManager.hasAnimation('move_left')) {
      return 'move_left';
    } else if (this.inputState.rightPressed && this.animationManager.hasAnimation('move_right')) {
      return 'move_right';
    }
    
    // 没有特定状态时，不播放特效动画
    return null;
  }
  
  /**
   * 切换到指定动画
   * @param {string|null} animationName - 动画名称
   * @private
   */
  switchToAnimation(animationName) {
    if (!animationName) {
      // 停止所有动画，使用静态图像
      this.animationManager.stopAll();
      return;
    }
    
    if (this.animationManager.hasAnimation(animationName)) {
      this.animationManager.playAnimation(animationName, TRANSITION_MODES.SMOOTH);
    }
  }

  /**
   * 更新粒子效果
   * @param {number} deltaTime - 时间间隔
   */
  updateParticles(deltaTime) {
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= deltaTime;
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.alpha = particle.life / particle.maxLife;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // 生成新粒子（在快速下降时）
    if (this.velocity.y > 200 && Math.random() < 0.3) {
      this.createTrailParticle();
    }
    
    // 冰冻状态持续生成冰霜粒子 - 增加生成频率和数量
    if (this.isFrozen) {
      // 主要冰霜粒子
      if (Math.random() < 0.8) {
        this.createFrostParticle();
      }
      // 额外的冰晶粒子
      if (Math.random() < 0.5) {
        this.createFrostParticle();
      }
    }
    
    // 玩家身边持续的闪耀挥发效果 - 增加生成频率和数量
    if (Math.random() < 0.8) { // 从25%提升到80%
      this.createSparkleParticle();
    }
    // 额外生成更多闪耀粒子
    if (Math.random() < 0.5) {
      this.createSparkleParticle();
    }
  }

  /**
   * 创建拖尾粒子
   */
  createTrailParticle() {
    const particle = {
      x: this.x + (Math.random() - 0.5) * this.width,
      y: this.y + this.height/2,
      vx: (Math.random() - 0.5) * 50,
      vy: -Math.random() * 100,
      life: 0.5,
      maxLife: 0.5,
      alpha: 1,
      color: '#FFB6B6'
    };
    
    this.particles.push(particle);
  }

  /**
   * 创建持续的冰霜粒子（冰冻状态期间）
   */
  createFrostParticle() {
    // 创建环绕玩家的冰霜粒子 - 增强效果
    const angle = Math.random() * Math.PI * 2;
    const radius = 10 + Math.random() * 30; // 围绕玩家的半径
    
    // 随机选择冰霜粒子类型
    const frostColors = ['#00FFFF', '#87CEEB', '#B0E0E6', '#E0FFFF', '#AFEEEE'];
    const selectedColor = frostColors[Math.floor(Math.random() * frostColors.length)];
    
    const particle = {
      x: this.x + Math.cos(angle) * radius,
      y: this.y + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 40,
      vy: -15 - Math.random() * 25, // 更多向上飘散
      size: 3 + Math.random() * 4, // 增大粒子尺寸
      life: 2.0 + Math.random() * 1.5, // 延长生存时间
      maxLife: 2.0 + Math.random() * 1.5,
      alpha: 1,
      color: selectedColor,
      type: 'freeze',
      pulsePhase: Math.random() * Math.PI * 2 // 添加脉动相位
    };
    
    this.particles.push(particle);
  }

  /**
   * 创建闪耀挥发粒子（天使光芒效果）
   */
  createSparkleParticle() {
    // 在玩家周围随机位置生成闪耀粒子
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 25; // 更贴近玩家身体
    const baseX = this.x + Math.cos(angle) * radius;
    const baseY = this.y + Math.sin(angle) * radius;
    
    const particle = {
      x: baseX,
      y: baseY,
      vx: (Math.random() - 0.5) * 30, // 增加扩散速度
      vy: -15 - Math.random() * 25,   // 更快向上挥发
      size: 3 + Math.random() * 4,    // 增大粒子尺寸
      life: 2 + Math.random() * 1.5,  // 延长生存时间
      maxLife: 2 + Math.random() * 1.5,
      alpha: 1,
      color: this.getSparkleColor(), // 随机闪耀颜色
      type: 'sparkle'
    };
    
    this.particles.push(particle);
  }

  /**
   * 获取闪耀粒子颜色
   * @returns {string} 颜色值
   */
  getSparkleColor() {
    const colors = [
      '#FFD700', // 金色
      '#FFFF00', // 纯黄色（更亮）
      '#FFFFFF', // 纯白色
      '#FFE4B5', // 浅金色
      '#FFFF99', // 亮黄色
      '#FFFACD', // 柠檬绸色
      '#F0E68C', // 卡其色
      '#FFF700'  // 明亮黄色
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 着陆在平台上
   * @param {Object} platform - 平台对象
   */
  landOnPlatform(platform) {
    // 增强的真实着陆判断逻辑
    // 1. 上一帧不在地面上
    // 2. 当前正在向下移动
    // 3. 有一定的落下速度（避免微小移动触发）
    // 4. 距离上次着陆音效有足够的时间间隔
    const currentTime = Date.now();
    const isRealLanding = !this.wasOnGroundLastFrame && 
                         this.velocity.y > 50 && // 增加最小速度要求
                         (currentTime - this.lastLandingSoundTime) > this.landingSoundCooldown;
    
    
    this.y = platform.y - platform.height/2 - this.height/2;
    
    // 不要立即重置velocity.y，让平台类型决定如何处理速度
    // 弹跳平台需要设置向上速度，其他平台才重置为0
    if (platform.platformType !== 'bounce') {
      this.velocity.y = 0;
      this.onGround = true;
    }
    
    this.groundTime = 0;
    
    // 只有在真正着陆时才播放着陆效果
    if (isRealLanding) {
      this.createLandingEffect();
      this.lastLandingSoundTime = currentTime; // 更新上次播放时间
    }
  }





  /**
   * 创建着陆效果
   */
  createLandingEffect() {
    // 播放落地音效
    if (this.audioManager) {
      this.audioManager.playPlatformLand();
    }
    
    // 进一步优化：减少着陆粒子数量从3个到2个，总计减少60%的粒子生成
    for (let i = 0; i < 2; i++) {
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y + this.height/2,
        vx: (Math.random() - 0.5) * 80, // 减少粒子速度范围
        vy: -Math.random() * 120, // 减少垂直速度
        life: 0.4, // 进一步缩短生存时间到0.4秒
        maxLife: 0.4,
        alpha: 1,
        color: '#FFFFFF'
      };
      
      this.particles.push(particle);
    }
  }

  /**
   * 受到伤害
   * @param {number} damage - 伤害值
   * @param {string} source - 伤害来源
   */
  takeDamage(damage = 1, source = 'unknown') {
    if (this.isInvulnerable || this.destroyed) {
      return false;
    }
    
    this.lives -= damage;
    this.lastHitTime = Date.now();
    
    // 设置无敌状态
    this.isInvulnerable = true;
    this.invulnerabilityTime = 2.0; // 2秒无敌时间
    this.blinkTime = 0;
    
    // 创建受伤效果
    this.createHitEffect();
    
    // 播放受伤音效
    if (this.audioManager) {
      this.audioManager.playAngelHurt();
    }
    
    // 受到伤害
    
    // 检查是否死亡
    if (this.lives <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }

  /**
   * 冰冻玩家
   * @param {number} duration - 冰冻持续时间（秒）
   */
  freeze(duration = 2.0) {
    if (this.destroyed) {
      return false;
    }
    
    this.isFrozen = true;
    this.freezeTime = duration;
    
    // 停止水平移动
    this.velocity.x = 0;
    
    // 创建冰冻粒子效果
    this.createFreezeEffect();
    
    // 播放冰冻音效
    if (this.audioManager) {
      this.audioManager.playAngelFrozen();
    }
    
    // 被冰冻
    
    return true;
  }

  /**
   * 创建冰冻效果
   */
  createFreezeEffect() {
    // 创建初始冰花爆发效果 - 更震撼的视觉冲击
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 80 + Math.random() * 60;
      const particle = {
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        life: 1.2 + Math.random() * 0.6,
        maxLife: 1.2 + Math.random() * 0.6,
        color: Math.random() < 0.4 ? '#00FFFF' : (Math.random() < 0.7 ? '#87CEEB' : '#E0FFFF'), // 更亮的青色系
        type: 'freeze'
      };
      this.particles.push(particle);
    }
    
    // 额外创建一些较大的冰晶粒子
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 30;
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 3,
        life: 1.5 + Math.random() * 0.5,
        maxLife: 1.5 + Math.random() * 0.5,
        color: '#FFFFFF', // 白色冰晶
        type: 'freeze'
      };
      this.particles.push(particle);
    }
  }

  /**
   * 创建边界警告粒子效果
   * @param {string} side - 警告方向 ('left' 或 'right')
   */
  createBoundaryWarningParticles(side) {
    // 控制粒子生成频率，避免过于密集
    if (Math.random() > 0.4) return; // 40%概率生成
    
    // 创建警告粒子
    for (let i = 0; i < 3; i++) {
      const offsetX = side === 'left' ? -this.width/2 - 10 : this.width/2 + 10;
      const particle = {
        x: this.x + offsetX + (Math.random() - 0.5) * 20,
        y: this.y - this.height/2 + Math.random() * this.height,
        vx: side === 'left' ? -30 - Math.random() * 20 : 30 + Math.random() * 20,
        vy: (Math.random() - 0.5) * 40,
        size: 2 + Math.random() * 3,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
        color: Math.random() < 0.8 ? '#FF4444' : '#FF6666', // 80%深红，20%浅红
        type: 'warning'
      };
      this.particles.push(particle);
    }
    
    // 创建边界线条效果
    const lineParticle = {
      x: side === 'left' ? this.x - this.width : this.x + this.width,
      y: this.y + (Math.random() - 0.5) * this.height * 2,
      vx: 0,
      vy: (Math.random() - 0.5) * 60,
      size: 1,
      life: 1.2,
      maxLife: 1.2,
      color: '#FF0000', // 纯红色警告线
      type: 'warning_line'
    };
    this.particles.push(lineParticle);
  }

  /**
   * 创建持续的冰冻效果（较少的粒子）
   */
  createOngoingFreezeEffect() {
    // 创建少量持续的冰晶粒子
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30;
      const particle = {
        x: this.x + (Math.random() - 0.5) * this.width,
        y: this.y + (Math.random() - 0.5) * this.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 10, // 轻微向上飘
        size: 2 + Math.random() * 2,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
        color: Math.random() < 0.8 ? '#87CEEB' : '#FFFFFF', // 80%蓝色，20%白色
        type: 'freeze'
      };
      this.particles.push(particle);
    }
  }

  /**
   * 创建受伤效果
   */
  createHitEffect() {
    // 创建更多更大的受伤粒子
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 120 + Math.random() * 80;
      const particle = {
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
        alpha: 1,
        color: Math.random() < 0.5 ? '#FFD54F' : '#FFFFFF', // 天使金色和纯白
        size: 3 + Math.random() * 2 // 增加粒子大小属性
      };
      
      this.particles.push(particle);
    }
    
    // 添加额外的爆炸火花效果
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 100;
      const particle = {
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        alpha: 1,
        color: '#FFFFFF',
        size: 4 + Math.random() * 3
      };
      
      this.particles.push(particle);
    }
  }

  /**
   * 玩家死亡
   */
  die() {
    // 防止重复触发死亡
    if (this.destroyed) {
      return;
    }
    
    this.destroyed = true;
    // 玩家死亡
    
    // 创建死亡效果
    this.createDeathEffect();
    
    // 触发死亡事件
    this.emit('death', { player: this });
  }

  /**
   * 创建死亡效果
   */
  createDeathEffect() {
    // 创建大量死亡粒子
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;
      const particle = {
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5,
        maxLife: 1.5,
        alpha: 1,
        color: i % 2 === 0 ? '#FFD54F' : '#FFFFFF' // 天使金色与纯白
      };
      
      this.particles.push(particle);
    }
  }

  /**
   * 复活玩家
   * @param {number} x - 复活X坐标
   * @param {number} y - 复活Y坐标
   */
  respawn(x = 187.5, y = 100) {
    this.x = x;
    this.y = y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.lives = this.maxLives;
    this.destroyed = false;
    this.active = true;
    this.visible = true;
    this.onGround = false;
    this.isInvulnerable = true;
    this.invulnerabilityTime = 2.0; // 复活后2秒无敌
    
    // 清空粒子
    this.particles = [];
    
    // 玩家复活
  }

  /**
   * 重置玩家状态
   */
  reset() {
    this.x = 187.5;
    this.y = 100;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.lives = this.maxLives;
    this.score = 0;
    this.fallDistance = 0;
    this.totalDistance = 0;
    this.destroyed = false;
    this.active = true;
    this.visible = true;
    this.onGround = false;
    this.isInvulnerable = false;
    this.invulnerabilityTime = 0;
    this.groundTime = 0;
    this.particles = [];
    
    // 重置音效播放状态
    this.lastLandingSoundTime = 0;
    this.wasOnGroundLastFrame = false;
    
    // 重置输入状态
    this.inputState.leftPressed = false;
    this.inputState.rightPressed = false;
    
    // 重置动画状态
    if (this.useAnimations) {
      this.animationManager.stopAll();
      this.lastAnimationState = null;
    }
    
    // 重置光环系统
    this.haloSystem.pulsePhase = 0;
    this.haloSystem.rotation = 0;
    
    this.shakeAmount = 0;
    
  }

  /**
   * 获取当前层数
   */
  getCurrentLayer(layerHeight = 600) {
    return Math.floor(this.totalDistance / layerHeight) + 1;
  }

  /**
   * 渲染玩家
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    
    // 渲染光环特效（在玩家下层）
    this.renderHalo(ctx);
    
    // 渲染粒子效果
    this.renderParticles(ctx);
    
    // 渲染玩家本体
    if (this.visible && !this.destroyed) {
      // 计算震动效果（包括受伤震动和下降伤害震动）
      let offsetX = 0, offsetY = 0;
      
      // 受伤后的短暂震动效果
      if (this.isInvulnerable && this.invulnerabilityTime > 0.7) {
        const shakeIntensity = (this.invulnerabilityTime - 0.7) / 0.3;
        offsetX += (Math.random() - 0.5) * 6 * shakeIntensity;
        offsetY += (Math.random() - 0.5) * 6 * shakeIntensity;
      }
      
      // 下降伤害震动效果
      if (this.shakeAmount > 0) {
        offsetX += (Math.random() - 0.5) * this.shakeAmount;
        offsetY += (Math.random() - 0.5) * this.shakeAmount;
      }
      
      // 根据状态设置颜色和透明度
      if (this.isFrozen) {
        // 冰冻状态：使用强烈的青蓝色调和脉动效果
        const freezePulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.008);
        ctx.fillStyle = this.frozenColor;
        ctx.globalAlpha = 0.9 * freezePulse;
        // 冰冻发光效果已移除以优化性能
        // ctx.shadowColor = this.frozenGlowColor;
        // ctx.shadowBlur = 20 * freezePulse;
      } else if (this.isInvulnerable && Math.sin(this.blinkTime * 20) > 0) {
        ctx.fillStyle = this.invulnerableColor;
        ctx.globalAlpha = 0.7;
          } else {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 1;
        // ctx.shadowBlur = 0; // 阴影重置已移除
      }
      
      // 绘制玩家主体（图像优先，几何图形fallback）
      const halfWidth = this.width * this.anchor.x;
      const halfHeight = this.height * this.anchor.y;
      const x = this.x - halfWidth + offsetX;
      const y = this.y - halfHeight + offsetY;
      
      // 尝试使用角色图像渲染
      const currentImage = this.getCurrentStateImage();
      if (currentImage && this.useImageRendering) {
        // 所有状态使用正常尺寸 (42x63像素)
        ctx.drawImage(
          currentImage,
          0, 0, currentImage.width, currentImage.height,  // 源图像区域
          x, y, this.width, this.height                   // 目标区域 (42x63)
        );
        
        // 冰冻状态：在图像上添加冰蓝色覆盖层
        if (this.isFrozen) {
          const freezePulse = 0.3 + 0.3 * Math.sin(Date.now() * 0.006);
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = this.frozenOverlayColor;
          ctx.globalAlpha = 0.6 + 0.2 * freezePulse;
          ctx.fillRect(x, y, this.width, this.height);
          ctx.restore();
          
          // 添加冰晶效果覆盖层
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = this.frozenGlowColor;
          ctx.globalAlpha = 0.2 + 0.15 * freezePulse;
          ctx.fillRect(x, y, this.width, this.height);
          ctx.restore();
        }
      } else {
        // Fallback到几何渲染
        ctx.fillRect(x, y, this.width, this.height);
      }
      
      // 绘制状态边框（图像和几何渲染都保留，作为状态指示器）
      if (!this.useImageRendering) {
        // 根据状态设置边框颜色
        if (this.isFrozen) {
          // 冰冻状态：双重边框效果
          const freezePulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
          
          // 外层发光边框
          ctx.strokeStyle = this.frozenGlowColor;
          ctx.lineWidth = 4;
          // 冰冻发光效果已移除
          // ctx.shadowColor = this.frozenGlowColor;
          // ctx.shadowBlur = 15 * freezePulse;
          ctx.strokeRect(x, y, this.width, this.height);
          
          // 内层实体边框
          ctx.strokeStyle = this.frozenColor;
          ctx.lineWidth = 2;
              } else {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
        }
        ctx.strokeRect(x, y, this.width, this.height);
      }
      
      // 绘制眼睛（仅在几何渲染模式下）
      if (!this.useImageRendering || !currentImage) {
        // 正常眼睛 - 调整位置和大小适应42x63尺寸
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 8, y + 13, 6, 6);
        ctx.fillRect(x + 27, y + 13, 6, 6);
      }
      
      
      // 重置效果
      ctx.globalAlpha = 1;
      // ctx.shadowBlur = 0; // 阴影重置已移除
      
      // 调试：绘制玩家整体碰撞盒（生命果实用）
      if (false) { // 设置为true来显示整体碰撞盒
        ctx.save();
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(
          this.x - this.width/2,
          this.y - this.height/2,
          this.width,
          this.height
        );
        ctx.restore();
      }
      
      // 调试：绘制脚部碰撞盒（平台用）
      if (false) { // 设置为true来显示脚部碰撞盒
        ctx.save();
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(
          this.x + this.collisionBox.x,
          this.y + this.collisionBox.y,
          this.collisionBox.width,
          this.collisionBox.height
        );
        ctx.restore();
      }
    }
  }

  /**
   * 渲染粒子效果
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderParticles(ctx) {
    for (const particle of this.particles) {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      
      // 使用粒子的size属性，如果没有则使用默认值2
      const size = particle.size || 2;
      const halfSize = size / 2;
      
      // 绘制更大的粒子，并添加发光效果
      if (particle.color === '#FFFFFF' || particle.color === '#FFFF00') {
        // 粒子发光效果已移除
        // ctx.shadowColor = particle.color;
        // ctx.shadowBlur = size * 2;
      }
      // 为冰冻粒子添加强化发光效果
      else if (particle.type === 'freeze') {
        // 脉动发光效果
        const pulseFactor = particle.pulsePhase ? 
          (0.5 + 0.5 * Math.sin(particle.pulsePhase + Date.now() * 0.005)) : 1;
        
        // 粒子发光效果已移除
        // ctx.shadowColor = particle.color;
        // ctx.shadowBlur = size * 4 * pulseFactor;
        
        // 添加双重发光效果
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = particle.alpha * 0.6 * pulseFactor;
        // ctx.shadowBlur = size * 6; // 发光已移除
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.restore();
      }
      // 为闪耀粒子添加强烈发光效果
      else if (particle.type === 'sparkle') {
        // 粒子发光效果已移除
        // ctx.shadowColor = particle.color;
        // ctx.shadowBlur = size * 5;
        // 添加双重发光效果
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        // ctx.shadowBlur = size * 8; // 发光已移除
        ctx.fillRect(-halfSize, -halfSize, size, size);
        ctx.restore();
      }
      // 为边界警告粒子添加强烈红色发光效果
      else if (particle.type === 'warning') {
        // 添加脉动效果
        const pulseIntensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
        ctx.globalAlpha = particle.alpha * pulseIntensity;
      }
      // 为警告线条添加特殊效果
      else if (particle.type === 'warning_line') {
            // 渲染为垂直线条而不是方块
        ctx.fillRect(-0.5, -size * 3, 1, size * 6);
        ctx.restore();
        continue; // 跳过后面的常规方块渲染
      }
      // 为下降伤害粒子添加特殊效果
      else if (particle.type === 'fall_damage') {
        // 强烈的脉动发光效果
        const pulseIntensity = 0.8 + 0.2 * Math.sin(Date.now() * 0.015);
        ctx.globalAlpha = particle.alpha * pulseIntensity;
      }
      
      ctx.translate(particle.x, particle.y);
      ctx.fillRect(-halfSize, -halfSize, size, size);
      ctx.restore();
    }
  }

  /**
   * 渲染光环特效
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderHalo(ctx) {
    if (!this.haloSystem.enabled || !this.visible || this.destroyed) return;
    
    ctx.save();
    
    // 获取当前状态对应的颜色
    let haloColor;
    if (this.isInvulnerable) {
      haloColor = this.haloSystem.colors.invulnerable;
    } else if (this.isFrozen) {
      haloColor = this.haloSystem.colors.frozen;
    } else if (this.invulnerabilityTime > 0) {
      haloColor = this.haloSystem.colors.hurt;
    } else {
      haloColor = this.haloSystem.colors.normal;
    }
    
    // 计算脉动效果
    const pulseIntensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.haloSystem.pulsePhase));
    const currentRadius = this.haloSystem.radius * (0.8 + 0.2 * pulseIntensity);
    const currentOpacity = this.haloSystem.opacity * pulseIntensity;
    
    // 设置透明度
    ctx.globalAlpha = currentOpacity;
    
    // 绘制外环发光效果
    
    // 绘制分段光环
    const segments = this.haloSystem.segments;
    const angleStep = (Math.PI * 2) / segments;
    
    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep + this.haloSystem.rotation;
      const segmentOpacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(angle * 2 + this.haloSystem.pulsePhase));
      
      ctx.globalAlpha = currentOpacity * segmentOpacity;
      ctx.strokeStyle = haloColor;
      ctx.lineWidth = this.haloSystem.thickness;
      ctx.lineCap = 'round';
      
      // 计算弧段的起始和结束角度
      const startAngle = angle - angleStep * 0.3;
      const endAngle = angle + angleStep * 0.3;
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius, startAngle, endAngle);
      ctx.stroke();
    }
    
    // 绘制内环
    ctx.globalAlpha = currentOpacity * 0.4;
    ctx.strokeStyle = haloColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.haloSystem.innerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 绘制中心亮点
    ctx.globalAlpha = currentOpacity * 0.6;
    ctx.fillStyle = haloColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }


  getStatus() {
    return {
      lives: this.lives,
      maxLives: this.maxLives,
      score: this.score,
      totalDistance: this.totalDistance,
      currentLayer: this.getCurrentLayer(),
      onGround: this.onGround,
      isInvulnerable: this.isInvulnerable,
      velocity: { ...this.velocity }
    };
  }
}