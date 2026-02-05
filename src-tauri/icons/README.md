# Tauri Icons Placeholder

此目录包含 Tauri 应用所需的图标文件。

## 需要的图标

- `32x32.png` - 32x32 像素 PNG
- `128x128.png` - 128x128 像素 PNG
- `128x128@2x.png` - 256x256 像素 PNG (高 DPI)
- `icon.icns` - macOS 图标
- `icon.ico` - Windows 图标

## 如何生成图标

你可以使用以下方法之一：

### 方法 1: 在线工具
访问 https://icon.kitchen 或类似网站，上传一个 1024x1024 的 PNG 图像，它会生成所有需要的格式。

### 方法 2: 命令行工具
```bash
# 安装 iconutil (macOS) 或使用 ImageMagick
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

### 方法 3: 使用 FFmpeg
```bash
ffmpeg -i icon.png -vf scale=32:32 32x32.png
ffmpeg -i icon.png -vf scale=128:128 128x128.png
ffmpeg -i icon.png -vf scale=256:256 "128x128@2x.png"
```

## 临时解决方案

在开发过程中，你可以使用任何图标作为临时占位符。Tauri 会在构建时警告缺少图标，但不会阻止构建。

对于快速测试，你可以：
1. 使用任何图片工具创建一个简单的 PNG 图标
2. 或者暂时注释掉 tauri.conf.json 中的图标配置
