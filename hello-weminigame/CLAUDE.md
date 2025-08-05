# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个微信小游戏项目。游戏使用ES6+ JavaScript编写，采用模块化导入，使用HTML5 Canvas 2D API进行渲染。

### 游戏模式
1. **天使下凡一百层** - 动作冒险游戏，支持平台跳跃和关卡挑战

## 开发环境

- **平台**: 微信小游戏
- **IDE**: 微信开发者工具
- **运行时**: 微信小游戏框架 v3.8.10
- **语言**: ES6+ JavaScript，原生模块系统

## 开发流程

### 运行游戏
1. 在微信开发者工具中打开项目
2. 点击"编译"在模拟器中构建和运行
3. 使用模拟器运行游戏和调试

### 部署
- 通过微信开发者工具部署
- 提交到微信小游戏平台进行审核

## 代码架构

### 应用架构
- **游戏入口**: `game.js` - 项目根目录入口文件，导入并启动App
- **应用控制器**: `js/app.js` - 主应用控制器，直接启动天使下凡一百层游戏
- **天使下凡一百层游戏**: `js/angel-descent/` - 完整的游戏实现

### 核心系统
- **渲染**: `js/render.js` - Canvas初始化和屏幕配置
- **输入系统**: `js/input/` - 触摸事件处理和手势识别
- **事件管理**: `js/event-manager.js` - 模块间事件通信

### 游戏模式
- **天使下凡一百层游戏**: `js/angel-descent/` - 天使下凡一百层游戏核心系统

### 游戏实体
- **运行时系统**: `js/runtime/` - 背景、UI和音频管理

### 关键设计模式
- **状态机模式**: 游戏状态管理（教程、游戏中、暂停、结束）
- **单例模式**: 全局音频管理器和资源管理器
- **事件驱动**: 使用EventManager进行模块间通信
- **观察者模式**: 输入事件的分发和处理机制
- **工厂模式**: 平台和游戏对象的创建
- **策略模式**: 不同平台类型的行为实现

## 配置文件

- **game.json**: 运行时配置（设备方向：竖屏）
- **project.config.json**: 微信开发者工具项目设置
  - App ID: wxf8a24daf8d525a71
  - 编译设置（ES6，启用压缩）
- **project.private.config.json**: 个人项目设置（不提交）

## 文件结构

```
├── game.js         # 项目入口文件
├── js/
│   ├── app.js      # 应用主控制器
│   ├── angel-descent/  # 天使下凡一百层游戏模块
│   │   ├── angel-descent-game.js  # 游戏主控制器
│   │   ├── core/       # 核心系统（动画、精灵）
│   │   ├── entities/   # 游戏实体（玩家、平台、生命果）
│   │   ├── level/      # 关卡生成系统
│   │   └── ui/         # 游戏UI系统
│   ├── input/      # 输入系统（触摸事件、手势识别）
│   ├── libs/       # 第三方库 (tinyemitter.js)
│   ├── runtime/    # 运行时系统（音频、资源管理）
│   ├── event-manager.js  # 事件管理器
│   └── render.js   # Canvas渲染初始化
├── audio/          # 音频资源
├── images/         # 图像资源
│   ├── backgrounds/    # 四大天界主题背景
│   ├── character/      # 天使角色精灵
│   └── platforms/      # 各类型平台图像
├── game.json       # 微信小游戏配置
└── project.config.json  # 项目配置
```

## 资源文件

- **audio/**: 游戏音效
- **images/**: 游戏图像，包括精灵、背景和动画帧

## 开发注意事项

- 无传统构建系统 - 依赖微信开发者工具编译
- 使用原生ES6模块 (import/export)
- 游戏使用requestAnimationFrame实现流畅运行
- 所有注释和文档均为中文
- 无package.json或npm依赖
- 遵循设计模式和技术规范进行开发

### 系统初始化时序原则

**重要**：在复杂系统中，必须严格遵循系统初始化的时序原则，避免在依赖系统未完全准备好时就使用它们。

#### 基本原则
1. **依赖顺序**：先初始化被依赖的系统，再初始化依赖它们的系统
2. **完全初始化**：等待异步初始化完全完成后，再进行下一步操作
3. **分阶段初始化**：将初始化分为多个明确的阶段，每个阶段完成后再进入下一阶段
4. **资源就绪检查**：在使用系统功能前，确认系统已完全准备就绪

#### 常见错误避免
- **错误**：在渲染系统初始化后立即添加渲染对象
- **正确**：等待所有相关系统完全初始化后再添加对象
- **错误**：在异步初始化未完成时就使用系统功能
- **正确**：使用 `await` 确保异步初始化完成
- **错误**：忽略系统间的依赖关系
- **正确**：明确定义和遵循系统初始化的依赖顺序

### 微信小游戏专用原则

**重要**：本项目专为微信小游戏环境设计，不考虑浏览器兼容性。所有代码都应基于微信小游戏API和运行环境。

#### 平台限制
1. **运行环境**：仅支持微信小游戏，不支持浏览器或其他平台
2. **API使用**：使用微信小游戏专用API（wx.*），不使用浏览器DOM API
3. **事件处理**：使用微信触摸事件（wx.onTouchStart/Move/End），不使用浏览器事件
4. **资源加载**：使用微信资源管理API，不使用浏览器fetch/XMLHttpRequest

#### 代码规范
1. **输入系统**：
   - 使用微信触摸事件API：`wx.onTouchStart`、`wx.onTouchMove`、`wx.onTouchEnd`
   - 触摸坐标直接使用 `event.touches[0].clientX/clientY`
   - 不使用 `getBoundingClientRect()`、`addEventListener()` 等浏览器API
   - 不支持鼠标事件模拟

2. **Canvas渲染**：
   - 使用 `wx.createCanvas()` 创建canvas
   - 画布尺寸通过 `wx.getWindowInfo()` 或 `wx.getSystemInfoSync()` 获取
   - 不依赖浏览器的canvas样式设置

3. **事件监听**：
   - 使用微信小游戏事件系统，不使用DOM事件
   - 通过App统一管理触摸事件，避免重复绑定
   - 不使用 `removeEventListener()` 等浏览器清理方法

4. **错误处理**：
   - 不检查 `typeof wx` 或浏览器环境
   - 假设始终运行在微信小游戏环境中
   - 移除所有浏览器兼容性代码

#### 开发约束
1. **不要添加**：
   - 浏览器兼容性检查（`typeof wx !== 'undefined'`）
   - DOM操作代码（`document.*`、`window.*`）
   - 浏览器事件监听器（`addEventListener`、`removeEventListener`）
   - 鼠标事件处理（`mousedown`、`mousemove`、`mouseup`）
   - 浏览器坐标转换（`getBoundingClientRect()`）

2. **必须使用**：
   - 微信小游戏API前缀（`wx.*`）
   - 微信触摸事件系统
   - 微信canvas创建方法
   - 微信系统信息获取方法

#### 调试和测试
1. **开发环境**：仅在微信开发者工具中测试
2. **真机测试**：使用微信小游戏真机调试功能
3. **性能监控**：使用微信小游戏性能分析工具
4. **日志输出**：使用 `console.log()` 在微信开发者工具控制台查看

### 动画帧管理原则

**重要**：动画帧管理是防止游戏运行错误和性能问题的关键。必须严格遵循动画帧的配对使用原则，避免并发动画帧回调导致的逻辑错误。

#### 核心原则
1. **配对使用**：每个 `requestAnimationFrame` 都必须有对应的 `cancelAnimationFrame`
2. **避免并发**：防止多个动画帧同时修改相同的状态变量
3. **状态切换清理**：在游戏状态切换时必须取消之前的动画帧
4. **安全取消**：在取消动画帧前检查ID是否有效

#### 实现规范
1. **动画帧ID管理**：
   ```javascript
   // 使用变量跟踪动画帧ID
   this.animationFrameId = null;
   
   // 启动动画循环前先取消之前的
   if (this.animationFrameId !== null) {
     cancelAnimationFrame(this.animationFrameId);
   }
   this.animationFrameId = requestAnimationFrame(this.gameStep);
   ```

2. **状态切换时的清理**：
   ```javascript
   // 暂停游戏时
   pauseGame() {
     this.stopAnimationLoop(); // 必须停止动画循环
     this.currentState = GAME_STATES.PAUSED;
   }
   
   // 恢复游戏时
   resumeGame() {
     this.currentState = GAME_STATES.PLAYING;
     this.startAnimationLoop(); // 重新启动动画循环
   }
   ```

3. **游戏结束时的清理**：
   ```javascript
   // 游戏结束、重启、销毁时都必须停止动画循环
   endGame() { this.stopAnimationLoop(); }
   restartGame() { this.stopAnimationLoop(); }
   destroy() { this.stopAnimationLoop(); }
   ```

#### 常见错误避免
- **错误**：直接调用 `requestAnimationFrame` 而不管理ID
- **正确**：通过统一的 `startAnimationLoop()` 方法管理
- **错误**：游戏状态切换时不取消动画帧
- **正确**：每次状态切换都调用 `stopAnimationLoop()`
- **错误**：多处调用 `requestAnimationFrame` 导致并发
- **正确**：确保同时只有一个动画帧在运行

#### 时间计算保护
- **deltaTime 负数保护**：`Math.max(0, Math.min(deltaTime, maxDelta))`
- **首帧处理**：检查 `lastTime === 0` 时设置 `deltaTime = 0`
- **时间跳跃限制**：限制最大 deltaTime 为 `1/30` 秒

#### 微信小游戏特殊注意
- 微信小游戏环境下的时间戳可能不连续
- 页面失去焦点后恢复可能导致大的时间跳跃
- 调试工具可能干扰 `requestAnimationFrame` 的时间戳
- 必须在所有生命周期方法中正确管理动画帧

### 帧更新函数调试原则

**重要**：在帧更新函数（如 `gameStep`、`update`、`render` 等高频调用的函数）中不能直接打印调试日志，这会严重影响游戏性能和调试体验。

#### 核心问题
1. **性能影响**：帧更新函数每秒调用60次，频繁的日志输出会影响游戏帧率
2. **日志刷屏**：大量重复日志会淹没真正有用的调试信息 
3. **控制台卡顿**：微信开发者工具控制台处理大量日志时可能卡顿
4. **真机性能**：在真机环境下，频繁日志可能导致明显的性能下降

#### 禁止行为
**绝对不要在以下函数中直接使用 `console.log`：**
- `gameStep()` - 主游戏循环
- `update()` - 游戏状态更新
- `render()` - 渲染函数
- `updatePlatforms()` - 平台更新
- `updatePlayer()` - 玩家状态更新
- `updateLevelGeneration()` - 关卡生成更新
- 任何每帧都会调用的函数

#### 替代调试方案

1. **调试标志控制**：
   ```javascript
   // 使用调试标志，默认关闭
   const DEBUG_PERFORMANCE = false;
   
   gameStep(currentTime) {
     // 只在需要时启用
     if (DEBUG_PERFORMANCE && this.frameCount % 300 === 0) { // 每5秒输出一次
       console.log('性能统计:', this.getPerformanceStats());
     }
   }
   ```

2. **事件触发方式**：
   ```javascript
   // 不在帧更新中检查，而是在事件发生时直接输出
   switchTheme(newTheme) {
     this.currentTheme = newTheme;
     console.log(`🎨 主题切换: ${newTheme}`); // 合适，因为不在帧更新中
   }
   ```

3. **UI显示代替日志**：
   ```javascript
   // 将调试信息显示在游戏界面上，而不是打印到控制台
   renderDebugInfo(ctx) {
     if (this.showDebugUI) {
       ctx.fillText(`平台数量: ${this.platforms.length}`, 10, 30);
       ctx.fillText(`FPS: ${this.fps}`, 10, 50);
     }
   }
   ```

4. **缓冲和批量输出**：
   ```javascript
   // 收集调试信息并批量输出
   collectDebugInfo(info) {
     this.debugBuffer.push(info);
     if (this.debugBuffer.length > 10) {
       console.log('调试信息批量:', this.debugBuffer);
       this.debugBuffer = [];
     }
   }
   ```

#### 性能监控最佳实践
1. **使用专用性能分析工具**：优先使用微信开发者工具的性能面板
2. **条件调试**：使用环境变量或配置标志控制调试输出
3. **采样输出**：如必须在帧更新中调试，使用低频采样（如每秒1-2次）
4. **生产环境清理**：发布前彻底移除或注释所有调试日志

#### 检查现有代码
定期搜索代码中的潜在问题：
```bash
# 搜索帧更新函数中的日志
grep -n "console\." js/angel-descent/angel-descent-game.js
grep -A 5 -B 5 "gameStep\|update.*{" js/**/*.js | grep console
```

#### 常见错误示例
```javascript
// ❌ 错误：在帧更新中频繁输出
updatePlatforms() {
  console.log('平台更新中...'); // 每帧都会输出，严重影响性能
}

// ✅ 正确：移除或使用条件控制
updatePlatforms() {
  // console.log('平台更新中...'); // 注释掉
  // 或者
  if (DEBUG_MODE && this.frameCount % 600 === 0) { // 10秒输出一次
    console.log('平台系统正常运行，当前平台数:', this.platforms.length);
  }
}
```

**原则**：保持帧更新函数的高效和清洁，将调试信息通过其他方式获取。

### 视觉特效渲染原则

**重要**：为了保持游戏性能，所有视觉特效都不应使用Canvas阴影和发光效果。

#### 禁止使用的Canvas阴影API
- `ctx.shadowColor` - 阴影颜色
- `ctx.shadowBlur` - 阴影模糊半径  
- `ctx.shadowOffsetX` - 阴影X轴偏移
- `ctx.shadowOffsetY` - 阴影Y轴偏移

#### 性能原因
1. **GPU计算开销**：阴影模糊是GPU密集型操作
2. **渲染性能影响**：每个阴影都需要额外的绘制通道
3. **内存消耗**：阴影需要额外的纹理缓存
4. **移动设备兼容性**：低端设备上阴影渲染可能导致卡顿

#### 替代方案
1. **渐变效果**：使用`createRadialGradient()`和`createLinearGradient()`模拟发光
2. **多层绘制**：通过透明度和多层图形模拟深度
3. **颜色变化**：通过颜色亮度和饱和度变化表现视觉效果
4. **粒子系统**：使用小型粒子代替发光效果

#### 实现示例
```javascript
// ❌ 禁止：使用阴影API
ctx.shadowColor = '#FF0000';
ctx.shadowBlur = 10;
ctx.fillRect(x, y, width, height);

// ✅ 推荐：使用渐变模拟发光
const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
ctx.fillStyle = gradient;
ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
```

#### 开发规范
1. **新特效开发**：所有新的视觉特效都必须避免使用阴影API
2. **代码审查**：在代码审查时检查是否使用了阴影相关API
3. **性能测试**：特效开发完成后在低端设备上测试性能
4. **文档说明**：复杂特效需要在注释中说明实现原理

**原则**：优先考虑性能，通过创意的绘图技巧实现视觉效果，而不是依赖性能消耗大的阴影API。

### 微信小游戏Canvas清晰度适配原则

**重要**：微信Android端Canvas放缩策略变更后，必须正确适配Canvas清晰度以避免游戏元素位置错误和画面模糊问题。

#### 问题背景

2024年微信Android端调整了"在屏Canvas"的放缩策略，与iOS保持一致：
- **变更前**：Canvas的width/height会自动放缩为物理像素，保持最清晰状态
- **变更后**：需要手动设置 `canvas.width = screenWidth * pixelRatio` 来保持清晰度

#### 核心适配原理

游戏必须建立**三层坐标系统架构**：

```
物理像素层 (Canvas)    → canvas.width/height * pixelRatio
     ↕ ctx.scale()
逻辑像素层 (游戏逻辑)   → SCREEN_WIDTH/HEIGHT (游戏计算)
     ↕ 触摸转换
触摸事件层            → clientX/Y / pixelRatio
```

#### 必须实现的适配步骤

1. **Canvas物理尺寸设置**：
```javascript
// render.js
const pixelRatio = windowInfo.pixelRatio || 1;
canvas.width = windowInfo.screenWidth * pixelRatio;   // 物理像素
canvas.height = windowInfo.screenHeight * pixelRatio; // 物理像素
```

2. **渲染上下文缩放**：
```javascript
// render.js
const ctx = canvas.getContext('2d');
ctx.scale(pixelRatio, pixelRatio);  // 逻辑坐标自动映射到物理像素
```

3. **触摸坐标转换**：
```javascript
// input-system.js
getTouchCoordinates(touch) {
  return {
    x: (touch.clientX || 0) / PIXEL_RATIO,  // 转换为逻辑坐标
    y: (touch.clientY || 0) / PIXEL_RATIO   // 转换为逻辑坐标
  };
}
```

4. **逻辑尺寸系统**：
```javascript
// 在所有游戏类中使用逻辑尺寸，而不是canvas物理尺寸
this.logicalWidth = SCREEN_WIDTH;   // 导入自render.js
this.logicalHeight = SCREEN_HEIGHT; // 导入自render.js

// ❌ 错误：使用物理像素进行逻辑计算
const centerX = this.canvas.width / 2;

// ✅ 正确：使用逻辑像素进行逻辑计算
const centerX = this.logicalWidth / 2;
```

#### 关键注意事项

1. **坐标系统一致性**：
   - **渲染计算**：使用逻辑坐标，通过ctx.scale()自动缩放
   - **游戏逻辑**：使用逻辑坐标进行位置、碰撞、摄像机计算
   - **触摸事件**：将物理坐标转换为逻辑坐标
   - **clearRect等Canvas API**：使用逻辑尺寸（因为已设置scale）

2. **常见错误避免**：
   - **错误**：游戏逻辑直接使用`canvas.width/height`（现在是物理像素）
   - **正确**：游戏逻辑使用`SCREEN_WIDTH/HEIGHT`（逻辑像素）
   - **错误**：触摸坐标直接使用`clientX/Y`
   - **正确**：触摸坐标除以`pixelRatio`转换为逻辑坐标

3. **全面替换清单**：
   - 摄像机位置计算：`canvas.width/height` → `logicalWidth/Height`
   - 清理距离计算：`canvas.height * factor` → `logicalHeight * factor`
   - UI居中布局：`canvas.width/2` → `logicalWidth/2`
   - 粒子边界检查：使用逻辑尺寸
   - 背景渲染区域：使用逻辑尺寸

#### 向后兼容性

此适配方案在老版本微信上也能正常运行，具有完全的向后兼容性。

#### 测试验证

1. **清晰度测试**：文字和图像应该清晰锐利
2. **触摸响应测试**：按钮点击和手势识别准确
3. **布局一致性测试**：UI元素和游戏对象位置正确
4. **多设备测试**：在不同像素比设备上验证效果

**原则**：建立统一的坐标系统架构，确保渲染清晰度与交互准确性并存。

## 天使下凡一百层游戏使用说明

### 启动游戏
1. 在微信开发者工具中编译运行
2. 点击菜单中的"天使下凡一百层"按钮进入游戏

### 游戏操作方式
- **开始游戏**: 点击主菜单的"天使下凡一百层"按钮
- **游戏控制**: 具体操作方式取决于游戏实现
- **所有操作**: 仅支持触摸操作，不支持键盘

### 微信小游戏适配
- ✅ 使用wx.onTouchStart/onTouchEnd API处理触摸事件
- ✅ 游戏界面适配竖屏布局
- ✅ 触摸区域检测和响应
- ✅ 游戏状态管理和界面切换

### 主题系统设计

游戏采用**统一平台外观 + 主题化背景**的设计理念，在降低美术复杂度的同时保持丰富的视觉体验。

#### 四大天界主题
- **朝霞天界** (1-25层) - `dawn` 主题，温暖色调，新手友好
- **云海天界** (26-50层) - `cloud` 主题，清澈色调，进阶挑战
- **雷音天界** (51-75层) - `thunder` 主题，紫色调，高级区域
- **凡间边界** (76-100层) - `earth` 主题，大地色调，终极挑战

#### 设计原则
1. **主题影响范围**：
   - ✅ 背景图像随主题切换，营造不同氛围
   - ✅ 关卡生成参数根据主题调整难度和平台类型分布
   - ✅ UI颜色和特效可根据主题调整

2. **平台外观统一**：
   - ✅ 所有平台使用统一的颜色方案，不随主题变化
   - ✅ 平台类型通过固定颜色区分（如红色危险、绿色弹跳）
   - ✅ 简化美术资源制作和维护成本

3. **代码实现**：
   - 主题配置：`js/angel-descent/level/level-generator.js`
   - 背景管理：`js/runtime/resource-manager.js`
   - 平台外观：`js/angel-descent/entities/platform.js`

### 核心设计模式
- **观察者模式**: 事件系统解耦组件通信
- **单例模式**: 游戏状态全局管理
- **对象池模式**: 游戏对象重用提升流畅度
- **状态机模式**: 游戏状态转换管理
- **工厂模式**: 游戏对象创建和管理

## 开发注意事项和最佳实践

### 避免重复清理机制

**重要教训**：系统中多处清理同一类对象会导致预期外的行为和难以调试的问题。

#### 问题案例：生命果实重复清理
**症状**：
- 生命果实生成后快速消失
- 调试日志显示果实已生成但玩家看不到
- 果实数组总数异常下降，但无明确的清理日志

**根本原因**：
两个方法都在清理生命果实数组，使用不同的清理距离：
1. `updateLifeFruits()` - 使用 `canvas.height * 20` (宽松清理)
2. `updateLevelGeneration()` - 使用 `canvas.height * 3` (激进清理)

激进的清理机制会覆盖宽松的设置，导致果实被过早删除。

#### 解决方案
1. **单一职责原则**：每种对象类型只在一个方法中进行清理
2. **统一清理距离**：避免多处设置不同的清理参数
3. **明确清理日志**：在清理时添加日志便于调试
4. **代码审查**：定期检查是否存在重复清理机制

#### 预防措施
**在添加新的清理逻辑前，务必检查：**
1. 是否已有其他方法在清理同类对象
2. 清理距离和条件是否与现有逻辑冲突
3. 是否需要合并或重构现有清理机制

**搜索重复清理的方法：**
```bash
# 搜索所有清理相关操作
grep -r "\.splice\|\.filter.*=\|\.length.*=.*0" --include="*.js"
grep -r "清理\|cleanup\|clean" --include="*.js"
```

#### 当前清理机制分布
- **平台清理**：`updatePlatforms()` 方法统一处理
- **生命果实清理**：`updateLifeFruits()` 方法统一处理  
- **粒子清理**：各自的 `update*Particles()` 方法处理
- **对象池清理**：独立的 `cleanupObjectPools()` 方法

**原则**：每种游戏对象都应该有且仅有一个清理入口点。

### Canvas清晰度适配的坐标系统问题

**重要教训**：微信小游戏Canvas清晰度适配不仅仅是设置Canvas尺寸，更重要的是建立统一的坐标系统架构。

#### 问题案例：Canvas缩放后游戏元素位置错误

**症状**：
- 适配Canvas清晰度后，游戏元素位置完全错乱
- 触摸事件响应位置不准确
- UI布局和游戏对象显示位置不匹配

**根本原因**：
坐标系统不匹配，存在三个不同的坐标系统：
1. **Canvas物理尺寸**：`canvas.width/height * pixelRatio`（物理像素）
2. **渲染坐标系**：通过`ctx.scale(pixelRatio)`设置了缩放
3. **触摸坐标系**：`clientX/Y`基于物理像素，但游戏逻辑需要逻辑像素
4. **游戏逻辑坐标**：仍在使用`canvas.width/height`进行计算

#### 解决方案架构

1. **建立三层坐标系统**：
   - **物理像素层**：Canvas实际尺寸，用于硬件渲染
   - **逻辑像素层**：游戏逻辑计算，与屏幕分辨率一致
   - **触摸事件层**：转换物理坐标为逻辑坐标

2. **统一坐标转换规则**：
   - Canvas → 逻辑：通过`ctx.scale()`自动处理
   - 触摸 → 逻辑：除以`pixelRatio`进行转换
   - 游戏逻辑：完全使用逻辑尺寸进行计算

3. **全面替换canvas尺寸引用**：
   - 摄像机、UI布局、碰撞检测等全部使用逻辑尺寸
   - 避免在游戏逻辑中直接使用`canvas.width/height`

#### 预防措施

**在进行Canvas相关修改时，务必检查：**
1. 是否建立了完整的坐标系统架构
2. 触摸事件坐标转换是否正确
3. 游戏逻辑是否完全使用逻辑坐标
4. 渲染计算是否与坐标系统匹配

**搜索潜在坐标系统问题：**
```bash
# 搜索直接使用canvas尺寸的地方
grep -r "canvas\.width\|canvas\.height" --include="*.js"
# 搜索触摸坐标处理
grep -r "clientX\|clientY" --include="*.js"
```

**原则**：坐标系统必须在整个应用中保持一致性，任何坐标相关的修改都需要考虑全局影响。