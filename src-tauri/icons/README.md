# Tauri Icons

## ⚠️ 当前问题

编译失败因为缺少 `icon.ico` (Windows 图标文件)。

## 🚀 快速解决方案

### 方法 1: 下载免费图标（推荐）

访问以下任一网站下载 ICO 格式图标：

1. **Flaticon** - https://www.flaticon.com/search?word=film
2. **IconFinder** - https://www.iconfinder.com/search?q=film&price=free
3. **Icons8** - https://icons8.com/icons/set/film

下载后：
1. 重命名为 `icon.ico`
2. 放到当前目录 (`src-tauri/icons/`)

### 方法 2: 在线转换

1. 访问 https://icoconvert.com/
2. 上传任意 PNG 图片（建议 512x512 或更大）
3. 选择 ICO 格式
4. 下载并保存到当前目录

### 方法 3: 使用 Tauri CLI 生成

```bash
# 1. 下载任意 PNG 图标（1024x1024 推荐）
# 2. 放到项目根目录命名为 app-icon.png
# 3. 运行:
npm run tauri icon app-icon.png
```

## 验证图标

```powershell
# 检查文件是否存在
Test-Path "D:\project\film_vault\src-tauri\icons\icon.ico"

# 查看文件信息
Get-Item "D:\project\film_vault\src-tauri\icons\icon.ico"
```

## 完成后

下载图标后重新编译：
```bash
npm run tauri:dev
```

---

## 原始说明（参考）

### 需要的图标文件

- `32x32.png` - 32x32 像素 PNG
- `128x128.png` - 128x128 像素 PNG
- `128x128@2x.png` - 256x256 像素 PNG (高 DPI)
- `icon.icns` - macOS 图标
- `icon.ico` - Windows 图标 **← 当前缺少**
