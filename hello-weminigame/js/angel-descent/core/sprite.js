/**
 * @file sprite.js
 * @description 游戏精灵系统核心基类
 * 
 * 统一的游戏对象基础架构，为天使下凡一百层游戏中的所有可见和可交互对象提供
 * 标准化的属性和行为接口。基于面向对象设计原则和游戏引擎架构模式。
 * 
 * 核心设计理念：
 * - 组合优于继承：通过事件系统实现松耦合的组件通信
 * - 单一职责原则：每个精灵专注于自身的状态和行为
 * - 开放封闭原则：便于扩展，不修改基类代码
 * - 性能优化：提供对象池友好的重置机制
 * 
 * 架构特点：
 * - 事件驱动：继承自TinyEmitter，支持发布订阅模式
 * - 空间管理：完善的位置、尺寸、速度、碰撞盒系统
 * - 状态管理：生命周期状态控制（活跃、可见、销毁）
 * - 标签系统：基于Set的高效分类和查询机制
 * - 锚点系统：灵活的定位和旋转中心管理
 * 
 * 适用对象类型：
 * - 游戏实体：玩家、敌人、道具、平台
 * - 视觉效果：粒子、动画、UI元素
 * - 抽象对象：触发器、音效源、逻辑控制器
 * 
 * 性能考量：
 * - 内存友好：支持对象池复用机制
 * - 计算优化：高效的碰撞检测算法
 * - 渲染优化：可见性检查避免无效绘制
 */

import Emitter from '../../libs/tinyemitter.js';
import { resourceManager } from '../../runtime/resource-manager.js';

/**
 * 游戏精灵基类
 * 
 * 所有游戏对象的共同基础类，实现了游戏引擎的核心对象模型。
 * 通过继承此类，游戏对象获得标准化的属性、方法和事件系统。
 * 
 * 继承体系设计：
 * TinyEmitter -> Sprite -> [Player, Platform, Enemy, Effect, UI]
 * 
 * 核心系统：
 * 1. 空间系统：位置、尺寸、速度、碰撞盒
 * 2. 状态系统：活跃、可见、销毁状态管理
 * 3. 事件系统：基于发布订阅的通信机制
 * 4. 标签系统：对象分类和查询优化
 * 5. 锚点系统：精确的定位控制
 * 
 * 设计模式应用：
 * - 观察者模式：事件系统实现对象间通信
 * - 模板方法模式：update()和render()定义基础流程
 * - 策略模式：通过标签系统实现不同行为策略
 * - 对象池模式：通过reset()方法支持对象复用
 * 
 * @class Sprite
 * @extends Emitter
 */
export default class Sprite extends Emitter {
  /**
   * 构造函数 - 初始化精灵的所有核心系统
   * 
   * 创建一个新的精灵对象，设置其基础属性和系统。
   * 所有参数都有合理的默认值，支持灵活的对象创建。
   * 
   * 初始化系统清单：
   * 1. 空间系统：位置、尺寸、速度、碰撞盒
   * 2. 状态系统：活跃、可见、销毁标志
   * 3. 分类系统：标签集合和类型标识
   * 4. 定位系统：锚点坐标系统
   * 
   * @constructor
   * @param {number} x - X坐标位置（像素，默认0）
   * @param {number} y - Y坐标位置（像素，默认0）
   * @param {number} width - 精灵宽度（像素，默认0）
   * @param {number} height - 精灵高度（像素，默认0）
   */
  constructor(x = 0, y = 0, width = 0, height = 0) {
    // 调用父类构造函数，初始化事件系统
    super();
    
    /**
     * 空间位置系统
     * 定义精灵在2D游戏世界中的位置坐标
     */
    this.x = x;      // 水平位置（像素）
    this.y = y;      // 垂直位置（像素）
    
    /**
     * 几何尺寸系统
     * 定义精灵的可见区域和基础碰撞检测边界
     */
    this.width = width;     // 宽度（像素）
    this.height = height;   // 高度（像素）
    
    /**
     * 运动速度系统
     * 定义精灵在每秒的移动距离，用于基础物理模拟
     * 单位：像素/秒
     */
    this.velocity = {
      x: 0,  // 水平方向速度
      y: 0   // 垂直方向速度
    };
    
    /**
     * 生命周期状态系统
     * 控制精灵的存在状态和渲染行为
     */
    this.active = true;      // 是否参与逻辑更新
    this.visible = true;     // 是否进行渲染绘制
    this.destroyed = false;  // 是否已被销毁（不可逆状态）
    
    /**
     * 碰撞检测系统
     * 独立于可见尺寸的碰撞边界，支持精确的物理交互
     * 默认与精灵尺寸相同，可根据需要自定义
     */
    this.collisionBox = {
      x: 0,           // 相对于精灵位置的X偏移
      y: 0,           // 相对于精灵位置的Y偏移
      width: width,   // 碰撞盒宽度
      height: height  // 碰撞盒高度
    };
    
    /**
     * 对象分类系统
     * 
     * 使用Set数据结构实现高效的标签管理：
     * - 快速添加/删除标签：O(1)复杂度
     * - 快速查询标签存在性：O(1)复杂度
     * - 自动去重：Set特性确保标签唯一性
     * 
     * 应用场景：
     * - 碰撞检测分组：'player', 'enemy', 'platform'
     * - 渲染层级分类：'background', 'foreground', 'ui'
     * - 行为逻辑分组：'movable', 'damageable', 'collectable'
     */
    this.tags = new Set();
    this.type = 'sprite';  // 基础类型标识
    
    /**
     * 锚点定位系统
     * 
     * 定义精灵的定位和旋转中心点：
     * - (0, 0)：左上角锚点
     * - (0.5, 0.5)：中心点锚点（默认）
     * - (1, 1)：右下角锚点
     * 
     * 用途：
     * - 精确的位置计算
     * - 旋转变换的中心点
     * - UI元素的对齐基准
     */
    this.anchor = {
      x: 0.5,  // 水平锚点（0-1范围）
      y: 0.5   // 垂直锚点（0-1范围）
    };
    
    /**
     * 图像渲染系统
     * 
     * 可选的图像渲染支持，用于美术资源集成：
     * - image：图像对象，null时使用代码渲染
     * - imagePath：图像文件路径，用于动态加载
     * - renderMode：渲染模式（'code'代码渲染，'image'图像渲染，'auto'自动选择）
     * 
     * 渐进式设计：
     * - 默认使用代码渲染保持兼容性
     * - 有图像资源时自动升级到图像渲染
     * - 支持运行时动态切换
     */
    this.image = null;           // 图像对象
    this.imagePath = null;       // 图像路径
    this.renderMode = 'auto';    // 渲染模式：'code', 'image', 'auto'
    this.imageLoaded = false;    // 图像加载状态
    this.imageScale = { x: 1, y: 1 };  // 图像缩放比例
    this.imageRotation = 0;      // 图像旋转角度（弧度）
    this.imageAlpha = 1.0;       // 图像透明度
  }

  /**
   * 更新精灵
   * @param {number} deltaTime 时间间隔（秒）
   */
  update(deltaTime) {
    if (!this.active || this.destroyed) return;
    
    // 更新位置
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
  }

  /**
   * 渲染精灵 - 智能图像/代码渲染切换系统
   * 
   * 根据图像可用性和渲染模式智能选择渲染方式：
   * - 优先使用图像渲染（更佳视觉效果）
   * - 图像不可用时自动fallback到代码渲染
   * - 支持手动指定渲染模式
   * 
   * @param {CanvasRenderingContext2D} ctx 渲染上下文
   */
  render(ctx) {
    if (!this.visible || this.destroyed) return;
    
    // 决定使用哪种渲染方式
    const shouldUseImageRender = this.shouldUseImageRender();
    
    if (shouldUseImageRender) {
      this.renderImage(ctx);
    } else {
      this.renderCode(ctx);
    }
  }
  
  /**
   * 判断是否应该使用图像渲染
   * 
   * 基于渲染模式和图像可用性的智能判断逻辑
   * 
   * @returns {boolean} 是否使用图像渲染
   */
  shouldUseImageRender() {
    switch (this.renderMode) {
      case 'image':
        return this.image !== null && this.imageLoaded;
      case 'code':
        return false;
      case 'auto':
      default:
        return this.image !== null && this.imageLoaded;
    }
  }
  
  /**
   * 图像渲染方法
   * 
   * 使用图像资源进行渲染，支持缩放、旋转和透明度
   * 
   * @param {CanvasRenderingContext2D} ctx 渲染上下文
   */
  renderImage(ctx) {
    if (!this.image) return;
    
    ctx.save();
    
    // 计算渲染位置（基于锚点）
    const renderX = this.x - this.width * this.anchor.x;
    const renderY = this.y - this.height * this.anchor.y;
    
    // 应用透明度
    if (this.imageAlpha < 1.0) {
      ctx.globalAlpha *= this.imageAlpha;
    }
    
    // 应用旋转（如果需要）
    if (this.imageRotation !== 0) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.imageRotation);
      ctx.translate(-this.x, -this.y);
    }
    
    // 绘制图像
    ctx.drawImage(
      this.image,
      renderX,
      renderY,
      this.width * this.imageScale.x,
      this.height * this.imageScale.y
    );
    
    ctx.restore();
  }
  
  /**
   * 代码渲染方法
   * 
   * 传统的Canvas代码渲染，保持向下兼容
   * 子类可以重写此方法实现自定义的代码渲染
   * 
   * @param {CanvasRenderingContext2D} ctx 渲染上下文
   */
  renderCode(ctx) {
    // 默认渲染为白色矩形（保持原有行为）
    ctx.fillStyle = '#FFFFFF';
    
    // 基于锚点计算渲染位置
    const renderX = this.x - this.width * this.anchor.x;
    const renderY = this.y - this.height * this.anchor.y;
    
    ctx.fillRect(renderX, renderY, this.width, this.height);
  }

  /**
   * 设置位置
   * @param {number} x X坐标
   * @param {number} y Y坐标
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置速度
   * @param {number} vx X方向速度
   * @param {number} vy Y方向速度
   */
  setVelocity(vx, vy) {
    this.velocity.x = vx;
    this.velocity.y = vy;
  }

  /**
   * 获取边界框
   * @returns {Object} 边界框对象
   */
  getBounds() {
    return {
      left: this.x + this.collisionBox.x,
      right: this.x + this.collisionBox.x + this.collisionBox.width,
      top: this.y + this.collisionBox.y,
      bottom: this.y + this.collisionBox.y + this.collisionBox.height
    };
  }

  /**
   * AABB碰撞检测算法 - 轴对齐边界盒检测
   * 
   * 基于几何学的高效碰撞检测算法，使用轴对齐边界盒（AABB - Axis-Aligned Bounding Box）
   * 进行快速的矩形碰撞判定。该算法是2D游戏中最常用的碰撞检测方法。
   * 
   * 算法原理：
   * 两个矩形重叠当且仅当它们在X轴和Y轴上都有重叠。
   * 使用分离轴定理（SAT）的简化版本，通过检查四个分离条件来判断是否不重叠。
   * 
   * 分离条件（如果任意一个为真，则不碰撞）：
   * 1. bounds1.right < bounds2.left   (精灵1在精灵2左侧)
   * 2. bounds1.left > bounds2.right   (精灵1在精灵2右侧)  
   * 3. bounds1.bottom < bounds2.top   (精灵1在精灵2上方)
   * 4. bounds1.top > bounds2.bottom   (精灵1在精灵2下方)
   * 
   * 时间复杂度：O(1) - 常数时间算法
   * 空间复杂度：O(1) - 只需要常数额外空间
   * 
   * 优势：
   * - 计算效率极高，适合大量对象的碰撞检测
   * - 逻辑清晰，易于理解和调试
   * - 支持不同尺寸的碰撞盒
   * 
   * 局限性：
   * - 只适用于轴对齐的矩形
   * - 不支持旋转对象的精确碰撞
   * - 对于复杂形状需要多个碰撞盒组合
   * 
   * @method checkCollision
   * @param {Sprite} other - 目标精灵对象
   * @returns {boolean} 是否发生碰撞 - true表示碰撞，false表示无碰撞
   * 
   * @example
   * // 检查玩家与平台的碰撞
   * if (player.checkCollision(platform)) {
   *   player.onPlatform = true;
   *   player.velocity.y = 0;
   * }
   */
  checkCollision(other) {
    // 获取两个精灵的世界坐标边界框
    const bounds1 = this.getBounds();   // 当前精灵的边界
    const bounds2 = other.getBounds();  // 目标精灵的边界
    
    /**
     * 分离轴定理应用
     * 使用德摩根定律：!(A || B || C || D) = !A && !B && !C && !D
     * 即：碰撞 = 不满足任何分离条件
     */
    return !(bounds1.right < bounds2.left ||   // 排除：精灵1在精灵2左侧
             bounds1.left > bounds2.right ||   // 排除：精灵1在精灵2右侧
             bounds1.bottom < bounds2.top ||   // 排除：精灵1在精灵2上方
             bounds1.top > bounds2.bottom);    // 排除：精灵1在精灵2下方
  }

  /**
   * 销毁精灵
   */
  destroy() {
    this.destroyed = true;
    this.active = false;
    this.visible = false;
    this.emit('destroy', this);
  }

  /**
   * 重置精灵状态
   */
  reset() {
    this.destroyed = false;
    this.active = true;
    this.visible = true;
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    // 重置图像相关状态（但保留已加载的图像）
    this.imageRotation = 0;
    this.imageAlpha = 1.0;
    this.imageScale = { x: 1, y: 1 };
  }
  
  /**
   * 设置精灵图像
   * 
   * 异步加载并设置精灵的图像资源
   * 
   * @param {string} imagePath - 图像文件路径
   * @returns {Promise<boolean>} 加载是否成功
   */
  async setImage(imagePath) {
    if (!imagePath) return false;
    
    this.imagePath = imagePath;
    this.imageLoaded = false;
    
    try {
      const image = await resourceManager.loadImage(imagePath);
      if (image) {
        this.image = image;
        this.imageLoaded = true;
        return true;
      }
    } catch (error) {
      console.warn(`精灵图像加载失败: ${imagePath}`, error);
    }
    
    return false;
  }
  
  /**
   * 设置已加载的图像对象
   * 
   * 直接设置图像对象，跳过加载过程
   * 
   * @param {Image} image - 图像对象
   */
  setImageObject(image) {
    if (image) {
      this.image = image;
      this.imageLoaded = true;
    } else {
      this.image = null;
      this.imageLoaded = false;
    }
  }
  
  /**
   * 设置图像缩放
   * 
   * @param {number} scaleX - 水平缩放比例
   * @param {number} scaleY - 垂直缩放比例（可选，默认与scaleX相同）
   */
  setImageScale(scaleX, scaleY = scaleX) {
    this.imageScale.x = scaleX;
    this.imageScale.y = scaleY;
  }
  
  /**
   * 设置图像旋转
   * 
   * @param {number} rotation - 旋转角度（弧度）
   */
  setImageRotation(rotation) {
    this.imageRotation = rotation;
  }
  
  /**
   * 设置图像透明度
   * 
   * @param {number} alpha - 透明度（0-1）
   */
  setImageAlpha(alpha) {
    this.imageAlpha = Math.max(0, Math.min(1, alpha));
  }
  
  /**
   * 设置渲染模式
   * 
   * @param {string} mode - 渲染模式：'code', 'image', 'auto'
   */
  setRenderMode(mode) {
    if (['code', 'image', 'auto'].includes(mode)) {
      this.renderMode = mode;
    }
  }
  
  /**
   * 检查是否有图像
   * 
   * @returns {boolean} 是否有可用的图像
   */
  hasImage() {
    return this.image !== null && this.imageLoaded;
  }

  /**
   * 添加标签
   * @param {string} tag 标签名称
   */
  addTag(tag) {
    this.tags.add(tag);
  }

  /**
   * 移除标签
   * @param {string} tag 标签名称
   */
  removeTag(tag) {
    this.tags.delete(tag);
  }

  /**
   * 检查是否有指定标签
   * @param {string} tag 标签名称
   * @returns {boolean} 是否有该标签
   */
  hasTag(tag) {
    return this.tags.has(tag);
  }

  /**
   * 获取所有标签
   * @returns {Array<string>} 标签数组
   */
  getTags() {
    return Array.from(this.tags);
  }
}