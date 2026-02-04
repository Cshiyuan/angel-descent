# 天使下凡一百层 🎮

<div align="center">

一款基于微信小游戏平台的动作冒险跳跃游戏，玩家控制天使角色从天界下凡至人间，穿越 100 层挑战。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![WeChat Mini Game](https://img.shields.io/badge/platform-WeChat%20Mini%20Game-07C160.svg)](https://developers.weixin.qq.com/minigame/dev/guide/)
[![JavaScript](https://img.shields.io/badge/language-JavaScript%20ES6+-yellow.svg)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)

[English](README.en.md) | 简体中文

</div>

## ✨ 游戏特色

- 🌅 **四大天界主题**：朝霞天界、云海天界、雷音天界、凡间边界四种不同风格的游戏区域
- 🎯 **七种平台类型**：普通、易碎、移动、消失、冰块、弹跳、危险平台，提供丰富的策略选择
- 📱 **触摸控制**：专为移动设备优化的流畅操作体验
- 🎨 **精美画面**：完整的粒子效果系统和平滑动画
- 🎵 **音效系统**：7 种不同的游戏音效，营造沉浸式体验
- ⚡ **性能优化**：对象池管理、Canvas 适配、60fps 流畅运行

## 🎮 游戏玩法

- **操作方式**：触摸屏幕左侧/右侧控制天使左右移动
- **游戏目标**：从天界安全下降到人间（100 层）
- **平台交互**：踩踏平台安全下降，避开危险平台
- **道具系统**：收集生命果实恢复生命值
- **难度递增**：随着层数增加，平台类型和分布更具挑战性

## 🛠️ 技术栈

| 技术类别 | 具体技术 |
|---------|---------|
| **平台** | 微信小游戏 v3.8.10 |
| **语言** | ES6+ JavaScript（模块化） |
| **渲染引擎** | HTML5 Canvas 2D |
| **开发工具** | 微信开发者工具 |
| **架构模式** | 事件驱动 + 状态机 + 对象池 |

### 核心技术亮点

- ✅ 原生微信小游戏 API（无 DOM 依赖）
- ✅ `wx.onTouchStart/Move/End` 触摸事件处理
- ✅ Canvas 清晰度适配（pixelRatio 处理）
- ✅ requestAnimationFrame 驱动的 60fps 游戏循环
- ✅ 对象池模式优化性能
- ✅ 程序化关卡生成系统

## 📦 安装与运行

### 前置要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（推荐最新稳定版）
- 微信小游戏 AppID（[注册申请](https://mp.weixin.qq.com/)）

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/Cshiyuan/angel-descent.git
cd angel-descent/hello-weminigame
```

2. **配置 AppID**
```bash
# 复制配置模板
cp project.config.json.example project.config.json

# 编辑 project.config.json，将 YOUR_WECHAT_APPID_HERE 替换为你的微信小游戏 appid
```

3. **打开项目**
   - 启动微信开发者工具
   - 选择"导入项目"
   - 选择 `hello-weminigame` 目录
   - 填入你的 AppID

4. **运行游戏**
   - 点击工具栏"编译"按钮
   - 在模拟器中查看游戏效果
   - 点击"真机调试"在手机上测试

## 📁 项目结构

```
hello-weminigame/
├── js/                                  # 主程序代码
│   ├── app.js                          # 应用主控制器
│   ├── render.js                       # Canvas 初始化系统
│   ├── event-manager.js                # 事件管理器
│   ├── angel-descent/                  # 核心游戏模块
│   │   ├── angel-descent-game.js      # 游戏主循环 (1439 行)
│   │   ├── core/                      # 核心系统
│   │   │   ├── animation-manager.js  # 动画管理
│   │   │   ├── sprite.js             # 精灵系统
│   │   │   └── platform-pool.js      # 对象池优化
│   │   ├── entities/                  # 游戏实体
│   │   │   ├── player.js             # 玩家角色
│   │   │   ├── platform.js           # 平台系统
│   │   │   └── life-fruit.js         # 生命果实
│   │   ├── level/                     # 关卡系统
│   │   │   └── level-generator.js    # 程序化生成
│   │   ├── managers/                  # 管理器
│   │   │   ├── render-manager.js     # 渲染管理
│   │   │   └── effects-manager.js    # 特效管理
│   │   └── ui/                        # UI 系统
│   ├── input/                          # 输入系统
│   └── runtime/                        # 运行时系统
├── audio/                               # 音频资源 (832KB)
│   ├── bgm.mp3                        # 背景音乐
│   └── *.mp3                          # 各类音效
├── images/                              # 图像资源
│   ├── backgrounds/                   # 四大天界背景
│   ├── character/                     # 角色精灵
│   └── platforms/                     # 平台图像
├── game.js                             # 项目入口文件
├── game.json                           # 微信小游戏配置
└── project.config.json                 # 项目配置（需自行创建）
```

**代码规模**：5,300+ 行核心游戏代码

## 🎨 游戏系统设计

### 四大天界主题

| 主题 | 层数 | 特点 | 色调 |
|-----|------|------|------|
| 朝霞天界 | 1-25层 | 新手友好，温暖氛围 | 温暖橙红 |
| 云海天界 | 26-50层 | 进阶挑战，清澈空灵 | 清冷蓝白 |
| 雷音天界 | 51-75层 | 高级区域，紫电雷鸣 | 神秘紫色 |
| 凡间边界 | 76-100层 | 终极挑战，接近人间 | 大地暗色 |

### 七种平台类型

| 平台类型 | 特性 | 颜色 | 策略提示 |
|---------|------|------|---------|
| 普通平台 | 稳定可靠 | 灰色 | 安全落脚点 |
| 易碎平台 | 踩踏后破裂 | 棕色 | 快速通过 |
| 移动平台 | 水平/垂直移动 | 金色 | 把握时机 |
| 消失平台 | 定时出现消失 | 粉色 | 节奏感 |
| 冰块平台 | 滑溜难控 | 天蓝 | 小心打滑 |
| 弹跳平台 | 向上反弹 | 绿色 | 利用弹跳 |
| 危险平台 | 造成伤害 | 深红 | 避免接触 |

## 📚 文档

- [游戏设计文档](hello-weminigame/GAME_DESIGN_DOCUMENT.md) - 详细的游戏设计规范
- [开发指南](hello-weminigame/CLAUDE.md) - 开发注意事项和最佳实践
- [微信小游戏文档](hello-weminigame/WEMINGAME.md) - 微信小游戏特性说明
- [更新日志](CHANGELOG.md) - 版本更新记录

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

在贡献之前，请阅读 [贡献指南](CONTRIBUTING.md)。

### 贡献者

感谢所有为本项目做出贡献的开发者！

## 🗺️ 路线图

- [x] 核心游戏玩法
- [x] 四大天界主题
- [x] 七种平台类型
- [x] 音效系统
- [x] 粒子特效
- [ ] 排行榜系统
- [ ] 成就系统
- [ ] 更多角色皮肤
- [ ] 社交分享功能

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 👨‍💻 作者

**Cshiyuan**

- GitHub: [@Cshiyuan](https://github.com/Cshiyuan)

## ⭐ Star History

如果这个项目对你有帮助，请给一个 Star！

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/Cshiyuan/angel-descent/issues)
- 发起 [Pull Request](https://github.com/Cshiyuan/angel-descent/pulls)

---

<div align="center">
Made with ❤️ by Cshiyuan
</div>
