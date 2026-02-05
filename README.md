# FilmVault

为胶片摄影师打造的桌面应用，用于管理模拟摄影工作流。

## 技术栈

- **前端**: Next.js 15 + React + TypeScript + TailwindCSS
- **后端**: Tauri v2 + Rust
- **数据库**: SQLite + SQLx

## 功能特性

- ✅ 导入文件夹照片为胶卷
- ✅ 自动文件组织：`[年份]/[日期]_[胶卷型号]_[相机]/`
- ✅ 生成缩略图（300px）和预览图（1920px）
- ✅ 胶卷卡片展示和元数据编辑
- ✅ 暗色主题 UI

## 🚀 快速开始

### 推荐方式：GitHub Codespaces（最简单）

**无需配置任何本地环境**，直接在浏览器中开发！

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new)

**步骤**：

1. 推送项目到 GitHub
2. 访问仓库 → Code → Codespaces → New codespace
3. 等待 2-3 分钟自动配置
4. 运行 `npm run tauri:dev`

**优势**：
- ✅ 完全免费（每月 60 小时）
- ✅ 零配置，浏览器开发
- ✅ 自动安装所有依赖

### 本地开发

#### 前置要求

**需要安装 Rust**（除非使用 Codespaces）

```bash
# Windows (推荐)
winget install Rustlang.Rustup

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### 系统依赖（Windows 二选一）

**方案 A：Visual Studio Build Tools**（官方推荐）

1. 下载 [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. 安装时选择"使用 C++ 的桌面开发"
3. 重启终端

**方案 B：WSL 2**（无需 VS Build Tools）

```powershell
# 在 PowerShell（管理员）中运行
wsl --install

# 重启后，在 Ubuntu 中安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sudo apt install -y nodejs npm build-essential libwebkit2gtk-4.1-dev

# 进入项目（注意路径格式）
cd /mnt/d/project/film_vault
```

#### 安装和运行

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run tauri:dev
```

## 项目结构

```
film_vault/
├── src/                    # Next.js 前端
│   ├── app/               # 页面和布局
│   ├── components/        # React 组件
│   ├── lib/              # 工具函数
│   └── types/            # TypeScript 类型
├── src-tauri/            # Rust 后端
│   ├── src/
│   │   ├── database.rs   # SQLite 数据库
│   │   ├── commands/     # Tauri 命令
│   │   └── ...
│   └── migrations/       # 数据库迁移
├── .devcontainer/        # Codespaces 配置
├── package.json
└── tsconfig.json
```

## 开发指南

详细开发文档请查看 [DEVELOPMENT.md](DEVELOPMENT.md)，包括：
- 环境配置详解
- 常见问题排查
- 架构说明
- 添加新功能指南

## 许可证

MIT
