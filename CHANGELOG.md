# FilmVault 变更日志

本文档记录 FilmVault 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.3.0] - 2026-02-08

### 新增

**EXIF 模块**：
- ✨ ExifInfoPanel 组件 - 显示照片 EXIF 信息（ISO、光圈、快门、焦距、GPS）
- ✨ PhotoMetadataForm 组件 - 编辑单张照片的拍摄参数
- ✨ EXIF 信息显示在照片预览对话框（可切换显示/隐藏）
- ✨ 从文件读取 EXIF 数据功能
- ✨ 保存 EXIF 到照片文件功能
- ✨ EXIF 同步状态显示（已同步/未同步）
- ✨ 写入时间追踪
- ✨ 混合架构：胶卷元数据保留在数据库，照片 EXIF 从文件读取

**筛选与搜索功能**：
- ✨ RollFilters 组件 - 按胶卷型号筛选
- ✨ RollFilters 组件 - 按相机筛选
- ✨ 搜索框 - 按胶卷名称、备注搜索
- ✨ 日期范围筛选
- ✨ 收藏筛选（只看有收藏的胶卷）
- ✨ URL 参数同步 - 支持分享筛选链接
- ✨ 筛选条件持久化（刷新页面后保持）

**设置页面增强**：
- ✨ EXIF 设置面板
- ✨ ExifTool 状态显示（可用/不可用/检查中）
- ✨ 自动写入 EXIF 开关（全局设置）
- ✨ 并发 EXIF 写入数设置（1-8 滑块）
- ✨ 设置路径使用 React Query 管理（自动同步）
- ✨ 设置界面完整中文化

**UI 组件**：
- ✨ Slider 组件 - 滑块输入（基于 Radix UI）
- ✨ Switch 组件 - 开关切换（基于 Radix UI）

### 技术实现
**架构变更 - 混合 EXIF 方案**：
- 胶卷层级元数据（相机、镜头、胶卷型号）保留在数据库
- 照片层级 EXIF（ISO、光圈、快门、焦距）直接从文件读取
- 优势：数据源单一，无需手动同步，不会出现不一致

**前端（TypeScript + React）**：
- 新建 `ExifInfoPanel.tsx` 组件
- 新建 `PhotoMetadataForm.tsx` 组件
- 更新 `PhotoPreviewDialog.tsx` 集成 EXIF 功能
- 新建 `filter-utils.ts` 添加 URL 参数同步功能
- 更新 `SettingsDialog.tsx` 添加 EXIF 配置面板
- 更新 `page.tsx` 使用 React Query 管理配置状态
- 新建 `ui/slider.tsx` 和 `ui/switch.tsx` 组件

**后端（Rust）**：
- EXIF 后端已在之前版本完成（`exif_tool.rs`、`commands/exif.rs`）
- 更新 `Photo` 结构体移除照片级 EXIF 字段
- 更新 `write_photo_exif_command` 只写入文件，不同步到数据库
- 增强 `get_library_root` 和 `set_library_root` 日志输出

**数据库变更**：
- 迁移 004 - 添加 EXIF 写入追踪和照片级 EXIF 字段
- 迁移 005 - 添加 EXIF 和 UI 设置字段
- 迁移 006 - 移除照片级 EXIF 列（混合架构）
- 新增 `settings` 表字段：
  - `exif_auto_write` (INTEGER DEFAULT 1) - 自动写入 EXIF 开关
  - `exif_concurrent_writes` (INTEGER DEFAULT 4) - 并发写入数
- 迁移文件：
  - `src-tauri/migrations/004_exif_write_tracking.sql`
  - `src-tauri/migrations/005_settings_exif.sql`
  - `src-tauri/migrations/006_remove_photo_exif.sql`

### 改进
- 🎨 照片详情页 UI 优化（EXIF 面板左上角浮动）
- 🎨 筛选条件持久化（URL 参数同步）
- 🎨 设置页面分组显示（存储/EXIF）
- 🎨 状态管理优化（统一使用 React Query）

### 已修复问题
- ✅ 修复封面按钮状态更新问题（点击后立即显示反馈）
- ✅ 修复删除封面后自动设置新封面
- ✅ 修复设置路径保存后刷新显示问题（使用 React Query 管理配置）
- ✅ 修复胶卷详情页 SQL 查询错误（get_roll_cover 移除已删除字段）
- ✅ 移除海拔 EXIF 字段
- ✅ 移除网格列数调整功能（用户需求）
- ✅ 修复筛选后刷新页面丢失筛选条件（URL 参数同步）

### Bug 修复详情
**混合架构重构（体验优化 005）**：
- 问题描述：数据库和文件双向同步 EXIF 容易出错
- 修复方案：实施混合架构，胶卷元数据保留在数据库，照片 EXIF 从文件读取
- 影响文件：数据库迁移 006、Photo 结构体、ExifInfoPanel、PhotoPreviewDialog

**设置路径显示问题（体验优化 003）**：
- 问题描述：设置路径后，第二次打开软件显示"(未设置)"
- 修复方案：使用 React Query 直接管理配置状态，移除本地 useState
- 影响文件：page.tsx、SettingsDialog.tsx

**筛选条件持久化（体验优化 007）**：
- 问题描述：筛选后刷新页面丢失筛选条件
- 修复方案：使用 URL 参数同步筛选条件
- 影响文件：filter-utils.ts、page.tsx

**其他修复**：
- 移除海拔 EXIF 字段（体验优化 004）
- 移除网格列数调整功能（体验优化 006）

---

## [0.2.1] - 2026-02-07

### 改进
- 🎨 简化删除功能，移除复杂的删除选项
- 🎨 统一删除逻辑：胶卷删除直接删除整个文件夹，照片删除包含原图
- 🎨 优化删除后的缓存刷新，避免加载已删除文件

### 已修复问题
- ✅ 删除胶卷后立即从列表移除（无需刷新）
- ✅ 删除后不再尝试加载已删除文件
- ✅ 修复详情页删除胶卷后的导航问题
- ✅ 修复导入后列表不刷新问题（使用 resetQueries）
- ✅ 修复预览对话框收藏状态不同步问题
- ✅ 修复导入空文件夹创建空胶卷问题

### Bug 修复详情

**删除功能简化**：
- 移除多选项删除对话框，改为简单确认对话框
- 胶卷删除：数据库 + 缩略图 + 预览图 + 原图 + 整个文件夹
- 照片删除：数据库 + 缩略图 + 预览图 + 原图

**缓存刷新优化**：
- 使用 `setQueryData` 立即从缓存移除已删除项目
- 避免 React Query 加载已删除文件的路径

**导入功能优化**：
- 使用 `resetQueries` 强制刷新导入后的列表
- 在两次 refetch 之间添加延迟确保查询顺序执行

**其他修复**：
- 在 `ImportDialog` 中添加前端验证，检查文件夹是否包含图片
- 在 `PhotoPreviewDialog` 的收藏操作后更新 `previewPhoto` 状态

---

## [0.2.0] - 2026-02-06

### 新增

**自定义存储位置**：
- ✅ 设置对话框，可自定义图库存储路径
- ✅ 配置持久化（SQLite settings 表）
- ✅ 首次运行自动检测并提示设置存储位置
- ✅ 支持修改存储路径

**胶卷详情页面**：
- ✅ 点击胶卷卡片进入详情页
- ✅ 响应式照片网格布局（2-6 列自适应）
- ✅ 照片全屏预览（支持键盘左右箭头切换）
- ✅ 批量选择照片（复选框）
- ✅ 设置封面照片功能
- ✅ 照片数量统计

**删除功能（胶卷和照片）**：
- ✅ 批量删除胶卷（选择模式）
- ✅ 批量删除照片（详情页）
- ✅ 删除确认对话框（防止误删）
- ✅ 文件删除选项：
  - 删除缩略图和预览图
  - 可选删除原始照片文件
- ✅ 两层删除功能：
  - 首页：批量选择和删除整个胶卷
  - 详情页：批量选择和删除照片
- ✅ 删除操作二次确认
- ✅ 清晰的警告信息和删除预览

**用户界面优化**：
- ✅ 完整中文化（所有 UI 提示和操作按钮）
- ✅ 选择模式按钮（首页头部工具栏）
- ✅ 批量操作栏（底部固定）
- ✅ 选中状态视觉反馈（蓝色高亮 + 勾选图标）
- ✅ 暗色主题保持一致

### 改进
- 🎨 优化用户体验流程（导入 → 浏览 → 删除）
- 🎨 统一删除对话框设计（支持单个/批量删除）
- 🎨 批量操作栏支持不同内容类型（照片/胶卷）

### 技术实现
**后端（Rust）**：
- 添加 `delete_photo()` 和 `delete_photos()` 数据库函数
- 实现 `delete_photo_command` 和 `delete_photos_command` 命令
- 支持物理文件删除（缩略图和预览图）
- 添加配置管理模块（`config.rs`）
- 实现 `get_config` 和 `update_library_root` 命令

**前端（TypeScript + React）**：
- 新建 `DeletePhotosDialog.tsx` 组件
- 更新 `BatchSelectionBar.tsx` 支持删除和中文化
- 更新 `RollCard.tsx` 支持选择模式
- 新建 `SettingsDialog.tsx` 组件
- 首页添加批量选择和删除功能
- 详情页添加批量删除照片功能

### 数据库变更
- 新增 `settings` 表（存储配置信息）
- 迁移文件：`src-tauri/migrations/002_settings.sql`

### 已修复问题
- ✅ 批量删除胶卷时，选择多个胶卷删除按钮不显示的问题
- ✅ 导入后列表不刷新问题（使用 `resetQueries` 强制刷新）
- ✅ 预览对话框收藏按钮状态不同步问题（更新 `previewPhoto` 状态）
- ✅ 导入空文件夹创建空胶卷问题（添加前端验证）

### Bug 修复详情
**导入后列表不刷新**：
- 问题描述：导入胶卷后首页不显示新胶卷，需要按 Ctrl+R 刷新
- 修复方案：使用 `resetQueries` 代替 `invalidateQueries`，添加延迟确保查询顺序执行
- 影响文件：`src/app/page.tsx`

**预览对话框收藏状态不同步**：
- 问题描述：在大图预览模式下点击收藏按钮，按钮状态不变
- 修复方案：在收藏操作完成后从缓存获取更新后的照片数据并更新 `previewPhoto` 状态
- 影响文件：`src/app/rolls/[id]/page.tsx`

**导入空文件夹创建空胶卷**：
- 问题描述：选择不包含图片的文件夹时仍会创建空胶卷，且提示两次错误
- 修复方案：在前端添加验证，调用 `previewImportCount` 检查文件夹内容
- 影响文件：`src/components/ImportDialog.tsx`

---

## [0.1.0] - 2026-02-06

### 新增
**核心功能**：
- 胶卷导入功能（支持 JPG、PNG、WebP、TIFF 等格式）
- 自动缩略图生成（300px WebP 格式）
- 自动预览图生成（1920px WebP 格式）
- 胶卷列表展示（卡片式布局）
- 多胶卷管理（支持导入多个胶卷）
- 自动路径冲突检测和处理（添加序号后缀）

**元数据管理**：
- 胶卷元数据编辑（名称、胶卷型号、相机、镜头、日期、备注）
- 胶卷型号预设（Kodak Portra、Fujifilm 等）
- 相机型号预设（Canon、Nikon、Olympus 等）
- 拍摄日期选择器

**数据管理**：
- SQLite 数据库持久化
- 胶卷和照片关联存储
- 数据库自动初始化和迁移
- Windows 本地文件系统存储

**用户界面**：
- 暗色主题界面
- FilmStripBadge 胶卷型号颜色标识
- 响应式布局
- 导入对话框
- 元数据编辑对话框

### 技术实现
**架构**：
- Next.js 15 + App Router
- Tauri v2 桌面应用框架
- React Query 数据缓存管理
- Rust + SQLx SQLite 数据库
- TypeScript 前端 + Rust 后端

**关键技术点**：
- Base64 图片显示方案（通过 Rust 后端读取文件）
- React Query refetchQueries 缓存刷新优化
- 自动路径冲突检测（文件存在时添加序号）
- WebP 图片格式统一
- SQLite UNIQUE 约束优化

**数据库设计**：
- `rolls` 表：胶卷元数据（id, name, path, film_stock, camera, lens, shoot_date, lab_info, notes）
- `photos` 表：照片信息（id, roll_id, filename, file_path, thumbnail_path, preview_path, rating, is_cover, lat, lon, exif_synced）
- 外键关联：photos.roll_id → rolls.id
- 级联删除：删除胶卷时自动删除关联照片

### 已修复问题
**修复的问题**：
- 元数据编辑第一次保存不生效（使用 refetchQueries 替代 invalidateQueries）
- 导入第二个胶卷失败（添加路径冲突检测和自动序号）
- 导入胶卷后不自动显示（优化缓存刷新逻辑）
- 编辑元数据保存失败（从 UPDATE 语句移除 path 字段）

### 已知问题
- 无重大问题

### 测试状态
- 阶段一测试完成（94.9% 通过率）
- 37/39 测试项通过
- 核心功能验证完成

### 开发环境
- Rust 1.93.0
- Node.js 22.14.0
- Visual Studio Build Tools 2022
- Windows 10/11

### 文档
- 创建 LOCAL_DEV.md（本地开发环境设置）
- 创建 TEST_PHASE_1.md（测试清单）
- 创建 PHASE_1_TEST_SUMMARY.md（测试总结）
- 更新 CLAUDE.md（AI 辅助开发指南）

---

## 版本说明

### 版本号规则
- **主版本号**（Major）：不兼容的 API 变更
- **次版本号**（Minor）：向下兼容的功能性新增
- **修订号**（Patch）：向下兼容的问题修正

### 变更类型
- **新增**：新功能
- **改进**：现有功能的改进
- **修复**：问题修复
- **删除**：功能移除
- **安全**：安全相关的修复或改进
- **性能**：性能优化
- **文档**：文档更新

---

**最后更新**: 2026-02-06
