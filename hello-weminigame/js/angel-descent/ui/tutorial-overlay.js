/**
 * @file tutorial-overlay.js
 * @description 新手指引遮罩层 - 适配曲面屏和刘海屏
 */

import { SAFE_AREA, SAFE_AREA_INSETS, IS_NOTCH_SCREEN, DEBUG_INFO, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../render.js';
import { resourceManager } from '../../runtime/resource-manager.js';

/**
 * 新手指引遮罩层类
 */
export default class TutorialOverlay {
  constructor(canvas) {
    this.canvas = canvas;
    // 使用逻辑尺寸进行UI计算
    this.logicalWidth = SCREEN_WIDTH;
    this.logicalHeight = SCREEN_HEIGHT;
    // 是否显示状态
    this.isVisible = true;
    this.isComplete = false;
    
    // 动画相关
    this.fadeAlpha = 0;
    this.fadeSpeed = 3; // 淡入速度
    this.showDelay = 0.5; // 延迟显示时间（秒）
    this.currentDelay = 0;
    
    // 开始界面图像
    this.startImage = null;
    this.imageLoaded = false;
    this.loadStartImage();
    
    // 内容配置已简化，不再需要动态计算文本位置
    
    // 闪烁效果
    this.blinkTimer = 0;
    this.blinkVisible = true;
    
    // 背景装饰
    this.particles = this.generateBackgroundParticles();
    
    // 调试模式配置（可在微信开发者工具控制台中切换）
    this.debugMode = false;
    
    if (typeof GameGlobal !== 'undefined') {
      GameGlobal.tutorialOverlay = this;
    }
  }

  /**
   * 加载开始界面图像
   */
  async loadStartImage() {
    try {
      this.startImage = await resourceManager.loadImage('images/ui/bg_start.png');
      this.imageLoaded = this.startImage !== null;
    } catch (error) {
      console.warn('开始界面图像加载失败:', error);
      this.imageLoaded = false;
    }
  }

  /**
   * 更新内容位置（已简化，主要使用图像显示）
   */
  updateContentPositions() {
    // 内容配置已简化为图像显示，不再需要复杂的文本位置计算
    // 保留此方法以维持接口兼容性
  }

  /**
   * 生成背景装饰粒子 - 限制在安全区域内
   */
  generateBackgroundParticles() {
    const particles = [];
    const count = 30;
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    
    // 考虑安全区域的粒子生成范围
    const safeLeft = Math.max(SAFE_AREA_INSETS.left, 20);
    const safeRight = width - Math.max(SAFE_AREA_INSETS.right, 20);
    const safeTop = Math.max(SAFE_AREA_INSETS.top, 20);
    const safeBottom = height - Math.max(SAFE_AREA_INSETS.bottom, 20);
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: safeLeft + Math.random() * (safeRight - safeLeft),
        y: safeTop + Math.random() * (safeBottom - safeTop),
        size: Math.random() * 2 + 1,
        speed: Math.random() * 30 + 10,
        alpha: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? '#FF6666' : '#66AAFF',
        // 记录安全区域边界用于循环重置
        safeLeft: safeLeft,
        safeRight: safeRight,
        safeTop: safeTop,
        safeBottom: safeBottom
      });
    }
    
    return particles;
  }

  /**
   * 更新指引逻辑
   */
  update(deltaTime) {
    if (!this.isVisible || this.isComplete) return;
    
    // 延迟显示处理
    if (this.currentDelay < this.showDelay) {
      this.currentDelay += deltaTime;
      return;
    }
    
    // 淡入动画
    if (this.fadeAlpha < 1) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + this.fadeSpeed * deltaTime);
    }
    
    // 闪烁效果（用于后备文本显示）
    this.blinkTimer += deltaTime;
    if (this.blinkTimer >= 1 / 2) { // 固定闪烁速度：每秒2次
      this.blinkVisible = !this.blinkVisible;
      this.blinkTimer = 0;
    }
    
    // 更新背景粒子
    this.updateBackgroundParticles(deltaTime);
  }

  /**
   * 更新背景粒子 - 在安全区域内循环
   */
  updateBackgroundParticles(deltaTime) {
    for (const particle of this.particles) {
      particle.y += particle.speed * deltaTime;
      
      // 粒子循环 - 在安全区域内重置
      if (particle.y > particle.safeBottom + 10) {
        particle.y = particle.safeTop - 10;
        particle.x = particle.safeLeft + Math.random() * (particle.safeRight - particle.safeLeft);
      }
    }
  }

  /**
   * 处理触摸事件（点击开始）
   */
  handleTouch(e) {
    if (!this.isVisible || this.isComplete) return false;
    
    // 如果还在延迟显示期间，不响应点击
    if (this.currentDelay < this.showDelay) return false;
    
    // 点击任意位置开始游戏
    this.startGame();
    return true; // 表示事件已被处理
  }

  /**
   * 开始游戏（隐藏指引）
   */
  startGame() {
    this.isVisible = false;
    this.isComplete = true;
    // 新手指引完成，开始游戏
  }

  /**
   * 渲染指引界面
   */
  render(ctx) {
    if (!this.isVisible || this.isComplete) return;
    
    // 如果还在延迟期，不渲染
    if (this.currentDelay < this.showDelay) return;
    
    ctx.save();
    
    // 应用淡入透明度
    ctx.globalAlpha = this.fadeAlpha;
    
    // 第一层：绘制半透明背景覆盖层（最底层）
    this.renderBackground(ctx);
    
    // 第二层：绘制开始界面图像（在背景覆盖之上）
    if (this.imageLoaded && this.startImage) {
      this.renderStartImage(ctx, this.logicalWidth, this.logicalHeight);
    }
    
    // 第三层：绘制背景粒子装饰
    this.renderBackgroundParticles(ctx);
    
    // 第四层：绘制后备内容（如果图像未加载）
    if (!this.imageLoaded || !this.startImage) {
      this.renderFallbackContent(ctx, this.logicalWidth, this.logicalHeight);
    } else {
      // 图像已加载时，仍然显示闪烁的"点击开始"文字
      this.renderStartPrompt(ctx, this.logicalWidth, this.logicalHeight);
    }
    
    // 顶层：绘制调试覆盖层（如果启用）
    this.renderDebugOverlay(ctx);
    
    ctx.restore();
  }

  /**
   * 渲染背景 - 确保完全覆盖整个屏幕包括刘海区域
   */
  renderBackground(ctx) {
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    
    // 扩展绘制区域，确保完全覆盖包括边缘
    const extraMargin = 50; // 额外边距确保完全覆盖
    
    // 深色半透明背景覆盖层，让底层图像仍然可见
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // 降低透明度，让底层图像透出
    ctx.fillRect(-extraMargin, -extraMargin, width + extraMargin * 2, height + extraMargin * 2);
    
    // 装饰边框
    this.renderDecorationBorder(ctx, width, height);
  }

  /**
   * 渲染装饰边框
   */
  renderDecorationBorder(ctx, width, height) {
    // 移除装饰边框，保持纯净的教程界面
    // 原来的上下横线装饰已被移除，避免界面混乱
  }

  /**
   * 渲染背景装饰粒子
   */
  renderBackgroundParticles(ctx) {
    ctx.save();
    
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.alpha * this.fadeAlpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  /**
   * 渲染主要内容（已移至 render 方法中按层级渲染）
   */
  renderContent(ctx) {
    // 内容渲染已移至主 render 方法中，按正确的层级顺序渲染
    // 保留此方法以维持接口兼容性
  }

  /**
   * 渲染开始界面图像
   */
  renderStartImage(ctx, width, height) {
    ctx.save();
    
    // 计算图像缩放：水平方向填满屏幕
    const imageAspectRatio = this.startImage.width / this.startImage.height;
    
    // 以屏幕宽度为准缩放图像
    const drawWidth = width;
    const drawHeight = drawWidth / imageAspectRatio;
    
    // 水平居中（贴边），垂直居中
    const drawX = 0; // 贴左边
    const drawY = (height - drawHeight) / 2;
    
    // 应用渐变透明度
    ctx.globalAlpha = this.fadeAlpha;
    
    // 绘制图像（作为底层背景）
    ctx.drawImage(
      this.startImage,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
    
    ctx.restore();
  }


  /**
   * 渲染后备内容（图像未加载时）
   */
  renderFallbackContent(ctx, width, height) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 简化版的开始提示
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('天使下凡一百层', width / 2, height / 2 - 60);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('穿越100层天界，抵达人间完成使命', width / 2, height / 2 - 20);
    
    // 闪烁的开始提示
    if (this.blinkVisible) {
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#00FF88';
      ctx.fillText('点击屏幕任意位置开始游戏', width / 2, height / 2 + 40);
    }
  }

  /**
   * 渲染开始提示文字（图像已加载时显示在图像上方）
   */
  renderStartPrompt(ctx, width, height) {
    if (!this.blinkVisible) return;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 闪烁的"点击开始"文字
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#00FF88';
    
    // 添加文字描边效果，让文字在图像上更清晰
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('点击开始', width / 2, height - 80);
    ctx.fillText('点击开始', width / 2, height - 80);
    
    ctx.restore();
  }


  /**
   * 重置指引状态（用于游戏重启）
   */
  reset() {
    this.isVisible = true;
    this.isComplete = false;
    this.fadeAlpha = 0;
    this.currentDelay = 0;
    this.blinkTimer = 0;
    this.blinkVisible = true;
    this.particles = this.generateBackgroundParticles();
    
    // 如果图像尚未加载，重新尝试加载
    if (!this.imageLoaded) {
      this.loadStartImage();
    }
    
    // 已重置新手指引状态
  }

  /**
   * 检查是否已完成指引
   */
  isCompleted() {
    return this.isComplete;
  }

  /**
   * 检查是否正在显示指引
   */
  isShowing() {
    return this.isVisible && !this.isComplete;
  }

  /**
   * 启用调试模式 - 可视化显示安全区域和覆盖区域
   */
  enableDebugMode() {
    this.debugMode = true;
  }

  /**
   * 关闭调试模式
   */
  disableDebugMode() {
    this.debugMode = false;
  }

  /**
   * 渲染调试信息 - 显示安全区域边界和覆盖区域
   */
  renderDebugOverlay(ctx) {
    if (!this.debugMode) return;
    
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    
    ctx.save();
    ctx.globalAlpha = 0.8;
    
    // 显示安全区域边界（绿色）
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(
      SAFE_AREA_INSETS.left,
      SAFE_AREA_INSETS.top,
      width - SAFE_AREA_INSETS.left - SAFE_AREA_INSETS.right,
      height - SAFE_AREA_INSETS.top - SAFE_AREA_INSETS.bottom
    );
    
    // 显示不安全区域（红color半透明）
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    
    // 顶部不安全区域
    if (SAFE_AREA_INSETS.top > 0) {
      ctx.fillRect(0, 0, width, SAFE_AREA_INSETS.top);
    }
    
    // 底部不安全区域
    if (SAFE_AREA_INSETS.bottom > 0) {
      ctx.fillRect(0, height - SAFE_AREA_INSETS.bottom, width, SAFE_AREA_INSETS.bottom);
    }
    
    // 左侧不安全区域
    if (SAFE_AREA_INSETS.left > 0) {
      ctx.fillRect(0, 0, SAFE_AREA_INSETS.left, height);
    }
    
    // 右侧不安全区域
    if (SAFE_AREA_INSETS.right > 0) {
      ctx.fillRect(width - SAFE_AREA_INSETS.right, 0, SAFE_AREA_INSETS.right, height);
    }
    
    // 显示屏幕类型信息
    ctx.fillStyle = '#FFFF00';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    const debugText = [
      `屏幕类型: ${IS_NOTCH_SCREEN ? '异形屏幕' : '普通屏幕'}`,
      `Canvas尺寸: ${width} x ${height}`,
      `安全区域边距: T:${SAFE_AREA_INSETS.top} L:${SAFE_AREA_INSETS.left} R:${SAFE_AREA_INSETS.right} B:${SAFE_AREA_INSETS.bottom}`,
      `安全区域尺寸: ${SAFE_AREA.width} x ${SAFE_AREA.height}`
    ];
    
    debugText.forEach((text, index) => {
      ctx.fillText(text, 20, 30 + index * 25);
    });
    
    ctx.restore();
  }
}