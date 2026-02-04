# 📱 添加小游戏二维码指南

## 快速步骤

你在对话中提供的微信小游戏二维码需要手动保存到项目中。

### 方法 1：直接保存（推荐）

1. **保存二维码图片**
   - 从微信或其他来源保存小游戏二维码
   - 或者使用你刚才在对话中提供的二维码图片

2. **重命名并移动到项目**
   ```bash
   # 将二维码文件重命名为 qrcode.jpg 并复制到项目目录
   cp ~/Downloads/你的二维码.jpg docs/images/qrcode.jpg

   # 或者，如果二维码在桌面
   cp ~/Desktop/小游戏二维码.jpg docs/images/qrcode.jpg
   ```

3. **验证并提交**
   ```bash
   # 验证文件存在
   ls -lh docs/images/qrcode.jpg

   # 添加到 git
   git add docs/images/qrcode.jpg
   git commit -m "docs: 添加微信小游戏二维码"
   ```

### 方法 2：如果二维码在备案资料中

```bash
# 查找可能的二维码文件
find 备案资料 -name "*二维码*" -o -name "*qr*"

# 如果找到，复制到项目
cp 备案资料/二维码文件.jpg docs/images/qrcode.jpg
git add docs/images/qrcode.jpg
git commit -m "docs: 添加微信小游戏二维码"
```

### 方法 3：从对话中的图片保存

你在对话中提供的二维码特征：
- 中央是天使角色头像
- 周围是微信扫码图案
- 底部标注"公众号：雪上加码"

**保存步骤**：
1. 在聊天记录中找到那张二维码图片
2. 右键/长按保存图片到本地
3. 按照方法 1 的步骤操作

## 图片要求

- **格式**：JPG 或 PNG
- **建议尺寸**：600x600 像素或更大
- **文件大小**：不超过 500KB
- **清晰度**：确保可以被微信扫描识别

## 验证

添加完成后，可以通过以下方式验证：

1. **本地查看**
   ```bash
   open docs/images/qrcode.jpg  # macOS
   ```

2. **在 README 中预览**
   - 查看 README.md 中的二维码部分
   - 确保图片正确显示

## 完成后

```bash
# 推送到 GitHub
git push angel-descent master

# 在 GitHub 上查看 README，确认二维码显示正常
```

---

💡 **提示**：如果找不到原图，可以重新从微信小游戏后台获取小程序码/二维码。
