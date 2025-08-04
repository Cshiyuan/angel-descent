/**
 * @file platform-pool.js
 * @description 平台对象池系统
 * 
 * 高效的平台对象复用系统，减少频繁的对象创建和销毁带来的性能开销。
 * 采用对象池设计模式，为天使下凡一百层游戏提供优化的内存管理。
 * 
 * 核心设计理念：
 * - 对象复用：避免频繁的内存分配和垃圾回收
 * - 类型分离：不同类型平台使用独立的池子管理
 * - 自动扩展：池子容量不足时自动扩展
 * - 状态重置：确保复用对象的状态完全重置
 * 
 * 性能优势：
 * - 减少GC压力：降低垃圾回收频率
 * - 提升帧率：减少运行时内存分配
 * - 内存优化：控制峰值内存使用量
 * - 预热机制：游戏启动时预创建对象
 */

import Platform, { PLATFORM_TYPES } from '../entities/platform.js';

/**
 * 平台对象池类
 * 
 * 管理所有类型平台对象的创建、复用和回收。
 * 使用Map结构按平台类型分别管理对象池，确保类型安全和性能优化。
 * 
 * 池子策略：
 * - 每种平台类型维护独立的对象数组
 * - 支持动态扩展和预分配
 * - 自动清理长期未使用的对象
 */
export default class PlatformPool {
  constructor(audioManager = null) {
    // 音频管理器引用
    this.audioManager = audioManager;
    
    // 按类型分组的对象池
    this.pools = new Map();
    
    // 初始化所有平台类型的池子
    Object.values(PLATFORM_TYPES).forEach(type => {
      this.pools.set(type, []);
    });
    
    // 池子配置
    this.config = {
      initialSize: 5,        // 每种类型的初始对象数量
      maxSize: 50,          // 单个池子的最大容量
      expansionSize: 3,     // 池子不足时的扩展数量
      cleanupThreshold: 20, // 清理阈值（超过此数量开始清理未使用对象）
      maxIdleTime: 30000    // 对象最大闲置时间（毫秒）
    };
    
    // 统计信息
    this.stats = {
      totalCreated: 0,      // 总创建数量
      totalReused: 0,       // 总复用次数
      totalReleased: 0,     // 总释放次数
      currentActive: 0      // 当前活跃对象数
    };
    
    // 预热所有池子
    this.preWarmPools();
  }

  /**
   * 预热对象池
   * 
   * 游戏启动时预先创建一定数量的平台对象，避免游戏运行时的延迟创建。
   * 根据游戏数据统计，普通平台使用频率最高，特殊平台相对较少。
   */
  preWarmPools() {
    Object.values(PLATFORM_TYPES).forEach(type => {
      const pool = this.pools.get(type);
      
      // 根据平台类型调整预创建数量
      let preWarmCount = this.config.initialSize;
      if (type === PLATFORM_TYPES.NORMAL) {
        preWarmCount = this.config.initialSize * 2; // 普通平台使用频率更高
      }
      
      for (let i = 0; i < preWarmCount; i++) {
        const platform = this.createNewPlatform(type);
        platform.pooled = true;
        platform.lastUsedTime = Date.now();
        pool.push(platform);
      }
    });
    
    // console.log('平台对象池预热完成:', this.getPoolStats());
  }

  /**
   * 获取平台对象
   * 
   * 从对象池中获取指定类型的平台对象。
   * 优先复用现有对象，池子为空时自动创建新对象。
   * 
   * @param {string} type - 平台类型
   * @param {number} x - X坐标
   * @param {number} y - Y坐标  
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} layer - 层数
   * @returns {Platform} 配置好的平台对象
   */
  get(type, x, y, width, height, layer) {
    const pool = this.pools.get(type);
    if (!pool) {
      console.warn(`未知的平台类型: ${type}`);
      return this.createNewPlatform(type, x, y, width, height, layer);
    }

    let platform;
    
    // 尝试从池子中获取对象
    if (pool.length > 0) {
      platform = pool.pop();
      this.stats.totalReused++;
    } else {
      // 池子为空，创建新对象
      platform = this.createNewPlatform(type, x, y, width, height, layer);
      this.stats.totalCreated++;
    }
    
    // 重置并配置平台对象
    this.resetPlatform(platform, type, x, y, width, height, layer);
    
    // 标记为活跃状态
    platform.pooled = false;
    platform.lastUsedTime = Date.now();
    this.stats.currentActive++;
    
    return platform;
  }

  /**
   * 释放平台对象
   * 
   * 将使用完毕的平台对象返回对象池以供复用。
   * 自动进行状态重置和池子管理。
   * 
   * @param {Platform} platform - 要释放的平台对象
   */
  release(platform) {
    if (!platform || platform.pooled) {
      return; // 已经在池子中或无效对象
    }
    
    const pool = this.pools.get(platform.platformType);
    if (!pool) {
      console.warn(`无法释放未知类型的平台: ${platform.platformType}`);
      return;
    }
    
    // 检查池子容量限制
    if (pool.length >= this.config.maxSize) {
      // 池子已满，直接丢弃对象
      // console.log(`平台池已满(${platform.platformType})，丢弃对象`);
      return;
    }
    
    // 重置平台状态并返回池子
    platform.reset();
    platform.pooled = true;
    platform.lastUsedTime = Date.now();
    pool.push(platform);
    
    this.stats.totalReleased++;
    this.stats.currentActive--;
  }

  /**
   * 创建新的平台对象
   * 
   * @param {string} type - 平台类型
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度  
   * @param {number} height - 高度
   * @param {number} layer - 层数
   * @returns {Platform} 新创建的平台对象
   */
  createNewPlatform(type, x = 0, y = 0, width = 80, height = 20, layer = 1) {
    return new Platform(x, y, width, height, type, layer, this.audioManager);
  }

  /**
   * 重置平台对象状态
   * 
   * @param {Platform} platform - 要重置的平台对象
   * @param {string} type - 平台类型
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度  
   * @param {number} layer - 层数
   */
  resetPlatform(platform, type, x, y, width, height, layer) {
    // 调用基类重置方法
    platform.reset();
    
    // 设置位置和尺寸
    platform.x = x;
    platform.y = y;
    platform.width = width;
    platform.height = height;
    
    // 设置平台特定属性
    platform.platformType = type;
    platform.layer = layer;
    platform.audioManager = this.audioManager;
    
    // 重新初始化类型特定属性
    platform.initializeTypeProperties();
    
    // 重新设置颜色属性
    platform.color = platform.getPlatformTypeColor(type);
    platform.edgeColor = platform.getPlatformTypeEdgeColor(type);
    
    // 重置状态标志
    platform.activated = false;
    platform.stepCount = 0;
    platform.lastContactedPlayer = null;
    
    // 确保状态正确
    platform.destroyed = false;
    platform.active = true;
    platform.visible = true;
    
  }

  /**
   * 定期清理长期未使用的对象
   * 
   * 定期检查池子中长期未使用的对象，释放内存空间。
   * 建议在游戏的空闲时间调用，如暂停界面或关卡切换时。
   */
  cleanup() {
    const currentTime = Date.now();
    let totalCleaned = 0;
    
    this.pools.forEach((pool, type) => {
      if (pool.length <= this.config.cleanupThreshold) {
        return; // 池子对象数量未达到清理阈值
      }
      
      // 移除长期未使用的对象
      const initialLength = pool.length;
      for (let i = pool.length - 1; i >= 0; i--) {
        const platform = pool[i];
        const idleTime = currentTime - platform.lastUsedTime;
        
        if (idleTime > this.config.maxIdleTime) {
          pool.splice(i, 1);
          totalCleaned++;
        }
      }
      
      const cleanedCount = initialLength - pool.length;
      if (cleanedCount > 0) {
        // console.log(`清理${type}平台池: ${cleanedCount}个对象`);
      }
    });
    
    if (totalCleaned > 0) {
      // console.log(`对象池清理完成，共清理${totalCleaned}个对象`);
    }
  }

  /**
   * 获取池子统计信息
   * 
   * @returns {Object} 包含详细统计信息的对象
   */
  getPoolStats() {
    const poolSizes = {};
    let totalPooled = 0;
    
    this.pools.forEach((pool, type) => {
      poolSizes[type] = pool.length;
      totalPooled += pool.length;
    });
    
    return {
      poolSizes,
      totalPooled,
      totalCreated: this.stats.totalCreated,
      totalReused: this.stats.totalReused,  
      totalReleased: this.stats.totalReleased,
      currentActive: this.stats.currentActive,
      reuseRate: this.stats.totalReused / Math.max(1, this.stats.totalCreated + this.stats.totalReused)
    };
  }

  /**
   * 销毁对象池
   * 
   * 清空所有池子并重置统计信息。
   * 通常在游戏结束或重启时调用。
   */
  destroy() {
    this.pools.forEach(pool => pool.length = 0);
    this.pools.clear();
    
    this.stats = {
      totalCreated: 0,
      totalReused: 0,
      totalReleased: 0,
      currentActive: 0
    };
    
    // console.log('平台对象池已销毁');
  }
}