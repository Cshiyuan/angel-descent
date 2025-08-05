/**
 * @file input-system.js
 * @description 微信小游戏输入处理系统
 * 
 * 专为微信小游戏环境设计的触摸事件处理系统。
 * 提供触摸点跟踪和基础手势识别功能。
 */

import { INPUT_EVENTS } from './input-events.js';
import { GESTURE_TYPES, SWIPE_DIRECTIONS } from './gesture-types.js';
import { PIXEL_RATIO } from '../render.js';

/**
 * 触摸点数据结构
 * 封装单个触摸点的状态信息
 */
class TouchPoint {
  constructor(id, x, y, timestamp) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.timestamp = timestamp;
    this.startTime = timestamp;
    this.lastX = x;
    this.lastY = y;
    this.deltaX = 0;
    this.deltaY = 0;
    this.distance = 0;
    this.velocity = { x: 0, y: 0 };
    this.active = true;
  }

  update(x, y, timestamp) {
    this.lastX = this.x;
    this.lastY = this.y;
    this.x = x;
    this.y = y;
    
    const deltaTime = Math.max(timestamp - this.timestamp, 1);
    this.deltaX = x - this.lastX;
    this.deltaY = y - this.lastY;
    this.velocity.x = this.deltaX / deltaTime;
    this.velocity.y = this.deltaY / deltaTime;
    
    this.distance = Math.sqrt(
      Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2)
    );
    
    this.timestamp = timestamp;
  }

  getTotalDistance() {
    return this.distance;
  }

  getDuration() {
    return this.timestamp - this.startTime;
  }

  getVelocity() {
    const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    return {
      x: this.velocity.x,
      y: this.velocity.y,
      magnitude
    };
  }
}

/**
 * 简化的手势识别器 - 只支持基础点击
 */
class GestureRecognizer {
  constructor() {
    this.config = {
      tapTimeThreshold: 200,
      tapDistanceThreshold: 10
    };
    
    this.currentGesture = GESTURE_TYPES.NONE;
    this.gestureStartTime = 0;
    this.eventPublisher = null;
  }

  setEventPublisher(publisher) {
    this.eventPublisher = publisher;
  }

  recognize(touches, eventType) {
    const results = [];
    
    if (touches.length === 0) {
      this.reset();
      return results;
    }

    if (eventType === 'touchstart' && touches.length === 1) {
      this.currentGesture = GESTURE_TYPES.TAP;
      this.gestureStartTime = touches[0].timestamp;
    } else if (eventType === 'touchend' && this.currentGesture === GESTURE_TYPES.TAP) {
      const tapResult = this.detectTap(touches[0]);
      if (tapResult) {
        results.push(tapResult);
      }
      this.reset();
    }
    
    return results;
  }





  detectTap(touch) {
    const duration = touch.getDuration();
    const distance = touch.getTotalDistance();
    
    if (duration < this.config.tapTimeThreshold && 
        distance < this.config.tapDistanceThreshold) {
      return {
        type: GESTURE_TYPES.TAP,
        position: { x: touch.x, y: touch.y },
        timestamp: touch.timestamp
      };
    }
    
    return null;
  }







  reset() {
    this.currentGesture = GESTURE_TYPES.NONE;
    this.gestureStartTime = 0;
  }
}


/**
 * 输入系统主类
 */
export default class InputSystem {
  constructor(options = {}) {
    this.canvas = options.canvas || null;
    this.isEnabled = true;
    this.touches = new Map();
    this.gestureRecognizer = new GestureRecognizer();
    
    // 依赖注入的外部服务
    this.eventManager = options.eventManager || null;
    this.touchCallback = options.touchCallback || null;
    
    // 事件监听器
    this.eventListeners = new Map();
    
    
    this.gestureRecognizer.setEventPublisher((eventType, data) => {
      this.publishInputEvent(eventType, data);
    });
    
    // 初始化输入处理
    if (this.canvas) {
      this.initializeInput();
    }
  }

  initialize(canvas, eventManager = null) {
    this.canvas = canvas;
    if (eventManager) {
      this.eventManager = eventManager;
    }
    this.initializeInput();
  }

  setEventManager(eventManager) {
    this.eventManager = eventManager;
  }

  setTouchCallback(callback) {
    this.touchCallback = callback;
  }

  initializeInput() {
    if (this.canvas) {
      this.initializeWeChatInput();
    }
  }

  initializeWeChatInput() {
    wx.onTouchStart((event) => {
      if (!this.isEnabled) return;
      this.handleTouchStart(this.convertWeChatEvent(event));
      if (this.touchCallback) {
        this.touchCallback('touchstart', event);
      }
    });

    wx.onTouchMove((event) => {
      if (!this.isEnabled) return;
      this.handleTouchMove(this.convertWeChatEvent(event));
      if (this.touchCallback) {
        this.touchCallback('touchmove', event);
      }
    });

    wx.onTouchEnd((event) => {
      if (!this.isEnabled) return;
      this.handleTouchEnd(this.convertWeChatEvent(event));
      if (this.touchCallback) {
        this.touchCallback('touchend', event);
      }
    });

    wx.onTouchCancel((event) => {
      if (!this.isEnabled) return;
      this.handleTouchCancel(this.convertWeChatEvent(event));
      if (this.touchCallback) {
        this.touchCallback('touchcancel', event);
      }
    });
  }

  convertWeChatEvent(event) {
    const touches = [];
    if (event.touches && event.touches.length > 0) {
      for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        touches.push({
          identifier: touch.identifier || i,
          clientX: touch.clientX,
          clientY: touch.clientY
        });
      }
    }
    return { touches };
  }

  handleTouchStart(event) {
    const timestamp = Date.now();
    
    event.touches.forEach(touch => {
      const coords = this.getTouchCoordinates(touch);
      const touchPoint = new TouchPoint(touch.identifier, coords.x, coords.y, timestamp);
      this.touches.set(touch.identifier, touchPoint);
    });

    this.processGestures('touchstart');
    this.publishInputEvent(INPUT_EVENTS.TOUCH_START, {
      touches: Array.from(this.touches.values()),
      timestamp
    });
  }

  /**
   * 处理触摸移动
   * @param {Object} event - 触摸事件
   */
  handleTouchMove(event) {
    const timestamp = Date.now();
    
    event.touches.forEach(touch => {
      const touchPoint = this.touches.get(touch.identifier);
      if (touchPoint) {
        const coords = this.getTouchCoordinates(touch);
        touchPoint.update(coords.x, coords.y, timestamp);
      }
    });

    this.processGestures('touchmove');
    this.publishInputEvent(INPUT_EVENTS.TOUCH_MOVE, {
      touches: Array.from(this.touches.values()),
      timestamp
    });
  }

  /**
   * 处理触摸结束
   * @param {Object} event - 触摸事件
   */
  handleTouchEnd(event) {
    const timestamp = Date.now();
    
    // 在微信小游戏中，touchend事件可能不包含结束的触摸点
    // 所以需要特殊处理
    if (!event.touches || event.touches.length === 0) {
      // 所有触摸点都结束了
      this.processGestures('touchend');
      this.publishInputEvent(INPUT_EVENTS.TOUCH_END, {
        touches: Array.from(this.touches.values()),
        timestamp
      });
      this.touches.clear();
    } else {
      // 部分触摸点结束，需要找出哪些结束了
      const activeTouchIds = new Set(event.touches.map(touch => touch.identifier));
      const endedTouches = [];
      
      for (const [id, touchPoint] of this.touches) {
        if (!activeTouchIds.has(id)) {
          endedTouches.push(touchPoint);
          this.touches.delete(id);
        }
      }
      
      if (endedTouches.length > 0) {
        this.processGestures('touchend');
        this.publishInputEvent(INPUT_EVENTS.TOUCH_END, {
          touches: endedTouches,
          timestamp
        });
      }
    }
  }

  /**
   * 处理触摸取消
   * @param {Object} event - 触摸事件
   */
  handleTouchCancel(event) {
    const timestamp = Date.now();
    
    // 触摸取消时清理所有触摸状态
    this.processGestures('touchcancel');
    this.publishInputEvent(INPUT_EVENTS.TOUCH_CANCEL, {
      touches: Array.from(this.touches.values()),
      timestamp,
      originalEvent: event
    });
    
    this.touches.clear();
  }

  /**
   * 获取触摸坐标（微信小游戏专用）
   * @param {Object} touch - 触摸点
   * @returns {Object} 坐标 {x, y}
   */
  getTouchCoordinates(touch) {
    // 微信小游戏中，触摸坐标需要适配Canvas缩放
    // Canvas已设置scale(pixelRatio, pixelRatio)，所以触摸坐标需要除以pixelRatio
    return {
      x: (touch.clientX || 0) / PIXEL_RATIO,
      y: (touch.clientY || 0) / PIXEL_RATIO
    };
  }

  /**
   * 处理手势识别
   * @param {string} eventType - 事件类型
   */
  processGestures(eventType) {
    const touchArray = Array.from(this.touches.values());
    const gestures = this.gestureRecognizer.recognize(touchArray, eventType);
    
    gestures.forEach(gesture => {
      if (gesture.type) {
        this.publishInputEvent(INPUT_EVENTS[gesture.type.toUpperCase()], gesture);
      }
    });
  }

  /**
   * 发布输入事件
   * @param {string} eventType - 事件类型
   * @param {Object} data - 事件数据
   */
  publishInputEvent(eventType, data) {
    if (this.eventManager && this.eventManager.publish) {
      this.eventManager.publish(eventType, data);
    }
  }



  /**
   * 启用输入
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * 禁用输入
   */
  disable() {
    this.isEnabled = false;
    this.touches.clear();
    this.gestureRecognizer.reset();
  }

  /**
   * 获取当前触摸状态
   * @returns {Object} 触摸状态
   */
  getTouchState() {
    return {
      touchCount: this.touches.size,
      touches: Array.from(this.touches.values()),
      isEnabled: this.isEnabled
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.disable();
    this.eventListeners.clear();
    this.commandHistory.length = 0;
  }

  dispose() {
    this.cleanup();
  }
}

export { TouchPoint, GestureRecognizer, INPUT_EVENTS, GESTURE_TYPES, SWIPE_DIRECTIONS };

// 全局输入系统实例
export const globalInputSystem = new InputSystem();