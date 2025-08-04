/**
 * @file event-manager.js
 * @description 简单的事件管理器，用于天使下凡一百层游戏
 */

import Emitter from './libs/tinyemitter.js';

/**
 * 游戏事件常量
 */
export const GAME_EVENTS = {
  GAME_RESET: 'game_reset',
  PLAYER_DEATH: 'player_death',
  LEVEL_COMPLETE: 'level_complete',
  PLATFORM_STEP: 'platform_step',
  GAME_OVER: 'game_over'
};

/**
 * 事件管理器类
 * 基于TinyEmitter实现简单的发布-订阅模式
 */
export default class EventManager extends Emitter {
  constructor() {
    super();
    // 事件管理器已创建
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {*} data 事件数据
   */
  emit(event, data) {
    super.emit(event, data);
  }

  /**
   * 监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    super.on(event, callback);
  }

  /**
   * 移除事件监听
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    super.off(event, callback);
  }

  /**
   * 销毁事件管理器
   */
  dispose() {
    this.off(); // 移除所有监听器
    // 事件管理器已销毁
  }
}