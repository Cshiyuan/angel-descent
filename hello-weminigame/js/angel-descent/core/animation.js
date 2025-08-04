/**
 * @file animation.js
 * @description 游戏动画系统 - 帧序列动画播放器
 */

/**
 * 动画播放状态枚举
 */
export const ANIMATION_STATES = {
  STOPPED: 'stopped',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished'
};

/**
 * 动画循环模式枚举
 */
export const LOOP_MODES = {
  NONE: 'none',           // 播放一次后停止
  LOOP: 'loop',           // 无限循环
  PING_PONG: 'ping_pong'  // 来回播放
};

/**
 * Animation 类
 * 
 * 处理帧序列动画的播放、暂停、循环等功能
 * 支持多种播放模式和速度控制
 */
export default class Animation {
  /**
   * 构造函数
   * 
   * @param {string} name - 动画名称
   * @param {Array<Image>} frames - 动画帧数组
   * @param {Object} options - 动画配置选项
   * @param {number} options.frameRate - 帧率（帧/秒，默认10）
   * @param {string} options.loopMode - 循环模式（默认'loop'）
   * @param {boolean} options.autoStart - 是否自动开始播放（默认false）
   */
  constructor(name, frames = [], options = {}) {
    this.name = name;
    this.frames = frames;
    
    // 播放控制
    this.frameRate = options.frameRate || 10; // 帧率：帧/秒
    this.frameDuration = 1.0 / this.frameRate; // 每帧持续时间：秒
    this.loopMode = options.loopMode || LOOP_MODES.LOOP;
    this.autoStart = options.autoStart || false;
    
    // 播放状态
    this.state = ANIMATION_STATES.STOPPED;
    this.currentFrameIndex = 0;
    this.elapsedTime = 0;
    this.totalTime = this.frames.length * this.frameDuration;
    
    // 方向控制（用于ping-pong模式）
    this.playDirection = 1; // 1: 正向, -1: 反向
    
    // 回调函数
    this.onComplete = null; // 动画完成回调
    this.onLoop = null;     // 动画循环回调
    this.onFrameChange = null; // 帧变化回调
    
    // 如果设置了自动开始，则开始播放
    if (this.autoStart) {
      this.play();
    }
  }
  
  /**
   * 添加动画帧
   * 
   * @param {Image} frame - 动画帧图像
   */
  addFrame(frame) {
    if (frame) {
      this.frames.push(frame);
      this.totalTime = this.frames.length * this.frameDuration;
    }
  }
  
  /**
   * 设置动画帧
   * 
   * @param {Array<Image>} frames - 动画帧数组
   */
  setFrames(frames) {
    this.frames = frames || [];
    this.totalTime = this.frames.length * this.frameDuration;
    this.reset();
  }
  
  /**
   * 开始播放动画
   */
  play() {
    if (this.state === ANIMATION_STATES.FINISHED && this.loopMode === LOOP_MODES.NONE) {
      this.reset();
    }
    this.state = ANIMATION_STATES.PLAYING;
  }
  
  /**
   * 暂停动画
   */
  pause() {
    if (this.state === ANIMATION_STATES.PLAYING) {
      this.state = ANIMATION_STATES.PAUSED;
    }
  }
  
  /**
   * 停止动画
   */
  stop() {
    this.state = ANIMATION_STATES.STOPPED;
    this.reset();
  }
  
  /**
   * 重置动画到初始状态
   */
  reset() {
    this.currentFrameIndex = 0;
    this.elapsedTime = 0;
    this.playDirection = 1;
  }
  
  /**
   * 更新动画
   * 
   * @param {number} deltaTime - 时间间隔（秒）
   */
  update(deltaTime) {
    if (this.state !== ANIMATION_STATES.PLAYING || this.frames.length === 0) {
      return;
    }
    
    this.elapsedTime += deltaTime;
    
    // 计算当前应该显示的帧
    const previousFrameIndex = this.currentFrameIndex;
    this.updateFrameIndex(deltaTime);
    
    // 如果帧发生变化，触发回调
    if (previousFrameIndex !== this.currentFrameIndex && this.onFrameChange) {
      this.onFrameChange(this.currentFrameIndex, this.getCurrentFrame());
    }
  }
  
  /**
   * 更新帧索引
   * 
   * @param {number} deltaTime - 时间间隔（秒）
   * @private
   */
  updateFrameIndex(deltaTime) {
    const frameCount = this.frames.length;
    
    if (frameCount <= 1) {
      return;
    }
    
    switch (this.loopMode) {
      case LOOP_MODES.NONE:
        this.updateFrameIndexOnce();
        break;
        
      case LOOP_MODES.LOOP:
        this.updateFrameIndexLoop();
        break;
        
      case LOOP_MODES.PING_PONG:
        this.updateFrameIndexPingPong(deltaTime);
        break;
    }
  }
  
  /**
   * 更新帧索引 - 播放一次模式
   * @private
   */
  updateFrameIndexOnce() {
    const newFrameIndex = Math.floor(this.elapsedTime / this.frameDuration);
    
    if (newFrameIndex >= this.frames.length) {
      this.currentFrameIndex = this.frames.length - 1;
      this.state = ANIMATION_STATES.FINISHED;
      
      if (this.onComplete) {
        this.onComplete(this);
      }
    } else {
      this.currentFrameIndex = newFrameIndex;
    }
  }
  
  /**
   * 更新帧索引 - 循环模式
   * @private
   */
  updateFrameIndexLoop() {
    const newFrameIndex = Math.floor(this.elapsedTime / this.frameDuration);
    const previousLoopCount = Math.floor(this.currentFrameIndex / this.frames.length);
    const currentLoopCount = Math.floor(newFrameIndex / this.frames.length);
    
    this.currentFrameIndex = newFrameIndex % this.frames.length;
    
    // 检查是否完成了一次循环
    if (currentLoopCount > previousLoopCount && this.onLoop) {
      this.onLoop(this, currentLoopCount);
    }
  }
  
  /**
   * 更新帧索引 - 乒乓模式
   * @param {number} deltaTime - 时间间隔（秒）
   * @private
   */
  updateFrameIndexPingPong(deltaTime) {
    const frameAdvancement = deltaTime / this.frameDuration;
    let newIndex = this.currentFrameIndex + (frameAdvancement * this.playDirection);
    
    // 检查边界并改变方向
    if (newIndex >= this.frames.length - 1) {
      newIndex = this.frames.length - 1;
      this.playDirection = -1;
      
      if (this.onLoop) {
        this.onLoop(this, Math.floor(this.elapsedTime / (this.totalTime * 2)));
      }
    } else if (newIndex <= 0) {
      newIndex = 0;
      this.playDirection = 1;
    }
    
    this.currentFrameIndex = Math.floor(newIndex);
  }
  
  /**
   * 获取当前帧
   * 
   * @returns {Image|null} 当前帧图像
   */
  getCurrentFrame() {
    if (this.frames.length === 0) {
      return null;
    }
    
    const index = Math.max(0, Math.min(this.currentFrameIndex, this.frames.length - 1));
    return this.frames[index];
  }
  
  /**
   * 跳转到指定帧
   * 
   * @param {number} frameIndex - 帧索引
   */
  gotoFrame(frameIndex) {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
      this.currentFrameIndex = frameIndex;
      this.elapsedTime = frameIndex * this.frameDuration;
    }
  }
  
  /**
   * 设置帧率
   * 
   * @param {number} frameRate - 新的帧率（帧/秒）
   */
  setFrameRate(frameRate) {
    if (frameRate > 0) {
      this.frameRate = frameRate;
      this.frameDuration = 1.0 / frameRate;
      this.totalTime = this.frames.length * this.frameDuration;
    }
  }
  
  /**
   * 设置循环模式
   * 
   * @param {string} loopMode - 循环模式
   */
  setLoopMode(loopMode) {
    if (Object.values(LOOP_MODES).includes(loopMode)) {
      this.loopMode = loopMode;
      this.reset();
    }
  }
  
  /**
   * 检查动画是否正在播放
   * 
   * @returns {boolean} 是否正在播放
   */
  isPlaying() {
    return this.state === ANIMATION_STATES.PLAYING;
  }
  
  /**
   * 检查动画是否已完成
   * 
   * @returns {boolean} 是否已完成
   */
  isFinished() {
    return this.state === ANIMATION_STATES.FINISHED;
  }
  
  /**
   * 获取播放进度
   * 
   * @returns {number} 播放进度（0-1）
   */
  getProgress() {
    if (this.frames.length === 0) {
      return 0;
    }
    
    return Math.min(this.currentFrameIndex / (this.frames.length - 1), 1);
  }
  
  /**
   * 获取动画信息
   * 
   * @returns {Object} 动画信息对象
   */
  getInfo() {
    return {
      name: this.name,
      state: this.state,
      frameCount: this.frames.length,
      currentFrame: this.currentFrameIndex,
      frameRate: this.frameRate,
      loopMode: this.loopMode,
      progress: this.getProgress(),
      elapsedTime: this.elapsedTime,
      totalTime: this.totalTime
    };
  }
}