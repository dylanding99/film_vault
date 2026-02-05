# FilmVault 开发指南

## 当前项目状态

### ✅ 已完成

- ✅ Tauri v2 + Next.js 15 + TypeScript 项目框架
- ✅ Rust 后端（数据库、图片处理、导入、CRUD）
- ✅ 前端 UI 组件和主页面
- ✅ 暗色主题样式

### ⚠️ 待完成

- ⏳ 图标文件（见 `src-tauri/icons/README.md`）
- ⏳ 导入流程测试
- ⏳ 第二阶段功能（详情页、瀑布流、Lightbox、地图）

## 开发环境配置

### 方案 A：GitHub Codespaces（推荐）

**优势**：零配置、免费、浏览器开发

详细步骤见 README.md

### 方案 B：本地开发 - Visual Studio Build Tools

#### 安装步骤

1. **下载 Visual Studio Build Tools 2022**
   - https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

2. **安装时选择**：
   - 工作负载："使用 C++ 的桌面开发"
   - 确保：MSVC v143 + Windows 11 SDK

3. **重启终端**

4. **验证安装**：
   ```bash
   cl  # 应显示编译器版本
   ```

### 方案 C：本地开发 - WSL 2

#### 安装步骤

1. **启用 WSL**
   ```powershell
   wsl --install
   ```

2. **重启后配置 Ubuntu**

   在 Ubuntu 终端中：
   ```bash
   # 安装 Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env

   # 安装 Node.js 和依赖
   sudo apt update
   sudo apt install -y nodejs npm build-essential libgtk-3-dev libwebkit2gtk-4.1-dev

   # 进入项目
   cd /mnt/d/project/film_vault
   npm install
   npm run tauri:dev
   ```

## 常见问题排查

### 问题 1：`link.exe not found`

**原因**：未安装 Visual Studio Build Tools

**解决方案**：
- 方案 A：安装 VS Build Tools
- 方案 B：使用 WSL 2
- 方案 C：使用 GitHub Codespaces

### 问题 2：`cargo metadata` 失败

**原因**：Rust 未安装或未在 PATH 中

**解决方案**：
```bash
# Windows
rustc --version

# 如果提示找不到命令
winget install Rustlang.Rustup
```

### 问题 3：WSL 中找不到项目目录

**原因**：路径格式错误

**解决方案**：
```bash
# Windows 路径
D:\project\film_vault

# WSL 路径
/mnt/d/project/film_vault
```

### 问题 4：Tauri 窗口无法打开

**原因**：缺少系统依赖

**解决方案（WSL）**：
```bash
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev
```

### 问题 5：编译错误

**常见错误**：

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `dlltool.exe not found` | MinGW 配置问题 | 使用 WSL 2 或 VS Build Tools |
| `database is locked` | 数据库被占用 | 关闭所有应用实例 |
| `Port 3000 in use` | 端口被占用 | 更改端口或关闭占用进程 |

## 项目架构

### 前端（Next.js）

```
src/
├── app/                      # App Router
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 主页（胶卷网格）
│   └── globals.css          # 全局样式
├── components/              # React 组件
│   ├── ui/                  # 基础组件
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── RollCard.tsx         # 胶卷卡片
│   ├── ImportDialog.tsx     # 导入对话框
│   └── EditMetadataForm.tsx # 元数据编辑
├── lib/                     # 工具函数
│   ├── db.ts                # Tauri 命令封装
│   └── utils.ts
└── types/                   # TypeScript 类型
    └── roll.ts
```

### 后端（Rust/Tauri）

```
src-tauri/
├── src/
│   ├── lib.rs              # 主入口
│   ├── main.rs             # 入口包装
│   ├── database.rs         # SQLite 操作
│   ├── image_processor.rs  # 图片处理
│   └── commands/           # Tauri 命令
│       ├── import.rs       # 导入逻辑
│       └── rolls.rs        # CRUD 操作
├── migrations/             # 数据库迁移
│   └── 001_initial.sql
└── Cargo.toml
```

### 数据流程

```
React 组件 → db.ts (invoke) → Rust 命令 → SQLite/文件系统
           ←                            ←
```

## 添加新功能

### 新建 Tauri 命令

1. 在 `src-tauri/src/commands/` 创建文件
2. 使用 `#[tauri::command]` 宏标记函数
3. 在 `src-tauri/src/lib.rs` 中注册命令
4. 在 `src/lib/db.ts` 中添加封装
5. 使用 React Query 调用

### 数据库变更

1. 创建迁移文件 `src-tauri/migrations/002_xxx.sql`
2. 更新 Rust structs（`src-tauri/src/database.rs`）
3. 更新 TypeScript types（`src/types/roll.ts`）
4. 重启应用自动运行迁移

## 开发命令

```bash
# 开发模式
npm run tauri:dev

# 构建生产版本
npm run tauri:build

# 代码检查
npm run lint

# 类型检查
npx tsc --noEmit
```

## 获取帮助

- [Tauri 官方文档](https://tauri.app/v2/guides/)
- [Next.js 文档](https://nextjs.org/docs)
- [Rust 学习资源](https://www.rust-lang.org/learn)
