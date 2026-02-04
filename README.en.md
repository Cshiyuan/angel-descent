# Angel Descent 100 Floors 🎮

<div align="center">

An action-adventure jumping game on WeChat Mini Game platform where players control an angel descending from heaven to earth through 100 challenging floors.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![WeChat Mini Game](https://img.shields.io/badge/platform-WeChat%20Mini%20Game-07C160.svg)](https://developers.weixin.qq.com/minigame/dev/guide/)
[![JavaScript](https://img.shields.io/badge/language-JavaScript%20ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

English | [简体中文](README.md)

</div>

## ✨ Features

- 🌅 **Four Celestial Themes**: Dawn Heaven, Cloud Heaven, Thunder Heaven, and Earthly Boundary with distinct visual styles
- 🎯 **Seven Platform Types**: Normal, Fragile, Moving, Disappearing, Ice, Bouncing, and Dangerous platforms offering rich strategic choices
- 📱 **Touch Controls**: Smooth operation experience optimized for mobile devices
- 🎨 **Beautiful Graphics**: Complete particle effect system and smooth animations
- 🎵 **Sound System**: 7 different game sound effects for immersive experience
- ⚡ **Performance Optimized**: Object pooling, Canvas adaptation, 60fps smooth operation

## 🎮 Gameplay

- **Controls**: Tap left/right side of screen to move the angel
- **Objective**: Safely descend from heaven to earth (100 floors)
- **Platform Interaction**: Land on platforms to descend safely, avoid dangerous platforms
- **Power-ups**: Collect life fruits to restore health
- **Progressive Difficulty**: Platform types and distributions become more challenging as you descend

## 🛠️ Tech Stack

| Category | Technology |
|---------|-----------|
| **Platform** | WeChat Mini Game v3.8.10 |
| **Language** | ES6+ JavaScript (Modular) |
| **Renderer** | HTML5 Canvas 2D |
| **Dev Tools** | WeChat DevTools |
| **Architecture** | Event-driven + State Machine + Object Pool |

### Technical Highlights

- ✅ Native WeChat Mini Game API (no DOM dependency)
- ✅ `wx.onTouchStart/Move/End` touch event handling
- ✅ Canvas clarity adaptation (pixelRatio handling)
- ✅ requestAnimationFrame driven 60fps game loop
- ✅ Object pool pattern for performance optimization
- ✅ Procedural level generation system

## 📦 Installation & Running

### Prerequisites

- [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) (Latest stable version recommended)
- WeChat Mini Game AppID ([Register here](https://mp.weixin.qq.com/))

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Cshiyuan/angel-descent.git
cd angel-descent/hello-weminigame
```

2. **Configure AppID**
```bash
# Copy configuration template
cp project.config.json.example project.config.json

# Edit project.config.json and replace YOUR_WECHAT_APPID_HERE with your WeChat Mini Game appid
```

3. **Open Project**
   - Launch WeChat DevTools
   - Select "Import Project"
   - Choose `hello-weminigame` directory
   - Enter your AppID

4. **Run the Game**
   - Click "Compile" button in toolbar
   - View game in simulator
   - Click "Real Device Debugging" to test on phone

## 📁 Project Structure

```
hello-weminigame/
├── js/                                  # Main program code
│   ├── app.js                          # App main controller
│   ├── render.js                       # Canvas initialization
│   ├── event-manager.js                # Event manager
│   ├── angel-descent/                  # Core game module
│   │   ├── angel-descent-game.js      # Game main loop (1439 lines)
│   │   ├── core/                      # Core systems
│   │   ├── entities/                  # Game entities
│   │   ├── level/                     # Level system
│   │   ├── managers/                  # Managers
│   │   └── ui/                        # UI system
│   ├── input/                          # Input system
│   └── runtime/                        # Runtime system
├── audio/                               # Audio resources (832KB)
├── images/                              # Image resources
│   ├── backgrounds/                   # Four celestial backgrounds
│   ├── character/                     # Character sprites
│   └── platforms/                     # Platform images
├── game.js                             # Entry point
├── game.json                           # WeChat Mini Game config
└── project.config.json                 # Project config (create yourself)
```

**Code Scale**: 5,300+ lines of core game code

## 🎨 Game System Design

### Four Celestial Themes

| Theme | Floors | Features | Color Tone |
|-------|--------|----------|------------|
| Dawn Heaven | 1-25 | Beginner-friendly, warm atmosphere | Warm orange-red |
| Cloud Heaven | 26-50 | Advanced challenge, clear and ethereal | Cool blue-white |
| Thunder Heaven | 51-75 | Expert area, purple lightning | Mysterious purple |
| Earthly Boundary | 76-100 | Ultimate challenge, approaching earth | Dark earth tones |

### Seven Platform Types

| Type | Features | Color | Strategy |
|------|----------|-------|----------|
| Normal | Stable and reliable | Gray | Safe landing |
| Fragile | Breaks after landing | Brown | Pass quickly |
| Moving | Horizontal/vertical movement | Gold | Timing matters |
| Disappearing | Appears/disappears periodically | Pink | Rhythm sense |
| Ice | Slippery and hard to control | Sky blue | Watch for sliding |
| Bouncing | Bounces upward | Green | Use bounce |
| Dangerous | Causes damage | Dark red | Avoid contact |

## 📚 Documentation

- [Game Design Document](hello-weminigame/GAME_DESIGN_DOCUMENT.md) - Detailed game design specifications
- [Development Guide](hello-weminigame/CLAUDE.md) - Development notes and best practices (Chinese)
- [WeChat Mini Game Docs](hello-weminigame/WEMINGAME.md) - WeChat Mini Game feature description (Chinese)
- [Changelog](CHANGELOG.md) - Version update history

## 🤝 Contributing

Issues and Pull Requests are welcome!

Please read [Contributing Guide](CONTRIBUTING.md) before contributing.

### Contributors

Thanks to all developers who contributed to this project!

## 🗺️ Roadmap

- [x] Core gameplay mechanics
- [x] Four celestial themes
- [x] Seven platform types
- [x] Sound system
- [x] Particle effects
- [ ] Leaderboard system
- [ ] Achievement system
- [ ] More character skins
- [ ] Social sharing features

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👨‍💻 Author

**Cshiyuan**

- GitHub: [@Cshiyuan](https://github.com/Cshiyuan)

## ⭐ Star History

If this project helps you, please give it a Star!

## 📞 Contact

For questions or suggestions, feel free to contact through:

- Submit [Issue](https://github.com/Cshiyuan/angel-descent/issues)
- Create [Pull Request](https://github.com/Cshiyuan/angel-descent/pulls)

---

<div align="center">
Made with ❤️ by Cshiyuan
</div>
