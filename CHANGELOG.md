# FilmVault 变更日志

本文档记录 FilmVault 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.4.0] - 2026-02-15

### 新增

**位置功能增强**：
- LocationSearchInput 组件 - 城市搜索和位置选择功能
- 地理编码集成 - 使用 OpenStreetMap Nominatim API
- 位置信息存储 - Roll 表和 Photo 表添加地理位置字段
- 位置信息显示 - ExifInfoPanel 显示 GPS 坐标
- 位置编辑 - EditMetadataForm 和 PhotoMetadataForm 支持位置选择

**EXIF 模块优化**：
- ExifInfoPanel 组件 - 显示照片 EXIF 信息（ISO、光圈、快门、焦距、GPS）
- PhotoMetadataForm 组件 - 编辑单张照片的拍摄参数和备注
- 从文件读取 EXIF 数据功能
- 保存 EXIF 到文件功能
- 混合架构：胶卷元数据保留在数据库，照片 EXIF 从文件读取

**筛选与搜索功能**：
- RollFilters 组件 - 按胶卷型号、相机筛选
- 搜索框 - 按胶卷名称、备注搜索
- 日期范围筛选
- 收藏筛选（只看有收藏的胶卷）
- URL 参数同步 - 支持分享筛选链接
- 筛选条件持久化（刷新页面后保持）

### 改进

**用户体验优化**：
- 添加取消全选功能 - BatchSelectionBar 支持"取消全选"操作
- 照片位置分层显示 - 优先显示照片位置，回退到胶卷位置
- 设置页面简化 - 移除未实现的 EXIF 设置（exifAutoWrite, exifConcurrentWrites）
- 位置应用到照片 - 只更新没有自己位置的照片
- 状态管理优化（统一使用 React Query）

### 已修复问题

- 修复预览导航除零错误
- 修复选择所有胶卷时使用全部而非筛选后的列表
- 修复编辑胶卷时缺少位置字段
- 移除动态导入，改为文件顶部导入（性能优化）
- 添加用户友好的错误提示

### 技术实现

**架构变更 - 位置信息存储**：
- 迁移 006 - 添加照片级地理位置字段
- 迁移 007 - 添加胶卷级地理位置字段
- 迁移 008 - 添加胶卷级地理位置字段
- Roll 表和 Photo 表都有 city, country, lat, lon 字段

**前端**：
- 新建 `LocationSearchInput.tsx` 组件
- 新建 `ExifInfoPanel.tsx` 组件
- 新建 `PhotoMetadataForm.tsx` 组件
- 新建 `filter-utils.ts` 添加 URL 参数同步功能
- 更新 `PhotoPreviewDialog.tsx` 集成 EXIF 功能
- 更新 `EditMetadataForm.tsx` 添加位置选择
- 更新 `BatchSelectionBar.tsx` 添加取消全选功能

**后端**：
- 新建 `apply_roll_location_to_photos` 函数 - 批量应用胶卷位置到照片
- 更新 `write_photo_exif_command` 获取胶卷信息并构建完整 UserComment
- 更新 `write_roll_exif_command` 包含位置信息
- 新增 `set_photo_location` 函数 - 设置单个照片位置
- 新增 `get_photos_by_roll_with_location` 函数 - 获取带位置的照片列表
- 增强 `get_library_root` 和 `set_library_root` 日志输出

**数据库变更**：
- 迁移 006 - 添加照片级地理位置字段（city, country, lat, lon）
- 迁移 007 - 添加胶卷级地理位置字段（city, country, lat, lon）
- 迁移 008 - 添加胶卷级地理位置字段（city, country, lat, lon）
- 迁移 005 - 添加 EXIF 和 UI 设置字段（部分功能未实现）
- 新增 `settings` 表字段：
  - `exif_auto_write` (INTEGER DEFAULT 1)
  - `exif_concurrent_writes` (INTEGER DEFAULT 4)

---

## [0.3.0] - 2026-02-15

### 新增

**EXIF 模块**：
- ExifInfoPanel 组件 - 显示照片 EXIF 信息（ISO、光圈、快门、焦距、GPS）
- PhotoMetadataForm 组件 - 编辑单张照片的拍摄参数
- 从文件读取 EXIF 数据功能
- 保存 EXIF 到文件功能
- 混合架构：胶卷元数据保留在数据库，照片 EXIF 从文件读取

**筛选与搜索功能**：
- RollFilters 组件 - 按胶卷型号、相机筛选
- 搜索框 - 按胶卷名称、备注搜索
- 日期范围筛选
- 收藏筛选（只看有收藏的胶卷）
- URL 参数同步 - 支持分享筛选链接

**设置页面增强**：
- EXIF 设置面板
- 位置信息应用到照片功能（只更新没有自己位置的照片）

### 改进

**EXIF 信息显示**：
- 照片详情页 UI 优化（EXIF 面板左上角浮动）
- 添加 EXIF 同步状态显示（已同步/未同步）

**用户体验优化**：
- 添加取消全选功能
- 设置页面分组显示（存储/EXIF）
- 状态管理优化（统一使用 React Query）

### 已修复问题

- 修复预览导航除零错误
- 修复选择所有胶卷时使用全部而非筛选后的列表
- 修复编辑胶卷时缺少位置字段
- 移除动态导入，改为文件顶部导入（性能优化）
- 添加用户友好的错误提示

### 技术实现

**架构变更 - 混合 EXIF 方案**：
- 胶卷层级元数据（相机、镜头、胶卷型号）保留在数据库
- 照片层级 EXIF（ISO、光圈、快门、焦距）直接从文件读取
- 优势：数据源单一，无需手动同步，不会出现不一致

**前端**：
- 新建 `ExifInfoPanel.tsx` 组件
- 新建 `PhotoMetadataForm.tsx` 组件
- 更新 `PhotoPreviewDialog.tsx` 集成 EXIF 功能
- 新建 `filter-utils.ts` 添加 URL 参数同步功能
- 更新 `SettingsDialog.tsx` 添加 EXIF 配置面板

**后端**：
- 更新 `Photo` 结构体移除照片级 EXIF 字段
- 更新 `write_photo_exif_command` 只写入文件，不同步到数据库
- 新增 `settings` 表字段（exif_auto_write, exif_concurrent_writes）
- 增强 `get_library_root` 和 `set_library_root` 日志输出
- 更新 `apply_roll_location_to_photos` 只更新没有自己位置的照片

**数据库变更**：
- 迁移 006 - 添加照片级地理位置字段
- 迁移 007 - 添加胶卷级地理位置字段
- 迁移 008 - 添加胶卷级地理位置字段
- 迁移 005 - 添加 EXIF 和 UI 设置字段

---

## [0.2.1] - 2026-02-07

### 新增

**自定义存储位置**：
- 设置对话框，可自定义图库存储路径
- 配置持久化（SQLite settings 表）
- 首次运行自动检测并提示设置存储位置

**胶卷详情页面**：
- 点击胶卷卡片进入详情页
- 响应式照片网格布局（2-6 列自适应）
- 照片全屏预览（支持键盘左右箭头切换）
- 批量选择照片（复选框）
- 设置封面照片功能
- 照片数量统计

**删除功能**：
- 批量删除胶卷（选择模式）
- 批量删除照片（详情页）
- 删除确认对话框
- 文件删除选项：删除缩略图和预览图、可选删除原始照片文件

**用户界面优化**：
- 完整中文化界面
- 选择模式按钮（首页头部工具栏）
- 批量操作栏（底部固定）
- 选中状态视觉反馈（蓝色高亮 + 勾选图标）

### 技术实现

**架构**：
- Next.js 15 + App Router
- Tauri v2 桌面应用框架
- React Query 数据缓存管理
- Rust + SQLx SQLite 数据库

**数据库设计**：
- `rolls` 表：胶卷元数据
- `photos` 表：照片信息
- 外键关联：photos.roll_id → rolls.id
- 级联删除：删除胶卷时自动删除关联照片

**前端**：
- 新建 `DeletePhotosDialog.tsx` 组件
- 更新 `BatchSelectionBar.tsx` 支持删除和中文化
- 更新 `RollCard.tsx` 支持选择模式
- 新建 `SettingsDialog.tsx` 组件

**后端**：
- 添加 `delete_photo()` 和 `delete_photos()` 数据库函数
- 实现 `delete_photo_command` 和 `delete_photos_command` 命令
- 支持物理文件删除（缩略图和预览图）
- 添加配置管理模块（`config.rs`）

**数据库变更**：
- 新增 `settings` 表（存储配置信息）
- 迁移文件：`src-tauri/migrations/002_settings.sql`

### 改进

**用户体验流程**：
- 优化用户体验流程（导入 → 浏览 → 删除）
- 统一删除对话框设计（支持单个/批量删除）

---

## [0.1.0] - 2026-02-06

### 新增

**核心功能**：
- 胶卷导入功能（支持 JPG、PNG、WebP 等格式）
- 自动缩略图生成（300px WebP 格式）
- 自动预览图生成（1920px WebP 格式）
- 胶卷列表展示（卡片式布局）
- 多胶卷管理（支持导入多个胶卷）
- 自动路径冲突检测和处理（添加序号后缀）

**元数据管理**：
- 胶卷元数据编辑（名称、胶卷型号、相机、镜头、日期、备注）
- 胶卷型号预设（Kodak Portra、Fujifilm 等）
- 相机型号预设（Canon、Nikon、Olympus 等）

**数据管理**：
- SQLite 数据库持久化
- 胶卷和照片关联存储
- 数据库自动初始化和迁移

**用户界面**：
- 暗色主题界面
- FilmStripBadge 胶卷型号颜色标识
- 响应式布局

### 技术实现

**架构**：
- Next.js 15 + App Router
- Tauri v2 桌面应用框架
- React Query 数据缓存管理
- Rust + SQLx SQLite 数据库

**数据库设计**：
- `rolls` 表：胶卷元数据
- `photos` 表：照片信息
- 外键关联：photos.roll_id → rolls.id
- 级联删除：删除胶卷时自动删除关联照片

---

## 版本说明

### 版本号规则

- **主版本号**：不兼容的 API 变更
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 变更类型

- **新增**：新功能
- **改进**：现有功能的改进
- **修复**：问题修复
- **删除**：功能移除
