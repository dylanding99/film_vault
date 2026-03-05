# FilmVault 变更日志

本文档记录 FilmVault 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.6.1] - 2026-03-05

### 修复与优化
- **日期过滤**：将主页日期按钮改为下拉面板，支持选择开始/结束日期后点击"应用"过滤，支持独立清除
- **设计统一**：SettingsDialog 对齐 EditMetadataForm 风格（品牌色渐变线头部、bg-surface/border-white/5 配色）
- **ExifTool 状态**：设置弹窗新增 ExifTool 安装状态显示（检测中/已安装/未安装）
- **ImportDialog**：对话框头部统一品牌色渐变线风格；radio/checkbox 替换为 Radix UI 组件，适配深色主题
- **PhotoPreviewDialog**：按钮颜色从硬编码 zinc 改为设计系统变量（bg-white/10）
- **文案**：过滤栏"Clear Filters"改为"清除筛选"

## [0.6.0] - 2026-03-04

### 新增
- **设计系统（Design System）**：
  - 电影级编辑暗色风格设计语言
  - 完整的设计令牌系统（colors, spacing, typography, border, shadow, transition）
  - 品牌色系统：primary、accent 系列颜色
  - 背景层级：deep/surface/elevated/card 四级深度
  - 文本层级：primary/secondary/tertiary 三级对比
- **排版系统**：
  - Display 字体：Instrument Serif（标题、品牌标识）
  - Body 字体：Space Grotesk（正文、UI 文本）
  - Mono 字体：DM Mono（代码、元数据）
  - 统一的字体层级类（text-h1, text-h2, text-h3, text-body 等）
- **视觉特效**：
  - 胶片框效果（.film-frame）：模拟胶片边框和齿孔
  - 胶片颗粒效果（.film-grain）：可选的胶片颗粒叠加
  - 发光效果（.shadow-glow）：品牌色柔和发光
- **组件系统**：
  - Header 组件：统一的页面头部，支持滚动效果
  - EmptyState 组件：优雅的空状态展示（无胶卷、无结果、加载中）
  - Toast 通知系统：集成 Sonner，支持 success/error/warning/info
  - 改进的 Card 系统：基础卡片、elevated 卡片、胶卷卡片
- **按钮系统**：
  - btn-primary：主要操作按钮，带发光效果
  - btn-secondary：次要操作按钮
  - btn-ghost：透明按钮，用于导航和次要操作
  - 统一的 hover/active 状态和过渡效果
- **筛选器系统**：
  - Filter Pill 组件样式：统一的胶囊式筛选器
  - active 状态高亮品牌色
  - hover 状态微交互动效
- **搜索栏系统**：
  - 统一的搜索框样式和交互
  - 清除按钮支持
  - 聚焦状态高亮
- **动画系统**：
  - fadeInUp：淡入上移动画（用于内容展示）
  - slideIn：滑入动画（用于侧边栏等）
  - scaleIn：缩入动画（用于对话框）
  - float/drift：漂浮漂移动画（用于装饰元素）
  - card-reveal：卡片揭示动画（用于加载状态）
  - stagger 延迟类：支持交错动画
- **工具函数**：
  - 相机常量（`src/constants/cameras.ts`）：
    - CAMERAS：完整相机型号列表（130+ 型号）
    - CAMERAS_BY_BRAND：按品牌分组
    - CAMERAS_BY_SERIES：按系列分组
    - POPULAR_CAMERAS：热门相机列表
    - getCameraBrand()：获取相机品牌
    - searchCameras()：模糊搜索相机
  - 图片加载 Hook（`useImageAsset.ts`）：
    - 统一的图片文件到 base64 转换
    - 加载状态管理（isLoading, hasError）
    - 多图片批量加载支持（useMultipleImageAssets）
  - 错误处理 Hook（`useErrorHandler.ts`）：
    - 统一的错误处理和用户反馈
    - 错误类型分类（network/database/validation/import/export）
    - withErrorHandler 包装器

### 改进
- **UI 一致性提升**：
  - 所有组件使用设计令牌替代硬编码值
  - 统一的边框颜色、圆角、间距
  - 统一的阴影深度和发光效果
- **对话框优化**：
  - Dialog 组件支持尺寸变体（sm/md/lg/xl/2xl/full）
  - 统一的对话框样式和过渡动画
- **交互优化**：
  - 所有按钮添加 hover/active 状态反馈
  - 卡片悬停效果优化（渐变遮罩 + 缩放）
  - 表单输入框聚焦状态优化
- **滚动条样式**：自定义深色主题滚动条
- **Logo 标记**：品牌 Logo 的 CSS 实现

### 技术实现
- **前端**：
  - 新建 `styles/design-system.css` 完整设计系统
  - 新建 `styles/design-tokens.ts` TypeScript 类型定义
  - 新建 `constants/cameras.ts` 相机常量库
  - 新建 `components/Header.tsx` 页面头部组件
  - 新建 `components/EmptyState.tsx` 空状态组件
  - 新建 `components/ui/toast.tsx` Toast 通知组件
  - 新建 `hooks/useImageAsset.ts` 图片加载 Hook
  - 新建 `hooks/useErrorHandler.ts` 错误处理 Hook
  - 重构所有组件应用设计系统样式

---

## [0.5.0] - 2026-02-22

### 新增
- **设计系统基础**：设计令牌系统（colors, spacing, typography, border, shadow, transition）
- **相机常量**：创建相机型号常量文件
- **图片加载 Hook**：创建统一的图片加载 Hook
- **Toast 通知**：集成 Sonner Toast 通知系统
- **对话框样式统一**：Dialog 组件支持尺寸变体（sm/md/lg/xl/2xl/full）
- **图标尺寸统一**：使用 iconSizes 常量统一所有图标尺寸

---

## [0.4.0] - 2026-02-15

### 新增
- **位置功能增强**：LocationSearchInput 组件、地理编码集成、位置信息存储和显示
- **EXIF 模块优化**：ExifInfoPanel、PhotoMetadataForm、完整元数据架构
- **筛选与搜索功能**：RollFilters 组件、URL 参数同步、收藏筛选
- **设置页面增强**：EXIF 设置面板、EXIF 写入配置

---

## [0.3.0] - 2026-02-07

### 新增
- **筛选与搜索功能**：RollFilters 组件、URL 参数同步、日期范围筛选
- **设置页面增强**：自定义存储位置
- **胶卷详情页**：网格布局、全屏预览
- **批量删除**：支持胶卷和照片的批量删除操作
- **完整中文化**：全中文界面

### 改进
- 修复预览导航除零错误
- 修复选择所有胶卷时使用全部而非筛选后的列表
- 修复编辑胶卷时缺少位置字段
- 移除动态导入，改为文件顶部导入（性能优化）

### 技术实现
- **架构变更 - 混合 EXIF 方案：
  - 胶卷层级元数据（相机、镜头、胶卷型号）保留在数据库
  - 照片层级 EXIF（ISO、光圈、快门、焦距）直接从文件读取
- 优势：数据源单一，无需手动同步，不会出现不一致

**前端**：
- 新建 `LocationSearchInput.tsx` 组件
- 新建 `ExifInfoPanel.tsx` 组件
- 新建 `PhotoMetadataForm.tsx` 组件
- 新建 `filter-utils.ts` 添加 URL 参数同步功能
- 更新 `PhotoPreviewDialog.tsx` 集成 EXIF 功能
- 更新 `EditMetadataForm.tsx` 添加位置选择
- 更新 `BatchSelectionBar.tsx` 添加取消全选功能
- 新增 `settings` 表字段（exif_auto_write, exif_concurrent_writes）

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
- 迁移 008 - 添加 EXIF 和 UI 设置字段（部分功能未实现）

---

## [0.2.1] - 2026-02-06

### 新增
- **筛选与搜索功能**：RollFilters 组件、URL 参数同步
- **设置页面增强**：EXIF 设置面板、自动写入 EXIF 开关
- 并发写入数设置（1-8）

### 改进
- 添加取消全选功能 - BatchSelectionBar 支持"取消全选"操作
- 照片位置分层显示 - 优先显示照片位置，回退到胶卷位置
- 设置页面分组显示（存储/EXIF）
- 状态管理优化（统一使用 React Query）

**EXIF 信息显示**：
- 照片详情页 UI 优化（EXIF 面板左上角浮动）
- 添加 EXIF 同步状态显示（已同步/未同步）

**批量操作优化**：
- 改进"应用到所有照片"功能的用户体验
- 添加批量清除位置功能
- 优化位置应用的性能

**数据层优化**：
- 完善地理编码缓存机制
- 添加批量位置更新的事务处理
- 优化位置相关的数据库查询

**EXIF 模块完善**：
- UserComment 格式优化
- 优化 UserComment 构建函数的错误处理
- 添加 UserComment 格式验证
- 优化 EXIF 写入的配置
- 混合 EXIF 方案：
  - 胶卷层级元数据（相机、镜头、胶卷型号）保留在数据库
  - 照片层级 EXIF（ISO、光圈、快门、焦距）直接从文件读取
- 优势：数据源单一，无需手动同步，不会出现不一致

**前端**：
- 新建 `ExifInfoPanel.tsx` 组件
- 新建 `PhotoMetadataForm.tsx` 组件
- 新建 `filter-utils.ts` 添加 URL 参数同步功能
- 更新 `PhotoPreviewDialog.tsx` 集成 EXIF 功能
- 更新 `EditMetadataForm.tsx` 添加位置选择
- 更新 `BatchSelectionBar.tsx` 添加取消全选功能
- 新增 `settings` 表字段（exif_auto_write, exif_concurrent_writes）

**后端**：
- 更新 `Photo` 结构体移除照片级 EXIF 字段
- 更新 `write_photo_exif_command` 只写入文件，不同步到数据库
- 新增 `settings` 表字段（exif_auto_write, exif_concurrent_writes）
- 增强 `get_library_root` 和 `set_library_root` 日志输出
- 更新 `apply_roll_location_to_photos` 只更新没有自己位置的照片

**数据库变更**：
- 迁移 006 - 添加照片级地理位置字段（city, country, lat, lon）
- 迁移 007 - 添加胶卷级地理位置字段（city, country, lat, lon）
- 迁移 008 - 添加 EXIF 和 UI 设置字段（部分功能未实现）

---

## [0.1.0] - 2026-02-15

### 新增
- **核心功能**：胶卷导入功能（支持 JPG、PNG、WebP 等格式）
- **自动文件组织**：`[年份]/[日期]_[胶卷型号]_[相机]/`
- **图片处理**：生成缩略图（300px）和预览图（1920px）
- **胶卷卡片展示**：元数据编辑和管理

### 改进
- 添加取消全选功能 - BatchSelectionBar 支持"取消全选"操作
- 照片位置分层显示 - 优先显示照片位置，回退到胶卷位置

**数据持久化**：
- SQLite 数据库持久化
- 胶卷和照片关联存储

---

## [0.2.0] - 2026-02-16

### 新增
- **筛选与搜索功能**：按胶卷型号、相机、日期范围筛选
- **收藏筛选**：只看有收藏的胶卷
- **URL 参数同步**：支持分享筛选链接

---

## [0.3.0] - 2026-02-20

### 新增
- **筛选与搜索功能**：日期范围筛选
- **收藏筛选**：只看有收藏的胶卷
- **URL 参数同步**：支持分享筛选链接
- **筛选条件持久化**：刷新页面后保持
- **位置信息应用到照片**：只更新没有自己位置的照片

### 改进
- 添加取消全选功能 - BatchSelectionBar 支持"取消全选"操作
- 设置页面简化 - 移除未实现的 EXIF 设置

---

## [0.4.0] - 2026-02-23

### 新增
- **位置功能增强**：
  - LocationSearchInput 组件 - 柎市搜索和位置选择功能
  - 地理编码集成 - 使用 OpenStreetMap Nominatim API
  - 位置信息存储 - Roll 表和 Photo 表添加地理位置字段
  - 位置信息显示 - ExifInfoPanel 显示 GPS 坐标
  - 位置编辑 - EditMetadataForm 和 PhotoMetadataForm 支持位置选择

**数据库变更**：
- 迁移 006 - 添加照片级地理位置字段（city, country, lat, lon）
- 迁移 007 - 添加胶卷级地理位置字段（city, country, lat, lon）
- 迁移 008 - 添加胶卷级地理位置字段（city, country, lat, lon）

**前端**：
- 新建 `LocationSearchInput.tsx` 组件
- 新建 `ExifInfoPanel.tsx` 组件
- 新建 `PhotoMetadataForm.tsx` 组件
- 新建 `filter-utils.ts` 添加 URL 参数同步功能
- 更新 `PhotoPreviewDialog.tsx` 集成 EXIF 功能
- 更新 `EditMetadataForm.tsx` 添加位置选择
- 更新 `BatchSelectionBar.tsx` 添加取消全选功能
- 新增 `settings` 表字段（exif_auto_write, exif_concurrent_writes）

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
- 迁移 005 - 添加胶卷级地理位置字段（city, country, lat, lon）

---

## [0.5.0] - 2026-02-22

### 新增
- **设计系统**：创建设计令牌系统（colors, spacing, typography, border, shadow, transition）
- **相机常量**：创建相机型号常量文件
- **图片加载 Hook**：创建统一的图片加载 Hook
- **Toast 通知**：集成 Sonner Toast 通知系统
- **对话框样式统一**：Dialog 组件支持尺寸变体（sm/md/lg/xl/2xl/full）
- **图标尺寸统一**：使用 iconSizes 常量统一所有图标尺寸

---

**版本**: v0.5.0