/**
 * @file render-manager.js
 * @description 天使下凡一百层游戏渲染管理器
 */

/**
 * 渲染管理器 - 负责处理所有渲染相关的功能
 */
export default class RenderManager {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;
  }

  /**
   * 主渲染入口 - 渲染整个游戏画面
   */
  render() {
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 首先渲染静态背景（不受摄像机影响）
    this.renderBackground();
    this.renderBackgroundParticles(); // 背景粒子也应该静态，不跟随摄像机
    
    // 应用摄像机变换
    if (this.game.camera) {
      const offset = this.game.camera.getOffset();
      this.ctx.save();
      this.ctx.translate(offset.x, offset.y);
    }
    
    // 渲染游戏世界中需要跟随摄像机的元素
    this.renderPlatforms();
    this.renderLifeFruits();
    this.renderPlayer();
    this.renderFallEffectParticles();
    
    // 恢复摄像机变换
    if (this.game.camera) {
      this.ctx.restore();
    }
    
    // 渲染UI（不受摄像机影响）
    this.renderUI();
  }

  /**
   * 渲染背景
   */
  renderBackground() {
    if (this.game.backgroundTransition.active && this.game.previousBackgroundTheme) {
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
    const layer = this.game.gameData.currentLayer;
    const themeInfo = this.game.levelGenerator.getThemeInfo(layer);
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
    const previousImage = this.game.backgroundImages.get(this.game.previousBackgroundTheme);
    const currentImage = this.game.backgroundImages.get(this.game.currentBackgroundTheme);
    
    // 计算透明度（使用缓动函数创建平滑过渡）
    const progress = this.game.backgroundTransition.progress;
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
      this.renderGradientBackgroundForTheme(this.game.previousBackgroundTheme);
    }
    
    // 渲染当前背景（作为顶层）
    if (currentImage && currentAlpha > 0) {
      this.ctx.globalAlpha = currentAlpha;
      this.renderImageBackground(currentImage);
    } else if (currentAlpha > 0) {
      // 如果没有图像，使用渐变背景
      this.ctx.globalAlpha = currentAlpha;
      this.renderGradientBackgroundForTheme(this.game.currentBackgroundTheme);
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
    if (!this.game.backgroundLoaded || !this.game.backgroundImages) {
      return null;
    }
    
    // 根据当前主题获取对应的背景图像
    return this.game.backgroundImages.get(this.game.currentBackgroundTheme) || null;
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
    const layer = this.game.gameData.currentLayer;
    const themeInfo = this.game.levelGenerator.getThemeInfo(layer);
    
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
    // 滚动背景纹理功能已移除
    // 现在完全依赖图像背景，不再绘制程序化纹理
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
    const offset = this.game.camera.getOffset();
    const visibleTop = -offset.y - 200; // 进一步扩展上边界以配合新视野
    const visibleBottom = -offset.y + this.canvas.height + 300; // 进一步扩展下边界以配合新视野
    
    for (const platform of this.game.platforms) {
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
    const offset = this.game.camera.getOffset();
    const visibleTop = -offset.y - 200;
    const visibleBottom = -offset.y + this.canvas.height + 300;
    
    for (const lifeFruit of this.game.lifeFruits) {
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
    if (!this.game.player) return;
    
    // 使用Player类的render方法
    this.game.player.render(this.ctx);
  }

  /**
   * 渲染背景飘浮微粒
   */
  renderBackgroundParticles() {
    if (!this.game.backgroundParticleSystem.enabled || this.game.backgroundParticles.length === 0) return;
    
    this.ctx.save();
    
    for (const particle of this.game.backgroundParticles) {
      // 设置粒子透明度
      this.ctx.globalAlpha = Math.min(1.0, particle.alpha * 1.2); // 进一步提高透明度
      
      // 设置粒子样式并渲染为简单圆形
      this.ctx.fillStyle = particle.color;
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
    if (this.game.fallEffectParticles.length === 0) return;
    
    this.ctx.save();
    
    for (const particle of this.game.fallEffectParticles) {
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
    const currentTheme = this.game.getCurrentBackgroundTheme();
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
    const displayLayer = this.game.gameData.maxLayer - this.game.gameData.currentLayer + 1;
    this.ctx.fillText(`第 ${displayLayer} 层`, textX, textStartY);
    
    // 渲染主题名称（副标题）
    const themeInfo = this.game.levelGenerator.getThemeInfo(this.game.gameData.currentLayer);
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
    
    if (this.game.livesDisplayEffect.isChanged) {
      const flashFactor = this.game.livesDisplayEffect.flashIntensity;
      
      if (this.game.livesDisplayEffect.changeType === 'gain') {
        // 获得法力：绿色闪烁
        labelColor = `rgb(${Math.floor(255 - 179 * flashFactor)}, 255, ${Math.floor(255 - 155 * flashFactor)})`;
        labelSize = 14 + 3 * flashFactor; // 变大效果
      } else if (this.game.livesDisplayEffect.changeType === 'lose') {
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
    const livesText = `${this.game.player ? this.game.player.lives : 0}`;
    this.ctx.save();
    
    // 根据法力值变化调整文字效果
    let textColor = '#FFFFFF';
    let fontSize = 16;
    
    if (this.game.livesDisplayEffect.isChanged) {
      const flashFactor = this.game.livesDisplayEffect.flashIntensity;
      
      if (this.game.livesDisplayEffect.changeType === 'gain') {
        // 获得法力：绿色文字
        textColor = `rgb(${Math.floor(255 - 179 * flashFactor)}, 255, ${Math.floor(255 - 155 * flashFactor)})`;
        fontSize = 16 + 4 * flashFactor;
      } else if (this.game.livesDisplayEffect.changeType === 'lose') {
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
    const currentTheme = this.game.getCurrentBackgroundTheme();
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
    
    // 美术风格的暂停界面（只在真正暂停时显示，胜利状态不显示）
    if (this.game.paused && this.game.currentState === 'paused') {
      this.renderPauseOverlay();
    }
    
    // 游戏失败提示
    if (this.game.currentState === 'game_over') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // 根据失败原因显示不同的标题和消息
      const failureInfo = this.getFailureMessage(this.game.gameOverReason);
      
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
      this.ctx.fillText('点击屏幕立即重试 或 3秒后自动重新开始', this.canvas.width/2, this.canvas.height/2 + 40);
      // 显示倒数层数：实际第1层显示为第100层
      const deepestDisplayLayer = this.game.gameData.maxLayer - this.game.gameData.currentLayer + 1;
      this.ctx.fillText(`最深到达第 ${deepestDisplayLayer} 层`, this.canvas.width/2, this.canvas.height/2 + 70);
    }
    
    // 游戏完成提示
    if (this.game.currentState === 'level_complete') {
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
          message: '在茫茫云海中迷失了方向...',
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
}