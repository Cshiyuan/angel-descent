# 如何添加小游戏二维码

## 步骤

1. **保存二维码图片**
   - 将你提供的微信小游戏二维码保存到本地
   - 建议尺寸：600x600 像素或更大
   - 确保图片清晰可扫描

2. **重命名并放置**
   ```bash
   # 将二维码重命名为 qrcode.jpg
   # 放置到以下目录：
   cp 你的二维码.jpg /Users/shiyuanchen/Project/angel-descent/docs/images/qrcode.jpg
   ```

3. **提交到 Git**
   ```bash
   cd /Users/shiyuanchen/Project/angel-descent
   git add docs/images/qrcode.jpg
   git commit -m "docs: 添加小游戏二维码"
   git push
   ```

## 已提供的二维码特征

你提供的二维码包含：
- 天使角色头像（中央）
- 微信扫码图案
- 公众号：雪上加码

这是一个标准的微信小游戏二维码，扫描后可以直接打开游戏。

## 注意事项

- 确保二维码图片格式为 JPG 或 PNG
- 文件大小建议不超过 500KB
- 图片应该清晰，确保可以被微信扫描识别
