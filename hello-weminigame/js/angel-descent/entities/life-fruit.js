/**
 * @file life-fruit.js
 * @description 生命果实实体类
 * 
 * 生命果实是一种特殊的收集品，玩家收集后可以增加一条生命
 * 具有闪耀的粒子特效和脉动动画，增强视觉吸引力
 */

import Sprite from '../core/sprite.js';

/**
 * 生命果实类
 * 
 * 特点：
 * - 漂浮动画和脉动效果
 * - 华丽的粒子特效系统
 * - 玩家接触时自动收集
 * - 播放收集音效和特效
 */
export default class LifeFruit extends Sprite {
  constructor(x, y, audioManager = null, layer = 1) {
    // 生命果实尺寸：24x24像素
    super(x, y, 24, 24);
    
    // 音频管理器引用
    this.audioManager = audioManager;
    
    // 生命果实特有属性
    this.lifeValue = 1; // 增加的生命值
    this.collected = false; // 是否已被收集
    this.layer = layer; // 所属层数，用于管理和调试
    
    // 视觉属性
    this.color = '#FF4081'; // 生命果实的粉红色
    this.coreColor = '#FFFFFF'; // 核心白色
    this.glowColor = '#FF80AB'; // 发光颜色
    
    // 动画属性
    this.floatPhase = Math.random() * Math.PI * 2; // 随机漂浮相位
    this.floatSpeed = 2; // 漂浮速度
    this.floatAmplitude = 8; // 漂浮幅度
    this.originalY = y; // 记录原始Y坐标
    
    this.pulsePhase = Math.random() * Math.PI * 2; // 脉动相位
    this.pulseSpeed = 5; // 增加脉动速度
    this.pulseAmplitude = 0.3; // 增加脉动幅度
    
    // 增加额外的闪烁效果
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 8; // 闪烁速度
    this.twinkleIntensity = 0.4; // 闪烁强度
    
    this.rotationSpeed = 1.5; // 旋转速度
    this.rotation = 0; // 当前旋转角度
    
    // 优化的粒子效果系统
    this.particles = [];
    this.particleSystem = {
      enabled: true,
      spawnRate: 10, // 减少到10粒子/秒，仍然很华丽
      spawnTimer: 0, // 生成计时器
      maxParticles: 20, // 减少到20个最大粒子
      types: [
        {
          name: 'heart',
          color: '#FF4081',
          minSize: 3,
          maxSize: 5, // 稍微减小粒子尺寸
          minLife: 1.2,
          maxLife: 2.5, // 稍微缩短生存时间
          minSpeed: 25,
          maxSpeed: 45,
          probability: 0.5 // 增加心形粒子比例，减少复杂粒子
        },
        {
          name: 'sparkle',
          color: '#FFFFFF',
          minSize: 2,
          maxSize: 4,
          minLife: 1.0,
          maxLife: 2.0,
          minSpeed: 30,
          maxSpeed: 60,
          probability: 0.4
        },
        {
          name: 'glow',
          color: '#FFD700', // 保留金色发光粒子，但减少数量
          minSize: 3,
          maxSize: 6,
          minLife: 1.5,
          maxLife: 3.0,
          minSpeed: 15,
          maxSpeed: 30,
          probability: 0.1 // 减少复杂粒子概率
        }
        // 移除星星粒子，简化渲染
      ]
    };
    
    // 收集特效
    this.collectEffect = {
      active: false,
      duration: 1.0, // 收集特效持续时间
      timer: 0,
      particles: []
    };
    
    // 碰撞检测盒（比视觉大小稍大，便于收集）
    this.collisionBox = {
      x: -15, // 相对于中心的偏移，扩大碰撞盒
      y: -15,
      width: 30, // 比视觉尺寸(24x24)稍大
      height: 30
    };
    
    this.type = 'life_fruit';
    this.addTag('collectible');
    this.addTag('life_fruit');
    
    // 生命果实创建完成
  }

  /**
   * 更新生命果实逻辑
   * @param {number} deltaTime - 时间间隔
   */
  update(deltaTime) {
    if (this.collected && !this.collectEffect.active) {
      // 已被收集且收集特效结束，标记为销毁
      this.destroy();
      return;
    }
    
    // 更新动画效果
    this.updateAnimations(deltaTime);
    
    // 更新粒子效果
    this.updateParticleSystem(deltaTime);
    
    // 更新收集特效
    if (this.collectEffect.active) {
      this.updateCollectEffect(deltaTime);
    }
    
    // 调用父类更新
    super.update(deltaTime);
  }
  
  /**
   * 更新动画效果
   * @param {number} deltaTime - 时间间隔
   */
  updateAnimations(deltaTime) {
    if (this.collected) return; // 收集后停止常规动画
    
    // 更新漂浮动画
    this.floatPhase += deltaTime * this.floatSpeed;
    this.y = this.originalY + Math.sin(this.floatPhase) * this.floatAmplitude;
    
    // 更新脉动动画
    this.pulsePhase += deltaTime * this.pulseSpeed;
    
    // 更新闪烁动画
    this.twinklePhase += deltaTime * this.twinkleSpeed;
    
    // 更新旋转动画
    this.rotation += deltaTime * this.rotationSpeed;
    if (this.rotation > Math.PI * 2) {
      this.rotation -= Math.PI * 2;
    }
  }
  
  /**
   * 更新粒子效果系统
   * @param {number} deltaTime - 时间间隔
   */
  updateParticleSystem(deltaTime) {
    if (!this.particleSystem.enabled || this.collected) return;
    
    // 更新生成计时器
    this.particleSystem.spawnTimer += deltaTime;
    
    // 检查是否需要生成新粒子
    const spawnInterval = 1 / this.particleSystem.spawnRate;
    while (this.particleSystem.spawnTimer >= spawnInterval && 
           this.particles.length < this.particleSystem.maxParticles) {
      this.spawnParticle();
      this.particleSystem.spawnTimer -= spawnInterval;
    }
    
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // 更新粒子生命值
      particle.life -= deltaTime;
      
      // 更新粒子位置
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // 更新粒子透明度
      particle.alpha = particle.life / particle.maxLife;
      
      // 更新粒子尺寸（轻微脉动）
      particle.currentSize = particle.baseSize * (1 + 0.2 * Math.sin(particle.pulsePhase));
      particle.pulsePhase += deltaTime * 6;
      
      // 添加重力效果（向果实聚拢）
      const dx = this.x - particle.x;
      const dy = this.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const attractionForce = 30;
        particle.vx += (dx / distance) * attractionForce * deltaTime;
        particle.vy += (dy / distance) * attractionForce * deltaTime;
      }
      
      // 移除生命值耗尽的粒子
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  /**
   * 生成新粒子
   */
  spawnParticle() {
    // 随机选择粒子类型
    const rand = Math.random();
    let cumulativeProbability = 0;
    let selectedType = this.particleSystem.types[0];
    
    for (const type of this.particleSystem.types) {
      cumulativeProbability += type.probability;
      if (rand <= cumulativeProbability) {
        selectedType = type;
        break;
      }
    }
    
    // 在果实周围随机位置生成粒子
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 20;
    const baseX = this.x + Math.cos(angle) * radius;
    const baseY = this.y + Math.sin(angle) * radius;
    
    const particle = {
      x: baseX,
      y: baseY,
      vx: (Math.random() - 0.5) * selectedType.maxSpeed,
      vy: (Math.random() - 0.5) * selectedType.maxSpeed,
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
    
    this.particles.push(particle);
  }
  
  /**
   * 更新收集特效
   * @param {number} deltaTime - 时间间隔
   */
  updateCollectEffect(deltaTime) {
    this.collectEffect.timer += deltaTime;
    
    // 更新收集特效粒子
    for (let i = this.collectEffect.particles.length - 1; i >= 0; i--) {
      const particle = this.collectEffect.particles[i];
      
      particle.life -= deltaTime;
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.alpha = particle.life / particle.maxLife;
      
      // 根据粒子类型应用不同的物理效果
      if (particle.type === 'reward_float') {
        // 奖励粒子继续向上飘散
        particle.vy -= 30 * deltaTime;
      } else {
        // 其他粒子轻微的重力效果
        particle.vy += 20 * deltaTime;
      }
      
      // 添加轻微的阻力
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      if (particle.life <= 0) {
        this.collectEffect.particles.splice(i, 1);
      }
    }
    
    // 检查收集特效是否结束
    if (this.collectEffect.timer >= this.collectEffect.duration) {
      this.collectEffect.active = false;
    }
  }
  
  /**
   * 检查与玩家的碰撞
   * @param {Player} player - 玩家对象
   * @returns {boolean} 是否发生碰撞
   */
  checkCollisionWithPlayer(player) {
    if (this.collected || this.destroyed) return false;
    
    // 获取生命果实的碰撞盒
    const fruitLeft = this.x + this.collisionBox.x;
    const fruitRight = fruitLeft + this.collisionBox.width;
    const fruitTop = this.y + this.collisionBox.y;
    const fruitBottom = fruitTop + this.collisionBox.height;
    
    // 对于生命果实，使用玩家的整个身体进行碰撞检测，而不是只用脚部
    // 玩家尺寸：42x63，中心对齐
    const playerLeft = player.x - player.width/2;
    const playerRight = player.x + player.width/2;
    const playerTop = player.y - player.height/2;
    const playerBottom = player.y + player.height/2;
    
    // 检查矩形碰撞
    return !(fruitRight < playerLeft || 
             fruitLeft > playerRight || 
             fruitBottom < playerTop || 
             fruitTop > playerBottom);
  }
  
  /**
   * 被玩家收集
   * @param {Player} player - 收集的玩家
   */
  collect(player) {
    if (this.collected) return false;
    
    this.collected = true;
    
    // 增加玩家生命值
    player.lives = Math.min(player.lives + this.lifeValue, player.maxLives);
    
    // 播放收集音效
    if (this.audioManager) {
      this.audioManager.playLifeFruitCollect();
    }
    
    // 启动收集特效
    this.startCollectEffect();
    
    // 生命果实被收集
    return true;
  }
  
  /**
   * 启动收集特效
   */
  startCollectEffect() {
    this.collectEffect.active = true;
    this.collectEffect.timer = 0;
    this.collectEffect.particles = [];
    
    // 优化的收集爆炸特效 - 减少粒子但保持视觉冲击
    // 第一层：径向爆炸心形粒子
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 100 + Math.random() * 80;
      
      const particle = {
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 4, // 稍微增大单个粒子来补偿数量减少
        life: 1.0 + Math.random() * 0.6,
        maxLife: 1.0 + Math.random() * 0.6,
        alpha: 1,
        color: Math.random() < 0.6 ? '#FF4081' : '#FF80AB',
        type: 'heart_burst'
      };
      
      this.collectEffect.particles.push(particle);
    }
    
    // 第二层：闪光爆炸
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 60;
      
      const particle = {
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 0.8 + Math.random() * 0.5,
        alpha: 1,
        color: '#FFFFFF',
        type: 'sparkle_burst'
      };
      
      this.collectEffect.particles.push(particle);
    }
    
    // 第三层：金色奖励粒子（向上飘散）
    for (let i = 0; i < 6; i++) {
      const particle = {
        x: this.x + (Math.random() - 0.5) * 30,
        y: this.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 50,
        vy: -80 - Math.random() * 60,
        size: 6 + Math.random() * 3,
        life: 1.5 + Math.random() * 0.8,
        maxLife: 1.5 + Math.random() * 0.8,
        alpha: 1,
        color: '#FFD700',
        type: 'reward_float'
      };
      
      this.collectEffect.particles.push(particle);
    }
    
    // 移除第四层星星爆炸，简化特效
  }
  
  /**
   * 渲染生命果实
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    if (this.destroyed) return;
    
    ctx.save();
    
    // 如果已收集，只渲染收集特效
    if (this.collected) {
      this.renderCollectEffect(ctx);
      ctx.restore();
      return;
    }
    
    // 渲染粒子效果（底层）
    this.renderParticles(ctx);
    
    // 计算脉动缩放和闪烁效果
    const pulseScale = 1 + Math.sin(this.pulsePhase) * this.pulseAmplitude;
    const twinkleAlpha = 1 + Math.sin(this.twinklePhase) * this.twinkleIntensity;
    
    // 移动到果实位置并应用旋转
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(pulseScale, pulseScale);
    
    // 简化的发光效果（保持华丽但减少绘制调用）
    // 外层光晕
    ctx.fillStyle = this.glowColor;
    ctx.globalAlpha = 0.5 * twinkleAlpha;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2 + 6, 0, Math.PI * 2);
    ctx.fill();
    
    // 内层光晕
    ctx.globalAlpha = 0.7 * twinkleAlpha;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2 + 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制主体心形
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    this.drawHeart(ctx, 0, 0, this.width / 2);
    
    // 绘制内核高光
    ctx.fillStyle = this.coreColor;
    ctx.globalAlpha = 0.8;
    this.drawHeart(ctx, -1, -1, this.width / 3);
    
    // 绘制中心亮点
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.arc(-2, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // 调试：绘制碰撞盒（开发时临时启用）
    if (false) { // 设置为true来显示碰撞盒
      ctx.save();
      ctx.strokeStyle = '#FF0000';
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
  
  /**
   * 绘制心形
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} size - 心形大小
   */
  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    
    // 左半心
    ctx.bezierCurveTo(
      x, y - size / 2,
      x - size, y - size / 2,
      x - size / 2, y
    );
    
    // 右半心
    ctx.bezierCurveTo(
      x + size, y - size / 2,
      x, y - size / 2,
      x, y + size / 4
    );
    
    ctx.fill();
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
      
      // 为不同类型的粒子添加不同效果
      if (particle.type === 'heart') {
        
        // 绘制小心形
        ctx.translate(particle.x, particle.y);
        this.drawHeart(ctx, 0, 0, particle.currentSize);
      } else if (particle.type === 'sparkle') {
        
        // 绘制星形闪光
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.pulsePhase);
        
        // 绘制十字星
        ctx.lineWidth = 1;
        ctx.strokeStyle = particle.color;
        ctx.beginPath();
        ctx.moveTo(-particle.currentSize, 0);
        ctx.lineTo(particle.currentSize, 0);
        ctx.moveTo(0, -particle.currentSize);
        ctx.lineTo(0, particle.currentSize);
        ctx.stroke();
        
        // 中心点
        ctx.fillRect(-0.5, -0.5, 1, 1);
      } else if (particle.type === 'glow') {
        // 金色发光粒子 - 双重光晕效果
        
        // 外层光晕
        ctx.globalAlpha = particle.alpha * 0.3;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.currentSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 内核
        ctx.globalAlpha = particle.alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.currentSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }
  
  /**
   * 绘制五角星
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} outerRadius - 外半径
   * @param {number} innerRadius - 内半径
   */
  drawStar(ctx, x, y, outerRadius, innerRadius) {
    ctx.beginPath();
    
    const spikes = 5;
    const step = Math.PI / spikes;
    let rot = Math.PI / 2 * 3;
    
    ctx.moveTo(x, y - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
      rot += step;
      
      ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
      rot += step;
    }
    
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * 渲染收集特效
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderCollectEffect(ctx) {
    for (const particle of this.collectEffect.particles) {
      ctx.save();
      
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      
      // 根据粒子类型渲染不同效果
      if (particle.type === 'heart_burst') {
        // 心形爆炸粒子 - 强烈发光效果
        ctx.translate(particle.x, particle.y);
        this.drawHeart(ctx, 0, 0, particle.size);
      } else if (particle.type === 'sparkle_burst') {
        // 闪光爆炸粒子 - 十字星形
        ctx.translate(particle.x, particle.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = particle.color;
        ctx.beginPath();
        ctx.moveTo(-particle.size, 0);
        ctx.lineTo(particle.size, 0);
        ctx.moveTo(0, -particle.size);
        ctx.lineTo(0, particle.size);
        ctx.stroke();
        // 中心亮点
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'reward_float') {
        // 奖励飘散粒子 - 双层发光圆形
        // 外层光晕
        ctx.globalAlpha = particle.alpha * 0.4;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 1.3, 0, Math.PI * 2);
        ctx.fill();
        // 内核
        ctx.globalAlpha = particle.alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }
  
  /**
   * 销毁生命果实
   */
  destroy() {
    this.destroyed = true;
    this.active = false;
    this.visible = false;
    
    // 清理粒子
    this.particles = [];
    this.collectEffect.particles = [];
  }
  
  /**
   * 获取状态信息
   */
  getStatus() {
    return {
      collected: this.collected,
      lifeValue: this.lifeValue,
      particles: this.particles.length,
      collectEffectActive: this.collectEffect.active
    };
  }
}