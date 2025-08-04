/**
 * @file music.js
 * @description 微信小游戏音频管理系统
 * 
 * 统一管理游戏中的背景音乐和音效，采用单例模式确保全局只有一个音频管理实例。
 * 主要功能包括：
 * - 背景音乐的循环播放和控制
 * - 游戏音效的播放和管理
 * - 音频资源的预加载和优化
 * - 音频上下文的统一管理
 * 
 * 使用微信小游戏的 wx.createInnerAudioContext() API 创建音频上下文，
 * 支持音频的暂停、继续、音量控制等功能。
 * 
 * 设计模式：单例模式
 * 使用场景：全局音频管理，避免重复创建音频实例
 */

/**
 * 单例实例引用
 * 用于实现单例模式，确保整个应用只有一个音频管理器实例
 * @type {Music|null}
 */
let instance;

/**
 * 游戏音频管理器
 * 
 * 采用单例模式设计，负责管理游戏中所有的音频资源，包括背景音乐和音效。
 * 通过微信小游戏API创建音频上下文，提供统一的音频播放接口。
 * 
 * 音频管理策略：
 * - 背景音乐：循环播放，自动开始，全局唯一
 * - 音效：按需播放，支持多次触发，重置播放位置
 * - 资源管理：预加载音频文件，避免播放时延迟
 * 
 * @class Music
 */
export default class Music {
  /**
   * 背景音乐音频上下文
   * 用于播放游戏的背景音乐，设置为循环播放模式
   * @type {InnerAudioContext}
   */
  bgmAudio = wx.createInnerAudioContext();
  
  
  /**
   * 平台落地音效音频上下文
   * 用于播放玩家落在平台上的音效
   * @type {InnerAudioContext}
   */
  platformLandAudio = wx.createInnerAudioContext();
  
  /**
   * 平台破碎音效音频上下文
   * 用于播放易碎平台破碎的音效
   * @type {InnerAudioContext}
   */
  platformBreakAudio = wx.createInnerAudioContext();
  
  /**
   * 平台消失音效音频上下文
   * 用于播放消失平台消失的音效
   * @type {InnerAudioContext}
   */
  platformVanishAudio = wx.createInnerAudioContext();
  
  
  /**
   * 天使受伤音效音频上下文
   * 用于播放天使受到伤害时的音效
   * @type {InnerAudioContext}
   */
  angelHurtAudio = wx.createInnerAudioContext();

  /**
   * 天使冰冻音效音频上下文
   * 用于播放天使被冰冻时的音效
   * @type {InnerAudioContext}
   */
  angelFrozenAudio = wx.createInnerAudioContext();

  /**
   * 生命果实收集音效音频上下文
   * 用于播放玩家收集生命果实时的音效
   * @type {InnerAudioContext}
   */
  lifeFruitCollectAudio = wx.createInnerAudioContext();

  /**
   * 构造函数 - 实现单例模式
   * 
   * 如果已存在实例，直接返回现有实例，确保全局只有一个音频管理器。
   * 初始化各种音频上下文，设置音频资源路径和播放参数。
   * 
   * 单例模式实现原理：
   * 1. 检查静态变量instance是否已存在实例
   * 2. 如果存在，直接返回现有实例
   * 3. 如果不存在，创建新实例并保存到静态变量
   * 
   * @constructor
   */
  constructor() {
    // 单例模式：如果实例已存在，返回现有实例
    if (instance) return instance;

    // 保存当前实例到静态变量
    instance = this;

    // 音效播放保护机制
    this.lastPlayTimes = {
      platformLand: 0,
      platformBreak: 0,
      platformVanish: 0,
      angelHurt: 0,
      angelFrozen: 0,
      lifeFruitCollect: 0
    };
    
    this.soundCooldowns = {
      platformLand: 200,
      platformBreak: 300,
      platformVanish: 300,
      angelHurt: 300,
      angelFrozen: 400,
      lifeFruitCollect: 250
    };

    // 配置背景音乐
    this.bgmAudio.loop = true;        // 启用循环播放
    this.bgmAudio.autoplay = true;    // 启用自动播放
    this.bgmAudio.volume = 0.3;       // 降低背景音乐音量到30%
    this.bgmAudio.src = '/audio/bgm.mp3';  // 设置背景音乐文件路径
    
    
    // 配置天使下凡一百层游戏音效资源路径和音量
    this.platformLandAudio.src = '/audio/platform_land.mp3';        // 平台落地音效
    this.platformLandAudio.volume = 0.9;                           // 提高落地音效音量到90%
    this.platformBreakAudio.src = '/audio/platform_fragile_break.mp3'; // 平台破碎音效
    this.platformBreakAudio.volume = 0.8;                          // 破碎音效音量80%
    this.platformVanishAudio.src = '/audio/platform_disappear_vanish.mp3'; // 平台消失音效
    this.platformVanishAudio.volume = 0.8;                         // 消失音效音量80%
    
    // 配置天使状态音效资源路径和音量
    this.angelHurtAudio.src = '/audio/angel_hurt.mp3';              // 天使受伤音效
    this.angelHurtAudio.volume = 0.8;                              // 受伤音效音量80%
    this.angelFrozenAudio.src = '/audio/angel_frozen.mp3';          // 天使冰冻音效
    this.angelFrozenAudio.volume = 0.7;                            // 冰冻音效音量70%
    
    // 配置收集品音效资源路径和音量
    this.lifeFruitCollectAudio.src = '/audio/life_fruit_collect.mp3'; // 生命果实收集音效
    this.lifeFruitCollectAudio.volume = 0.7;                        // 收集音效音量70%
  }

  /**
   * 检查音效是否可以播放（保护机制）
   * @param {string} soundType - 音效类型
   * @returns {boolean} 是否可以播放
   * @private
   */
  canPlaySound(soundType) {
    const currentTime = Date.now();
    const lastPlayTime = this.lastPlayTimes[soundType] || 0;
    const cooldown = this.soundCooldowns[soundType] || 0;
    
    return (currentTime - lastPlayTime) >= cooldown;
  }
  
  /**
   * 更新音效播放时间记录
   * @param {string} soundType - 音效类型
   * @private
   */
  updateLastPlayTime(soundType) {
    this.lastPlayTimes[soundType] = Date.now();
  }

  
  /**
   * 播放平台落地音效
   * 
   * 重置音频播放位置到开头，然后播放落地音效。
   * 在天使下凡一百层游戏中，当玩家落在平台上时播放。
   * 增加了播放间隔保护，防止重复播放落地音效。
   * 
   * 使用场景：
   * - 玩家角色落在平台上时
   * - 提供游戏反馈和沉浸感
   * 
   * @method playPlatformLand
   */
  playPlatformLand() {
    if (!this.canPlaySound('platformLand')) {
      return; // 如果还在冷却期内，直接返回
    }
    
    this.platformLandAudio.currentTime = 0;  // 重置播放位置到开头
    this.platformLandAudio.play();           // 播放音效
    this.updateLastPlayTime('platformLand'); // 更新播放时间记录
  }
  
  /**
   * 播放平台破碎音效
   * 
   * 重置音频播放位置到开头，然后播放破碎音效。
   * 在天使下凡一百层游戏中，当易碎平台被踩踏破碎时播放。
   * 增加了播放间隔保护，防止过于频繁的破碎音效。
   * 
   * 使用场景：
   * - 易碎平台达到最大踩踏次数破碎时
   * - 增强游戏紧张感和反馈
   * 
   * @method playPlatformBreak
   */
  playPlatformBreak() {
    if (!this.canPlaySound('platformBreak')) {
      return; // 如果还在冷却期内，直接返回
    }
    
    this.platformBreakAudio.currentTime = 0; // 重置播放位置到开头
    this.platformBreakAudio.play();          // 播放音效
    this.updateLastPlayTime('platformBreak'); // 更新播放时间记录
  }
  
  /**
   * 播放平台消失音效
   * 
   * 重置音频播放位置到开头，然后播放消失音效。
   * 在天使下凡一百层游戏中，当消失平台完全消失时播放。
   * 增加了播放间隔保护，防止过于频繁的消失音效。
   * 
   * 使用场景：
   * - 消失平台倒计时结束完全消失时
   * - 提供视觉和听觉的反馈效果
   * 
   * @method playPlatformVanish
   */
  playPlatformVanish() {
    if (!this.canPlaySound('platformVanish')) {
      return; // 如果还在冷却期内，直接返回
    }
    
    this.platformVanishAudio.currentTime = 0; // 重置播放位置到开头
    this.platformVanishAudio.play();          // 播放音效
    this.updateLastPlayTime('platformVanish'); // 更新播放时间记录
  }
  
  
  /**
   * 播放天使受伤音效
   * 
   * 重置音频播放位置到开头，然后播放受伤音效。
   * 在天使下凡一百层游戏中，当玩家受到伤害时播放。
   * 增加了播放间隔保护，防止过于频繁的受伤音效。
   * 
   * 使用场景：
   * - 玩家受到任何形式的伤害时
   * - 提供受伤状态的音频反馈和紧张感
   * 
   * @method playAngelHurt
   */
  playAngelHurt() {
    if (!this.canPlaySound('angelHurt')) {
      return; // 如果还在冷却期内，直接返回
    }
    
    this.angelHurtAudio.currentTime = 0;       // 重置播放位置到开头
    this.angelHurtAudio.play();                // 播放音效
    this.updateLastPlayTime('angelHurt');      // 更新播放时间记录
  }
  
  /**
   * 播放天使冰冻音效
   * 
   * 重置音频播放位置到开头，然后播放冰冻音效。
   * 在天使下凡一百层游戏中，当玩家被冰冻时播放。
   * 增加了播放间隔保护，防止过于频繁的冰冻音效。
   * 
   * 使用场景：
   * - 玩家接触冰冻平台或冰冻效果时
   * - 提供冰冻状态的音频反馈和特效增强
   * 
   * @method playAngelFrozen
   */
  playAngelFrozen() {
    if (!this.canPlaySound('angelFrozen')) {
      return; // 如果还在冷却期内，直接返回
    }
    
    this.angelFrozenAudio.currentTime = 0;     // 重置播放位置到开头
    this.angelFrozenAudio.play();              // 播放音效
    this.updateLastPlayTime('angelFrozen');    // 更新播放时间记录
  }
  
  /**
   * 播放生命果实收集音效
   * 
   * 当玩家收集生命果实时播放，营造愉悦的收集体验。
   * 包含冷却机制，避免频繁触发时的音效重叠。
   * 
   * @method playLifeFruitCollect
   */
  playLifeFruitCollect() {
    if (!this.canPlaySound('lifeFruitCollect')) {
      return; // 如果还在冷却期内，直接返回
    }
    
    this.lifeFruitCollectAudio.currentTime = 0; // 重置播放位置到开头
    this.lifeFruitCollectAudio.play();          // 播放音效
    this.updateLastPlayTime('lifeFruitCollect'); // 更新播放时间记录
  }
  
  /**
   * 动态调整背景音乐音量
   * @param {number} volume - 音量值 (0.0-1.0)
   */
  setBgmVolume(volume) {
    this.bgmAudio.volume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * 动态调整音效音量
   * @param {number} volume - 音量值 (0.0-1.0)
   */
  setSoundEffectVolume(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.platformLandAudio.volume = clampedVolume * 0.9;
    this.platformBreakAudio.volume = clampedVolume * 0.8;
    this.platformVanishAudio.volume = clampedVolume * 0.8;
    this.angelHurtAudio.volume = clampedVolume * 0.8;
    this.angelFrozenAudio.volume = clampedVolume * 0.7;
  }
  
  /**
   * 获取当前音量设置
   * @returns {Object} 包含各种音频的音量信息
   */
  getVolumeSettings() {
    return {
      bgm: this.bgmAudio.volume,
      platformLand: this.platformLandAudio.volume,
      platformBreak: this.platformBreakAudio.volume,
      platformVanish: this.platformVanishAudio.volume,
      angelHurt: this.angelHurtAudio.volume,
      angelFrozen: this.angelFrozenAudio.volume
    };
  }
}
