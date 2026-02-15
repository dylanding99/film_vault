# FilmVault

> 为胶片摄影师打造的桌面应用，用于管理模拟摄影工作流。

## 功能特性

### 核心功能
- **胶卷导入**：将文件夹照片组织为胶卷
- **自动文件组织**：`[年份]/[日期]_[胶卷型号]_[相机]/`
- **图片处理**：生成缩略图（300px）和预览图（1920px）
- **胶卷卡片展示**：元数据编辑和管理
- **暗色主题 UI**

### v0.3.0 新增
- **EXIF 管理**：查看、编辑照片拍摄参数（ISO、光圈、快门、焦距）
- **元数据编辑**：编辑单个照片的拍摄参数和备注
- **文件 EXIF 读取**：从照片文件读取 EXIF 数据
- **元数据持久化**：在数据库中保存照片级 EXIF 信息

### v0.2.x 功能
- **筛选与搜索**：按胶卷型号、相机、日期范围筛选
- **设置增强**：自定义存储位置
- **胶卷详情页**：网格布局、全屏预览
- **批量删除**：支持胶卷和照片的批量删除操作
- **完整中文化**：全中文界面

## 快速开始

### 安装 Rust

```bash
# Windows
winget install Rustlang.Rustup

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

验证安装：
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

**版本**: v0.3.0
