# FilmVault

> 为胶片摄影师打造的桌面应用，用于管理模拟摄影工作流。

## ✨ 功能特性

**核心功能**：
- 📁 导入文件夹照片为胶卷
- 🗂️ 自动文件组织：`[年份]/[日期]_[胶卷型号]_[相机]/`
- 🖼️ 生成缩略图（300px）和预览图（1920px）
- 🎴 胶卷卡片展示和元数据编辑
- 🌙 暗色主题 UI

**v0.3.0 新增**：
- 📷 **EXIF 管理** - 查看、编辑照片拍摄参数（ISO、光圈、快门、焦距）
- 🔍 **筛选与搜索** - 按胶卷型号、相机、日期范围筛选
- ⚙️ **设置增强** - ExifTool 状态、自动写入开关、网格列数调整

**历史功能**（v0.2.x）：
- 📂 自定义存储位置
- 🖼️ 胶卷详情页（网格布局、全屏预览）
- 🗑️ 批量删除胶卷和照片
- 🌏 完整中文化界面

## 🚀 快速开始

### 推荐方式：GitHub Codespaces

**无需配置任何本地环境**，直接在浏览器中开发！

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new)

**步骤**：
1. 访问仓库 → Code → Codespaces → New codespace
2. 等待 2-3 分钟自动配置
3. 运行 `npm install && npm run tauri:dev`

**优势**：
- ✅ 完全免费（每月 60 小时）
- ✅ 零配置，浏览器开发
- ✅ 自动安装所有依赖

### 本地运行

**前置要求**：
- Node.js 18+
- Rust 工具链

**安装 Rust**：
```bash
# Windows
winget install Rustlang.Rustup

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**运行项目**：
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run tauri:dev
```

📖 **详细开发指南**: [DEVELOPMENT.md](DEVELOPMENT.md)

## 📁 项目结构

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
│   │   └── exif_tool.rs  # EXIF 工具集成
│   └── migrations/       # 数据库迁移
└── package.json
```

## 📚 项目文档

| 文档 | 说明 |
|------|------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | 本地开发环境设置和开发指南 |
| [ROADMAP.md](ROADMAP.md) | 功能规划和版本计划 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更记录 |
| [CLAUDE.md](CLAUDE.md) | 项目架构（供 AI 助手使用） |

## 🛠️ 技术栈

- **前端**: Next.js 15 + React + TypeScript + TailwindCSS
- **后端**: Tauri v2 + Rust
- **数据库**: SQLite + SQLx
- **状态管理**: React Query

## 📄 许可证

MIT

---

**版本**: v0.3.0 | **最后更新**: 2026-02-07
