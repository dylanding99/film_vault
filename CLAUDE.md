# CLAUDE.md

本文档为开发提供项目架构和技术背景说明。

## 项目概述

**FilmVault** 是为胶片摄影师设计的桌面应用程序，用于管理模拟摄影工作流。

**核心概念**: 物理文件夹 = 胶卷

## 前置要求

### 本地开发

如果需要在本地开发，可以选择：

1. **Visual Studio Build Tools** - Windows 官方支持
2. **WSL 2** - Linux 子系统，无需 VS Build Tools

详见 DEVELOPMENT.md

### 验证安装

```bash
# 验证 Rust 安装
rustc --version
cargo --version
```

## 常用开发命令

```bash
# 安装依赖
npm install

# 开发模式（启动 Next.js 和 Tauri）
npm run tauri:dev

# 构建生产版本
npm run tauri:build

# 代码检查
npm run lint
```

## 架构

### 混合桌面应用

- **前端 Frontend**: Next.js 15 with App Router (runs in embedded WebView)
- **后端 Backend**: Rust via Tauri v2 (system-level operations)
- **数据库 Database**: SQLite with SQLx (compile-time checked queries)
- **状态管理 State Management**: React Query (@tanstack/react-query)

### 通信流程

```
React 组件 → db.ts (invoke) → Rust 命令 → SQLite/文件系统
           ←                            ←
```

前端通过 Tauri IPC 与 Rust 后端通信。所有后端函数作为命令暴露，通过 `src/lib/db.ts` 中的封装调用。

### 核心后端模块

| File | Purpose |
|------|---------|
| `src-tauri/src/lib.rs` | Main entry, registers commands, manages AppState (database pool) |
| `src-tauri/src/database.rs` | SQLite connection pooling, migrations, queries |
| `src-tauri/src/image_processor.rs` | Generates thumbnails (300px) and previews (1920px) as WebP |
| `src-tauri/src/commands/import.rs` | File import, folder organization into `[YYYY]/[Date]_[Stock]_[Camera]/` |
| `src-tauri/src/commands/rolls.rs` | CRUD operations for rolls and photos, batch delete |
| `src-tauri/src/commands/config.rs` | Configuration management (library root path) |
| `src-tauri/src/config.rs` | Config module with default settings |

### Database Access Pattern

Rust backend uses a connection pool stored in AppState:

```rust
struct AppState {
    db_pool: Arc<tokio::sync::Mutex<Option<SqlitePool>>>,
}

// All commands receive state as parameter
#[tauri::command]
pub async fn some_command(state: State<'_, AppState>) -> Result<T, String> {
    let pool = get_pool(&state).await?;
    // ... use pool
}
```

连接池在启动时异步初始化；命令必须通过 get_pool() 等待它就绪。

### Frontend State Management

使用 React Query 管理所有服务器状态：

```typescript
const { data: rolls } = useQuery({
  queryKey: ['rolls'],
  queryFn: getAllRolls,
});

const mutation = useMutation({
  mutationFn: importFolder,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['rolls'] });
  },
});
```

## File Organization

### Imported Photos Storage

```
[Library Root]/
└── [YYYY]/
    └── [YYYY-MM-DD]_[FilmStock]_[Camera]/
        ├── [original files]
        ├── thumbnails/
        │   └── [filename].webp   (300px)
        └── previews/
            └── [filename].webp   (1920px)
```

### Database Location

Windows: `%APPDATA%\com.filmvault.app\film_vault.db`

## Adding New Features

### New Tauri Command

1. 在 `src-tauri/src/commands/` 中创建函数，使用 `#[tauri::command]` 宏
2. 在 `src-tauri/src/lib.rs` 的 invoke_handler 中注册
3. 在 `src/lib/db.ts` 中添加封装
4. 在组件中使用 React Query 调用

### Database Schema Changes

1. 创建迁移: `src-tauri/migrations/002_description.sql`
2. 更新 Rust 结构体: `src-tauri/src/database.rs`
3. 更新 TypeScript 类型: `src/types/roll.ts`
4. 下次启动时自动运行迁移

## Component Architecture

### UI Components

- `src/components/ui/`: Base components (Button, Dialog, Input, Label, Select) - Shadcn/ui style, dark theme
- `src/components/`: Business logic components
  - **RollCard**: 胶卷卡片（支持选择模式）
  - **ImportDialog**: 导入对话框
  - **EditMetadataForm**: 元数据编辑表单
  - **FilmStripBadge**: 胶卷型号颜色标识
  - **BatchSelectionBar**: 批量选择操作栏（支持照片/胶卷）
  - **DeleteRollDialog**: 删除胶卷确认对话框（支持单个/批量）
  - **DeletePhotosDialog**: 删除照片确认对话框
  - **SettingsDialog**: 设置对话框（自定义存储路径）
  - **RollDetailHeader**: 胶卷详情页头部
  - **PhotoGrid**: 照片网格布局
  - **PhotoGridItem**: 照片网格项（支持选择）
  - **PhotoPreviewDialog**: 照片全屏预览

### Film Stock Color Badges

Film stocks have associated colors defined in `src/types/roll.ts` (FILM_STOCK_COLORS). The `FilmStripBadge` component renders these as visual indicators.

## Important Constraints

- **No external API calls**: 不进行外部 API 调用用于地图/地理位置功能
- **Image display**: Local images are converted to base64 data URLs via a Rust backend command (`read_image_as_base64` in `src-tauri/src/commands/rolls.rs`). Frontend calls this via `pathToAssetUrl()` in `src/lib/utils.ts` using Tauri's `invoke()` API. Returns `data:image/webp;base64,...` format for browser display.
- **ExifTool integration**: 从 Rust 调用 ExifTool，而非前端调用，出于安全考虑

## Development Notes

- Hot reload: Frontend (Next.js) reloads automatically; Rust recompiles on Tauri restart
- TypeScript strict mode enabled
- Dark theme enforced via CSS variables in `src/app/globals.css`
- Tauri icons currently placeholder (see `src-tauri/icons/README.md`)
