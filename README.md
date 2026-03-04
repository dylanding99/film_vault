# FilmVault

> 为胶片摄影师打造的桌面应用，用于管理模拟摄影工作流。

## 功能特性

### 核心功能
- **胶卷导入**：将文件夹照片组织为胶卷
- **自动文件组织**：`[年份]/[日期]_[胶卷型号]_[相机]/`
- **图片处理**：生成缩略图（300px）和预览图（1920px）
- **胶卷卡片展示**：元数据编辑和管理
- **胶片预设管理**：创建、编辑、删除胶片预设，预设信息自动应用到导入的胶卷
- **暗色主题 UI**：电影级暗色风格设计

### 设计系统（v0.6.0）

FilmVault 采用**电影级编辑暗色**设计风格，提供完整的视觉体验：

**设计令牌系统**：
- 颜色：品牌色、背景层级（deep/surface/elevated/card）、文本层级（primary/secondary/tertiary）、强调色
- 间距：统一的 spacing scale（xs/sm/md/lg/xl/2xl）
- 排版：Display 字体（Instrument Serif）、Body 字体（Space Grotesk）、Mono 字体（DM Mono）
- 阴影：电影级深度阴影系统
- 动画：流畅的过渡效果（ease-out-quint）和微交互

**视觉特效**：
- 胶片框效果（Film Frame）：模拟胶片边框和齿孔
- 胶片颗粒（Film Grain）：可选的胶片颗粒叠加效果
- 发光效果（Glow）：品牌色柔和发光
- 卡片悬停动效：渐变遮罩和缩放效果

**组件系统**：
- 按钮系统：Primary、Secondary、Ghost 三种样式，支持不同尺寸
- 卡片系统：基础卡片、 elevated 卡片、胶卷卡片
- 筛选器系统：统一的 Filter Pill 样式和交互
- 搜索栏系统：聚焦状态和清除按钮
- 空状态组件：优雅的空状态展示
- Toast 通知：统一的提示反馈

**动画系统**：
- fadeInUp：淡入上移动画
- slideIn：滑入动画
- scaleIn：缩入动画
- float/drift：漂浮漂移动画
- 卡片揭示动画（card-reveal）

### EXIF 管理
- **EXIF 信息展示**：查看照片拍摄参数（ISO、光圈、快门、焦距）
- **元数据编辑**：编辑单个照片的拍摄参数和备注
- **文件 EXIF 读取**：从照片文件读取 EXIF 数据
- **位置信息**：城市、国家、GPS 坐标存储和显示
- **混合架构**：胶卷元数据保留在数据库，照片 EXIF 从文件读取

### 筛选与搜索
- **按胶卷型号筛选**：基于预设的胶片型号筛选
- **按相机筛选**：从常量库选择相机型号
- **按日期范围筛选**：选择起始和结束日期
- **搜索功能**：按胶卷名称、备注搜索
- **收藏筛选**：只查看有收藏的胶卷
- **URL 参数同步**：支持分享筛选链接

### 胶卷管理
- **设置增强**：自定义存储位置
- **胶卷详情页**：网格布局、全屏预览
- **批量删除**：支持胶卷和照片的批量删除操作
- **批量选择**：多选模式支持批量操作
- **完整中文化**：全中文界面

## 快速开始

### 安装 Rust

#### Windows
```bash
winget install Rustlang.Rustup
```

#### macOS/Linux
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### 验证安装

```bash
rustc --version
cargo --version
```

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run tauri:dev
```

### 构建生产版本

```bash
npm run tauri:build
```

详细开发指南请参考 [DEVELOPMENT.md](DEVELOPMENT.md)。

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
│   │   ├── commands/    # Tauri 命令
│   │   └── migrations/   # 数据库迁移
└── package.json
```

## 项目文档

| 文档 | 说明 |
|------|------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | 本地开发环境设置和开发指南 |
| [ROADMAP.md](ROADMAP.md) | 功能规划和版本计划 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更记录 |

## 技术栈

- **前端**: Next.js 15 + React + TypeScript + TailwindCSS
- **后端**: Tauri v2 + Rust
- **数据库**: SQLite + SQLx
- **状态管理**: React Query (@tanstack/react-query)

## 许可证

MIT

---

**版本**: v0.6.0
