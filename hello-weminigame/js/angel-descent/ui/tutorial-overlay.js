/**
 * @file tutorial-overlay.js
 * @description 新手指引遮罩层 - 适配曲面屏和刘海屏
 */

import { SAFE_AREA, SAFE_AREA_INSETS, IS_NOTCH_SCREEN, DEBUG_INFO } from '../../render.js';

/**
 * 新手指引遮罩层类
 */
export default class TutorialOverlay {
  constructor(canvas) {
    this.canvas = canvas;
    // 是否显示状态
    this.isVisible = true;
    this.isComplete = false;
    
    // 动画相关
    this.fadeAlpha = 0;
    this.fadeSpeed = 3; // 淡入速度
    this.showDelay = 0.5; // 延迟显示时间（秒）
    this.currentDelay = 0;
    
    // 文本内容配置（动态计算位置）
    this.updateContentPositions();
    
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
   * 更新内容位置（基于实际canvas尺寸和安全区域）
   */
  updateContentPositions() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 计算安全区域内的有效显示区域
    const safeTop = SAFE_AREA_INSETS.top;
    const safeBottom = SAFE_AREA_INSETS.bottom;
    const safeHeight = height - safeTop - safeBottom;
    const contentStartY = safeTop + safeHeight * 0.1; // 从安全区域的10%开始
    
    this.content = {
      title: {
        text: '天使下凡一百层',
        fontSize: 40,
        color: '#FFD700',
        y: contentStartY + safeHeight * 0.08
      },
      subtitle: {
        text: '挑战百层天界试炼',
        fontSize: 22,
        color: '#FFFFFF',
        y: contentStartY + safeHeight * 0.15
      },
      instructions: [
        {
          text: '游戏目标：',
          fontSize: 26,
          color: '#FFCC00',
          y: contentStartY + safeHeight * 0.25
        },
        {
          text: '穿越100层天界，抵达人间完成使命',
          fontSize: 20,
          color: '#CCCCCC',
          y: contentStartY + safeHeight * 0.31
        },
        {
          text: '操作方法：',
          fontSize: 26,
          color: '#FFCC00',
          y: contentStartY + safeHeight * 0.38
        },
        {
          text: '点击屏幕左半部分 → 向左移动',
          fontSize: 20,
          color: '#CCCCCC',
          y: contentStartY + safeHeight * 0.44
        },
        {
          text: '点击屏幕右半部分 → 向右移动',
          fontSize: 20,
          color: '#CCCCCC',
          y: contentStartY + safeHeight * 0.49
        },
        {
          text: '小心！控制下凡速度避免坠落过快',
          fontSize: 20,
          color: '#FF6666',
          y: contentStartY + safeHeight * 0.75
        }
      ],
      startHint: {
        text: '点击屏幕任意位置开始游戏',
        fontSize: 22,
        color: '#00FF88',
        y: contentStartY + safeHeight * 0.82,
        blinking: true,
        blinkSpeed: 2
      }
    };
  }

  /**
   * 生成背景装饰粒子 - 限制在安全区域内
   */
  generateBackgroundParticles() {
    const particles = [];
    const count = 30;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
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
    
    // 闪烁效果
    this.blinkTimer += deltaTime;
    if (this.blinkTimer >= 1 / this.content.startHint.blinkSpeed) {
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
    
    // 绘制半透明背景
    this.renderBackground(ctx);
    
    // 绘制背景粒子装饰
    this.renderBackgroundParticles(ctx);
    
    // 绘制主要内容
    this.renderContent(ctx);
    
    // 绘制调试覆盖层（如果启用）
    this.renderDebugOverlay(ctx);
    
    ctx.restore();
  }

  /**
   * 渲染背景 - 确保完全覆盖整个屏幕包括刘海区域
   */
  renderBackground(ctx) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 扩展绘制区域，确保完全覆盖包括边缘
    const extraMargin = 50; // 额外边距确保完全覆盖
    
    // 深色半透明背景，使用扩展区域覆盖
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
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
   * 渲染主要内容
   */
  renderContent(ctx) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 绘制标题
    this.renderTitle(ctx, width);
    
    // 绘制副标题
    this.renderSubtitle(ctx, width);
    
    // 绘制操作说明
    this.renderInstructions(ctx, width);
    
    // 绘制开始提示（带闪烁效果）
    this.renderStartHint(ctx, width);
    
    // 绘制可视化操作区域提示
    this.renderControlAreas(ctx, width, height);
  }

  /**
   * 渲染标题
   */
  renderTitle(ctx, width) {
    const title = this.content.title;
    ctx.font = `bold ${title.fontSize}px Arial`;
    ctx.fillStyle = title.color;
    
    
    ctx.fillText(title.text, width / 2, title.y);
    
  }

  /**
   * 渲染副标题
   */
  renderSubtitle(ctx, width) {
    const subtitle = this.content.subtitle;
    ctx.font = `${subtitle.fontSize}px Arial`;
    ctx.fillStyle = subtitle.color;
    ctx.fillText(subtitle.text, width / 2, subtitle.y);
  }

  /**
   * 渲染操作说明
   */
  renderInstructions(ctx, width) {
    for (const instruction of this.content.instructions) {
      ctx.font = `${instruction.fontSize}px Arial`;
      ctx.fillStyle = instruction.color;
      ctx.fillText(instruction.text, width / 2, instruction.y);
    }
  }

  /**
   * 渲染开始提示
   */
  renderStartHint(ctx, width) {
    const hint = this.content.startHint;
    
    // 闪烁效果
    if (!hint.blinking || this.blinkVisible) {
      ctx.font = `${hint.fontSize}px Arial`;
      ctx.fillStyle = hint.color;
      
      // 添加发光效果
      
      ctx.fillText(hint.text, width / 2, hint.y);
      
    }
  }

  /**
   * 渲染可视化操作区域提示 - 适配安全区域
   */
  renderControlAreas(ctx, width, height) {
    ctx.save();
    ctx.globalAlpha = 0.3 * this.fadeAlpha;
    
    const centerX = width / 2;
    const safeTop = SAFE_AREA_INSETS.top;
    const safeBottom = SAFE_AREA_INSETS.bottom;
    const safeHeight = height - safeTop - safeBottom;
    
    // 操作区域位置调整到安全区域内，避免与文字重叠
    const areaY = safeTop + safeHeight * 0.62;
    const areaHeight = safeHeight * 0.12;
    
    // 左侧区域 - 左移（考虑左侧安全区域）
    const leftStart = Math.max(SAFE_AREA_INSETS.left, 0);
    const leftWidth = centerX - 2 - leftStart;
    ctx.fillStyle = '#FF6666';
    ctx.fillRect(leftStart, areaY, leftWidth, areaHeight);
    
    // 右侧区域 - 右移（考虑右侧安全区域）
    const rightStart = centerX + 2;
    const rightWidth = width - rightStart - Math.max(SAFE_AREA_INSETS.right, 0);
    ctx.fillStyle = '#66AAFF';
    ctx.fillRect(rightStart, areaY, rightWidth, areaHeight);
    
    // 中间分界线
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(centerX - 1, areaY, 2, areaHeight);
    
    ctx.restore();
    
    // 区域标签
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    
    
    // 标签位置也要考虑安全区域
    const leftLabelX = leftStart + leftWidth / 2;
    const rightLabelX = rightStart + rightWidth / 2;
    
    ctx.fillText('← 左移', leftLabelX, areaY + areaHeight / 2);
    ctx.fillText('右移 →', rightLabelX, areaY + areaHeight / 2);
    
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
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
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