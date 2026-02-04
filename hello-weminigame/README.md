# 天使下凡一百层 - 微信小游戏

> 📢 **完整项目文档请查看：[../README.md](../README.md)**

本目录为微信小游戏的主要代码和资源。

## 快速开始

1. 复制配置模板：
```bash
cp project.config.json.example project.config.json
```

2. 编辑 `project.config.json`，填入你的微信小游戏 AppID

3. 使用微信开发者工具打开本目录

## 项目结构

```
├── audio/                    # 音频资源
├── images/                   # 图像资源
├── js/                       # 核心代码
│   ├── angel-descent/       # 游戏主模块
│   ├── input/               # 输入系统
│   └── runtime/             # 运行时系统
├── game.js                  # 入口文件
├── game.json                # 游戏配置
└── project.config.json      # 项目配置（需自行创建）
```

## 重要文档

- [游戏设计文档](GAME_DESIGN_DOCUMENT.md) - 详细的游戏设计规范
- [开发指南](CLAUDE.md) - 开发注意事项和最佳实践
- [微信小游戏文档](WEMINGAME.md) - 微信小游戏特性说明

## 游戏特色

- 🌅 四大天界主题：朝霞、云海、雷音、凡间
- 🎯 七种平台类型：普通、易碎、移动、消失、冰块、弹跳、危险
- 📱 触摸控制：专为移动设备优化
- ⚡ 性能优化：对象池、60fps 流畅运行




