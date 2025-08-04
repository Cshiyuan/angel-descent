# 天使下凡一百层 - 微信小游戏

微信小游戏平台的动作冒险游戏，玩家控制天使角色从天界下凡至人间。

## 项目结构

```
├── audio/                                     // 音频资源
│   ├── angel_frozen.mp3                       // 天使冰冻音效
│   ├── angel_hurt.mp3                         // 天使受伤音效
│   ├── bgm.mp3                                // 背景音乐
│   ├── life_fruit_collect.mp3                 // 生命果收集音效
│   └── platform_*.mp3                         // 平台相关音效
├── images/                                    // 图片资源
│   ├── backgrounds/                           // 四大天界主题背景
│   ├── character/angel/                       // 天使角色精灵
│   └── platforms/                             // 各类型平台图像
├── js/
│   ├── angel-descent/                         // 天使下凡一百层游戏核心
│   │   ├── angel-descent-game.js              // 游戏主控制器
│   │   ├── core/                              // 核心系统（动画、精灵）
│   │   ├── entities/                          // 游戏实体（玩家、平台等）
│   │   ├── level/                             // 关卡生成系统
│   │   └── ui/                                // 游戏UI系统
│   ├── input/                                 // 输入系统
│   ├── runtime/                               // 运行时系统（音频、资源）
│   ├── app.js                                 // 应用主控制器
│   ├── event-manager.js                       // 事件管理器
│   └── render.js                              // Canvas渲染初始化
├── game.js                                    // 游戏入口文件
├── game.json                                  // 微信小游戏配置
└── project.config.json                        // 项目配置
```

## 游戏特色

- **四大天界主题**：朝霞、云海、雷音、凡间四种不同风格的游戏区域
- **平台跳跃机制**：多种类型平台提供丰富的游戏策略
- **垂直下凡体验**：从天界到人间的100层下凡之旅
- **触摸控制**：专为移动设备优化的触摸操作




