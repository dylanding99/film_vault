# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述 / Project Overview

**FilmVault** 是为胶片摄影师设计的桌面应用程序，用于管理模拟摄影工作流。
**FilmVault** is a desktop application designed for analog film photographers to manage their film photography workflow.

**核心概念**: 物理文件夹 = 胶卷 / Core concept: Physical folder = Film roll

## 前置要求 / Prerequisites

**推荐开发方式**：GitHub Codespaces（无需本地配置）

详见 README.md

### 本地开发 / Local Development

如果需要在本地开发，可以选择：

1. **GitHub Codespaces**（推荐）- 零配置，浏览器开发
2. **Visual Studio Build Tools** - Windows 官方支持
3. **WSL 2** - Linux 子系统，无需 VS Build Tools

详见 DEVELOPMENT.md

```bash
# 验证 Rust 安装 / Verify installation
rustc --version
cargo --version
```

## 常用开发命令 / Common Development Commands

```bash
# 安装依赖 / Install dependencies
npm install

# 开发模式（启动 Next.js 和 Tauri）/ Development mode
npm run tauri:dev

# 构建生产版本 / Build production version
npm run tauri:build

# 代码检查 / Lint code
npm run lint
```

## 架构 / Architecture

### 混合桌面应用 / Hybrid Desktop Application
- **前端 Frontend**: Next.js 15 with App Router (runs in embedded WebView)
- **后端 Backend**: Rust via Tauri v2 (system-level operations)
- **数据库 Database**: SQLite with SQLx (compile-time checked queries)
- **状态管理 State Management**: React Query (`@tanstack/react-query`)

### 通信流程 / Communication Flow
```
React 组件 → db.ts (invoke) → Rust 命令 → SQLite/文件系统
           ←                            ←
```

前端通过 Tauri IPC 与 Rust 后端通信。所有后端函数作为命令暴露，通过 `src/lib/db.ts` 中的封装调用。
Frontend communicates with Rust backend through Tauri's IPC mechanism. All backend functions are exposed as commands and invoked through the wrapper in `src/lib/db.ts`.

### 核心后端模块 / Key Backend Modules

| File | Purpose |
|------|---------|
| `src-tauri/src/lib.rs` | Main entry, registers commands, manages `AppState` (database pool) |
| `src-tauri/src/database.rs` | SQLite connection pooling, migrations, queries |
| `src-tauri/src/image_processor.rs` | Generates thumbnails (300px) and previews (1920px) as WebP |
| `src-tauri/src/commands/import.rs` | File import, folder organization into `[YYYY]/[Date]_[Stock]_[Camera]/` |
| `src-tauri/src/commands/rolls.rs` | CRUD operations for rolls and photos |

### Database Access Pattern

Rust backend uses a connection pool stored in `AppState`:

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

The pool is initialized asynchronously on startup; commands must wait for it via `get_pool()`.

### Frontend State Management

Use React Query for all server state:

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
1. Create function in `src-tauri/src/commands/` with `#[tauri::command]` macro
2. Register in `src-tauri/src/lib.rs` invoke_handler
3. Add wrapper in `src/lib/db.ts`
4. Use in component via React Query

### Database Schema Changes
1. Create migration: `src-tauri/migrations/002_description.sql`
2. Update Rust structs in `src-tauri/src/database.rs`
3. Update TypeScript types in `src/types/roll.ts`
4. Migration runs automatically on next startup

## Component Architecture

### UI Components
- `src/components/ui/`: Base components (Button, Dialog, Input, Label, Select) - Shadcn/ui style, dark theme
- `src/components/`: Business logic components (RollCard, ImportDialog, EditMetadataForm, FilmStripBadge)

### Film Stock Color Badges
Film stocks have associated colors defined in `src/types/roll.ts` (FILM_STOCK_COLORS). The `FilmStripBadge` component renders these as visual indicators.

## Important Constraints

- **No external API calls** for map/geo features (planned: React-Leaflet with OpenStreetMap)
- **Image display**: Local images are converted to base64 data URLs via a Rust backend command (`read_image_as_base64` in `src-tauri/src/commands/rolls.rs`). Frontend calls this via `pathToAssetUrl()` in `src/lib/utils.ts` using Tauri's `invoke()` API. Returns `data:image/webp;base64,...` format for browser display.
- **ExifTool integration** (Phase 4): Call ExifTool from Rust, not frontend, for security

## Development Notes

- Hot reload: Frontend (Next.js) reloads automatically; Rust recompiles on Tauri restart
- TypeScript strict mode enabled
- Dark theme enforced via CSS variables in `src/app/globals.css`
- Tauri icons currently placeholder (see `src-tauri/icons/README.md`)
