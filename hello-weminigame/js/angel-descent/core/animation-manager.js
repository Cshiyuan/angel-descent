/**
 * @file animation-manager.js
 * @description 动画管理器 - 管理多个动画并处理状态切换
 */

import Animation, { ANIMATION_STATES, LOOP_MODES } from './animation.js';

/**
 * 动画切换模式枚举
 */
export const TRANSITION_MODES = {
  IMMEDIATE: 'immediate',     // 立即切换
  SMOOTH: 'smooth',          // 平滑过渡
  WAIT_COMPLETE: 'wait_complete' // 等待当前动画完成
};

/**
 * AnimationManager 类
 * 
 * 管理多个动画实例，处理动画之间的切换和状态管理
 * 提供统一的动画控制接口
 */
export default class AnimationManager {
  /**
   * 构造函数
   * 
   * @param {Object} options - 配置选项
   * @param {string} options.defaultTransitionMode - 默认切换模式
   * @param {number} options.transitionDuration - 切换持续时间（秒）
   */
  constructor(options = {}) {
    // 动画存储
    this.animations = new Map(); // 存储所有动画实例
    this.currentAnimation = null; // 当前播放的动画
    this.previousAnimation = null; // 之前的动画
    
    // 切换配置
    this.defaultTransitionMode = options.defaultTransitionMode || TRANSITION_MODES.IMMEDIATE;
    this.transitionDuration = options.transitionDuration || 0.2;
    
    // 切换状态
    this.isTransitioning = false;
    this.transitionElapsed = 0;
    this.transitionMode = TRANSITION_MODES.IMMEDIATE;
    
    // 回调函数
    this.onAnimationChange = null; // 动画切换完成回调
    this.onTransitionStart = null; // 切换开始回调
    this.onTransitionEnd = null;   // 切换结束回调
    
    // 渲染混合配置
    this.enableBlending = true; // 是否启用动画混合
    this.blendAlpha = 0.5; // 混合透明度
  }
  
  /**
   * 添加动画
   * 
   * @param {string} name - 动画名称
   * @param {Array<Image>} frames - 动画帧数组
   * @param {Object} options - 动画配置选项
   * @returns {Animation} 创建的动画实例
   */
  addAnimation(name, frames, options = {}) {
    const animation = new Animation(name, frames, options);
    this.animations.set(name, animation);
    
    // 如果是第一个动画，设置为当前动画
    if (this.animations.size === 1 && !this.currentAnimation) {
      this.currentAnimation = animation;
    }
    
    return animation;
  }
  
  /**
   * 移除动画
   * 
   * @param {string} name - 动画名称
   * @returns {boolean} 是否成功移除
   */
  removeAnimation(name) {
    const animation = this.animations.get(name);
    if (!animation) {
      return false;
    }
    
    // 如果移除的是当前动画，清空当前动画
    if (this.currentAnimation === animation) {
      this.currentAnimation = null;
    }
    
    // 如果移除的是之前的动画，清空之前动画
    if (this.previousAnimation === animation) {
      this.previousAnimation = null;
    }
    
    return this.animations.delete(name);
  }
  
  /**
   * 获取动画
   * 
   * @param {string} name - 动画名称
   * @returns {Animation|null} 动画实例
   */
  getAnimation(name) {
    return this.animations.get(name) || null;
  }
  
  /**
   * 切换到指定动画
   * 
   * @param {string} name - 动画名称
   * @param {string} transitionMode - 切换模式（可选）
   * @param {Object} options - 切换选项
   * @param {boolean} options.reset - 是否重置动画到开始位置
   * @param {boolean} options.forceChange - 是否强制切换（即使是同一个动画）
   * @returns {boolean} 是否成功切换
   */
  playAnimation(name, transitionMode = null, options = {}) {
    const targetAnimation = this.animations.get(name);
    if (!targetAnimation) {
      console.warn(`动画 '${name}' 不存在`);
      return false;
    }
    
    // 如果已经是当前动画且没有强制切换，直接返回
    if (this.currentAnimation === targetAnimation && !options.forceChange) {
      return true;
    }
    
    // 确定切换模式
    const actualTransitionMode = transitionMode || this.defaultTransitionMode;
    
    // 检查是否需要等待当前动画完成
    if (actualTransitionMode === TRANSITION_MODES.WAIT_COMPLETE && 
        this.currentAnimation && 
        this.currentAnimation.isPlaying() && 
        !this.currentAnimation.isFinished()) {
      // 设置延迟切换
      this.scheduleDelayedTransition(name, options);
      return true;
    }
    
    // 执行切换
    this.executeTransition(targetAnimation, actualTransitionMode, options);
    return true;
  }
  
  /**
   * 执行动画切换
   * 
   * @param {Animation} targetAnimation - 目标动画
   * @param {string} transitionMode - 切换模式
   * @param {Object} options - 切换选项
   * @private
   */
  executeTransition(targetAnimation, transitionMode, options = {}) {
    // 触发切换开始回调
    if (this.onTransitionStart) {
      this.onTransitionStart(this.currentAnimation, targetAnimation);
    }
    
    // 保存之前的动画
    this.previousAnimation = this.currentAnimation;
    
    // 设置新的当前动画
    this.currentAnimation = targetAnimation;
    
    // 重置动画（如果需要）
    if (options.reset !== false) {
      this.currentAnimation.reset();
    }
    
    // 开始播放新动画
    this.currentAnimation.play();
    
    // 根据切换模式处理
    switch (transitionMode) {
      case TRANSITION_MODES.IMMEDIATE:
        this.completeTransition();
        break;
        
      case TRANSITION_MODES.SMOOTH:
        this.startSmoothTransition();
        break;
        
      default:
        this.completeTransition();
        break;
    }
  }
  
  /**
   * 开始平滑切换
   * @private
   */
  startSmoothTransition() {
    this.isTransitioning = true;
    this.transitionElapsed = 0;
    this.transitionMode = TRANSITION_MODES.SMOOTH;
  }
  
  /**
   * 完成切换
   * @private
   */
  completeTransition() {
    this.isTransitioning = false;
    this.transitionElapsed = 0;
    
    // 停止之前的动画
    if (this.previousAnimation) {
      this.previousAnimation.stop();
    }
    
    // 触发切换完成回调
    if (this.onAnimationChange) {
      this.onAnimationChange(this.previousAnimation, this.currentAnimation);
    }
    
    // 触发切换结束回调
    if (this.onTransitionEnd) {
      this.onTransitionEnd(this.previousAnimation, this.currentAnimation);
    }
    
    this.previousAnimation = null;
  }
  
  /**
   * 调度延迟切换
   * 
   * @param {string} animationName - 动画名称
   * @param {Object} options - 切换选项
   * @private
   */
  scheduleDelayedTransition(animationName, options) {
    // 为当前动画设置完成回调来触发延迟切换
    const originalOnComplete = this.currentAnimation.onComplete;
    
    this.currentAnimation.onComplete = (animation) => {
      // 调用原始回调
      if (originalOnComplete) {
        originalOnComplete(animation);
      }
      
      // 执行延迟切换
      this.playAnimation(animationName, TRANSITION_MODES.IMMEDIATE, options);
      
      // 恢复原始回调
      animation.onComplete = originalOnComplete;
    };
  }
  
  /**
   * 更新动画管理器
   * 
   * @param {number} deltaTime - 时间间隔（秒）
   */
  update(deltaTime) {
    // 更新当前动画
    if (this.currentAnimation) {
      this.currentAnimation.update(deltaTime);
    }
    
    // 如果正在过渡，更新过渡动画
    if (this.isTransitioning) {
      this.updateTransition(deltaTime);
    }
  }
  
  /**
   * 更新切换过渡
   * 
   * @param {number} deltaTime - 时间间隔（秒）
   * @private
   */
  updateTransition(deltaTime) {
    this.transitionElapsed += deltaTime;
    
    // 更新之前的动画（如果存在）
    if (this.previousAnimation) {
      this.previousAnimation.update(deltaTime);
    }
    
    // 检查切换是否完成
    if (this.transitionElapsed >= this.transitionDuration) {
      this.completeTransition();
    }
  }
  
  /**
   * 获取当前帧用于渲染
   * 
   * @returns {Image|null} 当前应该渲染的帧
   */
  getCurrentFrame() {
    if (!this.currentAnimation) {
      return null;
    }
    
    // 如果正在过渡且启用了混合
    if (this.isTransitioning && this.enableBlending && this.previousAnimation) {
      // 返回当前动画的帧（混合逻辑在渲染时处理）
      return this.currentAnimation.getCurrentFrame();
    }
    
    return this.currentAnimation.getCurrentFrame();
  }
  
  /**
   * 获取混合信息（用于渲染时的动画混合）
   * 
   * @returns {Object|null} 混合信息
   */
  getBlendInfo() {
    if (!this.isTransitioning || !this.enableBlending || !this.previousAnimation) {
      return null;
    }
    
    const progress = this.transitionElapsed / this.transitionDuration;
    
    return {
      previousFrame: this.previousAnimation.getCurrentFrame(),
      currentFrame: this.currentAnimation.getCurrentFrame(),
      blendFactor: progress, // 0 = 完全显示previous, 1 = 完全显示current
      blendAlpha: this.blendAlpha
    };
  }
  
  /**
   * 暂停所有动画
   */
  pauseAll() {
    for (const animation of this.animations.values()) {
      animation.pause();
    }
  }
  
  /**
   * 恢复所有动画
   */
  resumeAll() {
    for (const animation of this.animations.values()) {
      if (animation.state === ANIMATION_STATES.PAUSED) {
        animation.play();
      }
    }
  }
  
  /**
   * 停止所有动画
   */
  stopAll() {
    for (const animation of this.animations.values()) {
      animation.stop();
    }
    
    this.currentAnimation = null;
    this.previousAnimation = null;
    this.isTransitioning = false;
  }
  
  /**
   * 获取当前动画名称
   * 
   * @returns {string|null} 当前动画名称
   */
  getCurrentAnimationName() {
    return this.currentAnimation ? this.currentAnimation.name : null;
  }
  
  /**
   * 检查是否有指定动画
   * 
   * @param {string} name - 动画名称
   * @returns {boolean} 是否存在该动画
   */
  hasAnimation(name) {
    return this.animations.has(name);
  }
  
  /**
   * 获取所有动画名称
   * 
   * @returns {Array<string>} 动画名称数组
   */
  getAnimationNames() {
    return Array.from(this.animations.keys());
  }
  
  /**
   * 设置默认切换模式
   * 
   * @param {string} mode - 切换模式
   */
  setDefaultTransitionMode(mode) {
    if (Object.values(TRANSITION_MODES).includes(mode)) {
      this.defaultTransitionMode = mode;
    }
  }
  
  /**
   * 启用/禁用动画混合
   * 
   * @param {boolean} enable - 是否启用
   */
  setBlendingEnabled(enable) {
    this.enableBlending = enable;
  }
  
  /**
   * 获取管理器状态信息
   * 
   * @returns {Object} 状态信息
   */
  getInfo() {
    return {
      animationCount: this.animations.size,
      currentAnimation: this.currentAnimation ? this.currentAnimation.name : null,
      isTransitioning: this.isTransitioning,
      transitionProgress: this.isTransitioning ? 
        (this.transitionElapsed / this.transitionDuration) : 0,
      enableBlending: this.enableBlending
    };
  }
}