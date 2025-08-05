/**
 * @file effects-manager.js
 * @description 天使下凡一百层游戏特效管理器
 */

/**
 * 特效管理器 - 负责处理所有视觉特效和粒子系统
 */
export default class EffectsManager {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    // 使用逻辑尺寸进行特效计算
    this.logicalWidth = game.logicalWidth;
    this.logicalHeight = game.logicalHeight;
  }

  /**
   * 更新所有视觉特效
   */
  updateVisualEffects(deltaTime) {
    if (!this.game.player) return;
    
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
   * 更新生命值显示特效
   */
  updateLivesDisplayEffect(deltaTime) {
    if (!this.game.player) return;
    
    const currentLives = this.game.player.lives;
    const lastLives = this.game.livesDisplayEffect.lastLives;
    
    // 检测生命值变化
    if (currentLives !== lastLives) {
      this.game.livesDisplayEffect.isChanged = true;
      this.game.livesDisplayEffect.changeTime = 0;
      this.game.livesDisplayEffect.changeType = currentLives > lastLives ? 'gain' : 'lose';
      this.game.livesDisplayEffect.flashIntensity = 1.0;
      this.game.livesDisplayEffect.lastLives = currentLives;
    }
    
    // 更新变化特效
    if (this.game.livesDisplayEffect.isChanged) {
      this.game.livesDisplayEffect.changeTime += deltaTime;
      
      // 闪烁效果持续1秒
      if (this.game.livesDisplayEffect.changeTime < 1.0) {
        // 闪烁强度递减
        this.game.livesDisplayEffect.flashIntensity = 1.0 - (this.game.livesDisplayEffect.changeTime / 1.0);
      } else {
        // 结束特效
        this.game.livesDisplayEffect.isChanged = false;
        this.game.livesDisplayEffect.changeType = 'none';
        this.game.livesDisplayEffect.flashIntensity = 0;
      }
    }
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
    this.game.backgroundOffset = 0;
  }
  
  /**
   * 更新背景主题切换动画
   * 
   * @param {number} deltaTime - 时间间隔
   */
  updateBackgroundTransition(deltaTime) {
    if (!this.game.backgroundTransition.active) return;
    
    // 更新过渡进度
    this.game.backgroundTransition.progress += deltaTime / this.game.backgroundTransition.duration;
    
    // 检查过渡是否完成
    if (this.game.backgroundTransition.progress >= 1.0) {
      this.game.backgroundTransition.active = false;
      this.game.backgroundTransition.progress = 1.0;
      this.game.previousBackgroundTheme = null;
    }
  }

  /**
   * 生成下降效果粒子
   */
  generateFallEffectParticles(deltaTime) {
    if (!this.game.player || this.game.player.velocity.y < 100) return; // 只有快速下降时才生成
    
    // 根据下降速度控制粒子生成频率
    const spawnRate = (this.game.player.velocity.y / 600) * 30; // 下降越快，粒子越多
    const shouldSpawn = Math.random() < spawnRate * deltaTime;
    
    if (shouldSpawn) {
      // 在屏幕边缘生成向上移动的粒子
      for (let i = 0; i < 3; i++) {
        // 计算粒子在世界坐标系中的生成位置（修正位置错误）
        const worldY = this.game.player.y + this.logicalHeight/2 + 50; // 在玩家下方生成
        
        const particle = {
          x: this.game.player.x + (Math.random() - 0.5) * this.logicalWidth, // 围绕玩家生成
          y: worldY, // 在玩家下方的世界坐标
          velocity: {
            x: (Math.random() - 0.5) * 20,
            y: -200 - Math.random() * 100 // 向上移动
          },
          life: 1.0 + Math.random() * 0.5,
          maxLife: 1.5,
          size: 1 + Math.random() * 2,
          alpha: 0.4 + Math.random() * 0.4, // 稍微提高透明度
          color: this.getCurrentThemeParticleColor()
        };
        
        this.game.fallEffectParticles.push(particle);
      }
    }
  }

  /**
   * 更新下降效果粒子
   */
  updateFallEffectParticles(deltaTime) {
    for (let i = this.game.fallEffectParticles.length - 1; i >= 0; i--) {
      const particle = this.game.fallEffectParticles[i];
      
      // 更新位置
      particle.x += particle.velocity.x * deltaTime;
      particle.y += particle.velocity.y * deltaTime;
      
      // 更新生命值
      particle.life -= deltaTime;
      particle.alpha = (particle.life / particle.maxLife) * 0.7; // 稍微提高透明度保持
      
      // 移除过期粒子 - 基于世界坐标判断
      const cameraY = this.game.camera ? this.game.camera.y : 0;
      const screenTopY = cameraY - 100; // 屏幕上方100px处清理
      
      if (particle.life <= 0 || particle.y < screenTopY) {
        this.game.fallEffectParticles.splice(i, 1);
      }
    }
    
    // 限制粒子数量
    if (this.game.fallEffectParticles.length > 50) {
      this.game.fallEffectParticles.splice(0, this.game.fallEffectParticles.length - 50);
    }
  }

  /**
   * 获取当前主题的粒子颜色
   */
  getCurrentThemeParticleColor() {
    const layer = this.game.gameData.currentLayer;
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
    if (!this.game.backgroundParticleSystem.enabled) return;
    
    // 更新生成计时器
    this.game.backgroundParticleSystem.spawnTimer += deltaTime;
    
    // 检查是否需要生成新粒子
    const spawnInterval = 1 / this.game.backgroundParticleSystem.spawnRate;
    if (this.game.backgroundParticleSystem.spawnTimer >= spawnInterval) {
      this.spawnBackgroundParticle();
      this.game.backgroundParticleSystem.spawnTimer = 0;
    }
    
    // 更新现有粒子
    for (let i = this.game.backgroundParticles.length - 1; i >= 0; i--) {
      const particle = this.game.backgroundParticles[i];
      
      // 更新粒子生命值
      particle.life -= deltaTime;
      
      // 更新粒子位置
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // 更新粒子透明度（基于生命值，保持较高可见度）
      const lifeRatio = particle.life / particle.maxLife;
      particle.alpha = Math.max(0.4, lifeRatio); // 最低透明度0.4，避免过快消失
      
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
      if (particle.x < -50) particle.x = this.logicalWidth + 50;
      if (particle.x > this.logicalWidth + 50) particle.x = -50;
      if (particle.y < -50) particle.y = this.logicalHeight + 50;
      if (particle.y > this.logicalHeight + 50) particle.y = -50;
      
      // 移除生命值耗尽的粒子
      if (particle.life <= 0) {
        this.game.backgroundParticles.splice(i, 1);
      }
    }
    
    // 限制最大粒子数量
    if (this.game.backgroundParticles.length > this.game.backgroundParticleSystem.maxParticles) {
      this.game.backgroundParticles.splice(0, this.game.backgroundParticles.length - this.game.backgroundParticleSystem.maxParticles);
    }
  }
  
  /**
   * 生成背景粒子
   */
  spawnBackgroundParticle() {
    if (this.game.backgroundParticles.length >= this.game.backgroundParticleSystem.maxParticles) {
      return;
    }
    
    // 随机选择粒子类型
    const rand = Math.random();
    let cumulativeProbability = 0;
    let selectedType = this.game.backgroundParticleSystem.particleTypes[0];
    
    for (const type of this.game.backgroundParticleSystem.particleTypes) {
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
        x = Math.random() * this.logicalWidth;
        y = -20;
        vx = (Math.random() - 0.5) * selectedType.maxSpeed;
        vy = Math.random() * selectedType.maxSpeed * 0.5 + selectedType.minSpeed;
        break;
      case 1: // 右边
        x = this.logicalWidth + 20;
        y = Math.random() * this.logicalHeight;
        vx = -(Math.random() * selectedType.maxSpeed * 0.5 + selectedType.minSpeed);
        vy = (Math.random() - 0.5) * selectedType.maxSpeed;
        break;
      case 2: // 下边
        x = Math.random() * this.logicalWidth;
        y = this.logicalHeight + 20;
        vx = (Math.random() - 0.5) * selectedType.maxSpeed;
        vy = -(Math.random() * selectedType.maxSpeed * 0.5 + selectedType.minSpeed);
        break;
      case 3: // 左边
        x = -20;
        y = Math.random() * this.logicalHeight;
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
      pulsePhase: Math.random() * Math.PI * 2
    };
    
    // 设置最大生命值
    particle.maxLife = particle.life;
    particle.currentSize = particle.baseSize;
    
    this.game.backgroundParticles.push(particle);
  }
}