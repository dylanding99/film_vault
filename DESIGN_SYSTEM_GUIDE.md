# FilmVault 设计系统应用指南

## 概述

本指南说明如何将新的设计系统应用到 FilmVault 应用中。新的设计系统采用 **Editorial Cinematic Dark** 风格，强调优雅的排版、电影感的光影效果和流畅的微交互动画。

## 文件结构

```
src/styles/
├── design-system.css      # 全局设计令牌和工具类
├── design-tokens.ts      # TypeScript 设计令牌（已存在，需更新）

src/components/
├── RollCard.elegant.tsx      # 优雅的胶卷卡片组件
├── RollFilters.elegant.tsx    # 优雅的筛选器组件
├── EmptyState.tsx            # 优雅的空状态组件
├── Header.elegant.tsx         # 优雅的头部组件
```

## 快速开始

### 1. 导入设计系统 CSS

在 `src/app/globals.css` 中添加：

```css
@import './styles/design-system.css';
```

### 2. 安装 Google Fonts

将以下 Google Fonts 链接添加到 `src/app/layout.tsx` 的 `<head>` 中：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## 设计令牌使用指南

### 颜色系统

```tsx
// 使用 CSS 变量
<div style={{ background: 'hsl(var(--bg-deep))' }} />
<div style={{ color: 'hsl(var(--text-primary))' }} />
<div style={{ borderColor: 'hsl(var(--border-subtle))' }} />

// 品牌色
<div style={{ background: 'hsl(var(--color-brand))' }} />
<div style={{ color: 'hsl(var(--color-brand-dim))' }} />

// 强调色
<div style={{ color: 'hsl(var(--accent-amber))' }} />
<div style={{ color: 'hsl(var(--accent-emerald))' }} />
<div style={{ color: 'hsl(var(--accent-rose))' }} />
```

### 字体系统

```tsx
// Display 字体（标题）
<h1 className="font-display">标题文本</h1>
<h2 className="text-h1">一级标题</h2>
<h3 className="text-h2">二级标题</h3>

// Body 字体（正文）
<p className="font-body">正文内容</p>
<p className="text-body-lg">大号正文</p>
<p className="text-body-sm">小号正文</p>

// Mono 字体（代码、标签）
<span className="font-mono">等宽文本</span>
<span className="text-caption">标注文本</span>
<span className="text-eyebrow">大写标签</span>
```

### 间距系统

```tsx
// 使用 CSS 变量
<div style={{ padding: 'var(--space-md)' }} />
<div style={{ margin: 'var(--space-lg)' }} />
<div style={{ gap: 'var(--space-sm)' }} />
```

### 边框半径

```tsx
<div style={{ borderRadius: 'var(--radius-sm)' }} />
<div style={{ borderRadius: 'var(--radius-lg)' }} />
<div style={{ borderRadius: 'var(--radius-xl)' }} />
```

### 阴影系统

```tsx
<div style={{ boxShadow: 'var(--shadow-sm)' }} />
<div style={{ boxShadow: 'var(--shadow-md)' }} />
<div style={{ boxShadow: 'var(--shadow-lg)' }} />
<div style={{ boxShadow: 'var(--shadow-xl)' }} />
```

### 动画系统

```tsx
// 持续时间
transition: all var(--duration-normal) var(--ease-out-quin);

// 预定义动画
<div className="animate-fade-in" />
<div className="animate-fade-in-up" />
<div className="animate-slide-in" />
<div className="animate-scale-in" />

// 错开动画
<div className="stagger-1 animate-fade-in" />
<div className="stagger-2 animate-fade-in" />
<div className="stagger-3 animate-fade-in" />
```

## 组件样式类

### 筛选药丸系统 (Filter Pills)

```tsx
// 基础筛选药丸
<button className="filter-pill">
  <span className="icon"><Filter className="h-4 w-4" /></span>
  <span>胶片类型</span>
</button>

// 激活状态
<button className="filter-pill active">
  <span className="icon"><Filter className="h-4 w-4" /></span>
  <span>Kodak Portra 400</span>
</button>
```

### 搜索栏

```tsx
<div className="search-bar">
  <input
    className="input"
    placeholder="搜索..."
  />
  <Search className="icon" />
  {/* 清除按钮 - 有内容时显示 */}
  <button className="clear-btn">
    <X className="h-4 w-4" />
  </button>
</div>
```

### 下拉菜单

```tsx
<div className="relative">
  {/* 触发按钮 */}
  <button>点击打开</button>

  {/* 下拉菜单 */}
  <div className="dropdown-menu open">
    <div className="item">选项 1</div>
    <div className="item active">选项 2</div>
    <div className="item">选项 3</div>
  </div>
</div>
```

### 页面布局

```tsx
// 页面容器
<main className="page-container">
  {/* 内容 */}
</main>

// 筛选栏
<div className="filter-bar">
  <div className="search-wrapper">
    {/* 搜索框 */}
  </div>
  <div className="filters-wrapper">
    {/* 筛选药丸 */}
  </div>
  <div className="results-count">
    {/* 结果计数 */}
  </div>
</div>

// 网格画廊
<div className="grid-gallery">
  <div className="item">卡片 1</div>
  <div className="item">卡片 2</div>
</div>
```

### 胶卷卡片 (Roll Card)

```tsx
<div className="roll-card">
  <div className="roll-card-image">
    {/* 图片 */}
    <img src="..." alt="..." />
  </div>
  <div className="roll-card-badge">
    {/* 徽章 */}
  </div>
  <div className="roll-card-actions">
    {/* 操作按钮 */}
  </div>
  <div className="roll-card-content">
    <h3 className="roll-card-title">标题</h3>
    <div className="roll-card-meta">
      <div className="meta-item">
        <Calendar className="h-3.5 w-3.5" />
        <span>日期</span>
      </div>
    </div>
  </div>
</div>
```

### 卡片

```tsx
// 基础卡片
<div className="card" />

// 提升卡片
<div className="card card-elevated" />

// 胶片边框效果
<div className="film-frame" />
```

### 按钮

```tsx
// 主要按钮
<button className="btn btn-primary" />
<button className="btn btn-primary btn-lg" />

// 次要按钮
<button className="btn btn-secondary" />

// 幽灵按钮
<button className="btn btn-ghost" />

// 图标按钮
<button className="btn btn-icon" />
```

### 输入框

```tsx
<input className="input" />
```

### 加载骨架

```tsx
<div className="loading-skeleton" />
```

## 胶片边框效果

胶片边框是 FilmVault 的标志性视觉元素，应用于照片和重要卡片：

```tsx
<div className="film-frame">
  <img src="..." alt="..." />
</div>
```

效果：
- 外框：深色边框
- 内框：略浅的边框
- 四角：圆形标记，带阴影效果
- 适合：胶卷封面照片、重要预览图

## 设计原则

### 1. 层次清晰

- 使用不同深度的背景色区分层级
- 文本使用 primary/secondary/tertiary 三级层次
- 重要操作使用品牌色，次要操作使用边框样式

### 2. 间距规律

- 小间距：4px (var(--space-xs))
- 标准间距：8px (var(--space-sm))
- 中等间距：16px (var(--space-md))
- 大间距：24px (var(--space-lg))
- 超大间距：32px (var(--space-xl))

### 3. 过渡时长

- 快速：150ms (var(--duration-fast)) - 悬停效果
- 标准：250ms (var(--duration-normal)) - 通用过渡
- 慢速：400ms (var(--duration-slow)) - 入场动画

### 4. 字体配对

- Display: Instrument Serif - 标题、品牌标识
- Body: Space Grotesk - 正文、界面文本
- Mono: DM Mono - 代码、标签、数据

### 5. 微交互

- 悬停：轻微位移 (1-2px) + 亮度提升
- 点击：按下效果 (scale 0.98)
- 焦点：品牌色光晕效果
- 加载：骨架屏动画

## 迁移步骤

### 第一阶段：全局样式

1. ✅ 创建 `design-system.css`
2. ⏳ 在 `globals.css` 中导入
3. ⏳ 添加 Google Fonts 链接

### 第二阶段：核心组件替换

1. ⏳ 替换 `page.tsx` 中的 Header
2. ⏳ 替换 RollCard 为优雅版本
3. ⏳ 替换 RollFilters 为优雅版本
4. ⏳ 替换空状态为 EmptyState 组件

### 第三阶段：次要组件

1. ⏳ 更新 Button 组件使用新样式
2. ⏳ 更新 Input 组件使用新样式
3. ⏳ 更新 Dialog 组件使用新设计令牌
4. ⏳ 更新 PhotoGridItem 使用新样式

### 第四阶段：完善细节

1. ⏳ 添加页面加载动画
2. ⏳ 优化滚动条样式
3. ⏳ 添加选中/悬停状态反馈
4. ⏳ 优化移动端响应式

## 设计检查清单

- [ ] 字体加载完成
- [ ] 全局样式导入完成
- [ ] 颜色对比度符合 WCAG AA 标准
- [ ] 所有交互元素有悬停/焦点状态
- [ ] 加载状态有骨架屏
- [ ] 空状态有优雅的提示
- [ ] 动画流畅且不干扰使用
- [ ] 响应式布局在移动端正常
- [ ] 深色主题一致性

## 品牌标识

### Logo 使用

```tsx
import { Logo } from '@/components/Logo';

<Logo size="md" />  // 32x32
<Logo size="lg" />  // 48x48
<Logo size="xl" />  // 64x64
```

### 品牌 SVG 标记

核心 Logo 标记是一个电影胶片边框的抽象：

```svg
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="28" height="28" rx="2" fill="currentColor"/>
  <rect x="5" y="5" width="22" height="22" rx="1" fill="hsl(var(--bg-deep))"/>
</svg>
```

## 颜色使用场景

| 场景 | 颜色 | 用途 |
|------|------|------|
| 主背景 | `hsl(var(--bg-deep))` | 应用背景、遮罩层 |
| 次背景 | `hsl(var(--bg-surface))` | 卡片、输入框 |
| 三级背景 | `hsl(var(--bg-elevated))` | 悬停、选中状态 |
| 卡片背景 | `hsl(var(--bg-card))` | 内容区域 |
| 主文本 | `hsl(var(--text-primary))` | 标题、重要内容 |
| 次文本 | `hsl(var(--text-secondary))` | 正文、描述 |
| 三级文本 | `hsl(var(--text-tertiary))` | 辅助信息 |
| 品牌色 | `hsl(var(--color-brand))` | 主按钮、链接、选中状态 |
| 强调琥珀 | `hsl(var(--accent-amber))` | 警告、提示 |
| 强调翡翠 | `hsl(var(--accent-emerald))` | 成功状态 |
| 强调玫瑰 | `hsl(var(--accent-rose))` | 错误、删除、收藏 |

## 动画性能优化

使用 CSS 动画优于 JavaScript 动画：

```tsx
// ❌ 避免
<div style={{ transform: `translateX(${x}px)` }} />

// ✅ 优先
<div className="animate-slide-in" />
```

使用 `will-change` 提示浏览器优化：

```css
.element {
  will-change: transform, opacity;
}
```

## 可访问性

### 焦点状态

所有可交互元素必须有清晰的焦点指示：

```tsx
<button className="btn btn-primary focus-visible" />
```

### 对比度

确保文本与背景的对比度至少为 4.5:1（AA 级别）。

### 键盘导航

所有功能都应可以通过键盘访问。

## 下一步

1. 审查并合并新的组件到主代码库
2. 逐步替换现有组件为优雅版本
3. 测试所有交互状态和动画
4. 在不同设备上测试响应式布局
5. 收集用户反馈并迭代改进
