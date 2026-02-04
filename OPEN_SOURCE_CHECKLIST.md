# 开源前检查清单

在将项目推送到 GitHub 之前，请按照此清单逐项检查。

## ✅ 已完成的项目

- [x] 添加 LICENSE 文件（MIT License）
- [x] 添加 .gitignore 文件
- [x] 创建 project.config.json.example 模板
- [x] 完善 README.md
- [x] 添加英文 README (README.en.md)
- [x] 添加 CONTRIBUTING.md 贡献指南
- [x] 添加 CHANGELOG.md 更新日志

## 🚨 必须手动完成的项目

### 1. 处理敏感信息

#### ⚠️ 移除真实的 AppID

**当前问题**：`hello-weminigame/project.config.json` 包含真实的微信小游戏 AppID

**解决步骤**：

```bash
cd /Users/shiyuanchen/Project/angel-descent

# 1. 查看当前的 project.config.json（确认包含真实 appid）
cat hello-weminigame/project.config.json | grep appid

# 2. 删除包含真实 appid 的文件
rm hello-weminigame/project.config.json

# 3. 验证 .gitignore 已配置（已自动添加）
cat .gitignore | grep "project.config.json"

# 4. 本地开发时，从模板创建配置文件
cd hello-weminigame
cp project.config.json.example project.config.json
# 然后手动编辑 project.config.json 填入你的 appid
```

**验证**：
```bash
# 确保 git 不会跟踪真实的配置文件
git status | grep "project.config.json"
# 应该只显示 project.config.json.example，不应显示 project.config.json
```

### 2. 处理中文文件夹

**当前问题**：存在三个中文命名的文件夹，可能包含私人资料

```
备案资料/
过程资料/
文档/
```

**建议处理方式**（选择其一）：

#### 方案 A：移出项目（推荐）

如果这些文件夹包含私人或敏感信息：

```bash
cd /Users/shiyuanchen/Project/angel-descent

# 1. 在项目外创建备份目录
mkdir -p ../angel-descent-private

# 2. 移动私人资料
mv 备案资料 ../angel-descent-private/
mv 过程资料 ../angel-descent-private/
mv 文档 ../angel-descent-private/

# 3. 验证已移除
ls -la | grep -E "(备案|过程|文档)"
```

#### 方案 B：添加到 .gitignore（如果需要保留在本地）

```bash
# 已自动添加到 .gitignore，确认：
cat .gitignore | grep -E "(备案|过程)"
```

#### 方案 C：重命名为英文（如果是项目相关文档）

```bash
mv 备案资料 registration-materials
mv 过程资料 process-materials
mv 文档 documents
```

### 3. 清理其他可能的敏感文件

检查以下文件是否包含敏感信息：

```bash
cd /Users/shiyuanchen/Project/angel-descent

# 检查是否有其他配置文件
ls -la hello-weminigame/*.json

# 检查营销文档是否应该开源
ls -la *.md

# 发现的文件：
# - AI原生开发游戏媒体引流方案.md
# - 小红书引流文章完整方案.md
# - GPT4_IMAGE_GENERATION_PROMPTS.md
# - GPT4_中文图像生成命令.md
```

**建议**：这些营销和内部文档不应该包含在开源项目中，应该：

```bash
# 移动到私人目录
mv AI原生开发游戏媒体引流方案.md ../angel-descent-private/
mv 小红书引流文章完整方案.md ../angel-descent-private/
mv GPT4_IMAGE_GENERATION_PROMPTS.md ../angel-descent-private/
mv GPT4_中文图像生成命令.md ../angel-descent-private/
```

或者添加到 .gitignore：

```bash
echo "# 营销和内部文档" >> .gitignore
echo "AI原生开发游戏媒体引流方案.md" >> .gitignore
echo "小红书引流文章完整方案.md" >> .gitignore
echo "GPT4_IMAGE_GENERATION_PROMPTS.md" >> .gitignore
echo "GPT4_中文图像生成命令.md" >> .gitignore
```

### 4. 整理 Git 提交历史

**当前问题**：最近的提交消息都是"提交代码"，不够描述性

**可选方案**：重写最近的提交历史

```bash
# 查看最近的提交
git log --oneline -5

# 方案A：压缩最近的提交（仅当还未推送到远程时）
# 警告：这会修改历史，仅在未推送时使用
git rebase -i HEAD~5

# 方案B：创建一个有意义的新提交
git add .
git commit -m "docs: 添加开源项目必需文件

- 添加 MIT License
- 添加 .gitignore
- 添加贡献指南和更新日志
- 完善 README（中英文）
- 创建配置文件模板
"
```

### 5. 提交未暂存的修改

```bash
cd /Users/shiyuanchen/Project/angel-descent

# 查看当前修改
git status

# 提交 player.js 的修改
cd hello-weminigame
git add js/angel-descent/entities/player.js
git commit -m "fix: 修复玩家相关问题"

# 提交 README 修改
git add README.md
git commit -m "docs: 简化 hello-weminigame 目录的 README"
```

## 📝 开源前最终检查

在推送到 GitHub 之前，执行最终检查：

```bash
cd /Users/shiyuanchen/Project/angel-descent

# 1. 确认没有敏感信息
git ls-files | grep -E "(config\.json$|\.env|secret|password|key)"

# 2. 确认 .gitignore 生效
git status

# 3. 查看将要推送的内容
git log --oneline --graph --all -10

# 4. 确认分支
git branch -a

# 5. 检查远程仓库
git remote -v
```

## 🚀 推送到 GitHub

### 首次推送（如果还未推送）

```bash
cd /Users/shiyuanchen/Project/angel-descent

# 添加所有新文件
git add .

# 创建提交
git commit -m "chore: 准备开源发布

- 添加开源许可证（MIT）
- 完善项目文档
- 移除敏感信息
- 添加贡献指南
"

# 推送到 GitHub
git push -u angel-descent master

# 如果主分支是 main，使用：
# git push -u angel-descent main
```

### 如果已有远程仓库

```bash
# 拉取最新代码
git pull angel-descent master

# 合并冲突（如果有）
# 解决冲突后：
git add .
git commit -m "merge: 合并远程更改"

# 推送
git push angel-descent master
```

## 📋 推送后的工作

### 1. 在 GitHub 上完善项目

- [ ] 添加项目描述
- [ ] 添加主题标签（topics）：`wechat-mini-game`, `game-development`, `javascript`, `canvas`
- [ ] 设置默认分支（main 或 master）
- [ ] 启用 Issues 和 Discussions
- [ ] 添加项目网站（如果有）

### 2. 添加徽章到 README

根据需要添加更多徽章：
```markdown
![GitHub stars](https://img.shields.io/github/stars/Cshiyuan/angel-descent)
![GitHub forks](https://img.shields.io/github/forks/Cshiyuan/angel-descent)
![GitHub issues](https://img.shields.io/github/issues/Cshiyuan/angel-descent)
```

### 3. 创建 Release

```bash
# 打标签
git tag -a v1.0.0 -m "首次开源发布"
git push angel-descent v1.0.0
```

然后在 GitHub 上创建 Release，上传游戏截图和演示。

### 4. 分享项目

- [ ] 在社交媒体分享
- [ ] 提交到游戏开发社区
- [ ] 写一篇介绍博客
- [ ] 在微信小游戏社区分享

## 🔒 安全提醒

- ✅ 确保没有提交密钥、密码或 token
- ✅ 确保没有提交个人身份信息
- ✅ 确保没有提交商业敏感信息
- ✅ 定期检查依赖的安全漏洞

## 📞 遇到问题？

如果在开源过程中遇到问题：

1. 检查 [GitHub 文档](https://docs.github.com/)
2. 搜索相关的 StackOverflow 问题
3. 查看其他开源项目的做法

---

祝你的开源项目成功！🎉
