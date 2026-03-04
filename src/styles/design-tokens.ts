/**
 * FilmVault 设计令牌
 *
 * 定义全局设计系统，包括颜色、间距、字体、图标尺寸等
 * 确保整个应用 UI 保持一致
 */

// ==================== 颜色系统 ====================

export const colors = {
  // 主色调
  primary: {
    DEFAULT: 'bg-red-600',      // FilmVault 品牌色（红色胶片感）
    hover: 'bg-red-700',
    active: 'bg-red-800',
    text: 'text-red-600',
  },
  // 破坏性操作（删除等）
  destructive: {
    DEFAULT: 'bg-red-600',
    hover: 'bg-red-700',
    text: 'text-red-600',
  },
  // 成功状态
  success: {
    DEFAULT: 'bg-green-600',
    hover: 'bg-green-700',
    text: 'text-green-600',
  },
  // 警告状态
  warning: {
    DEFAULT: 'bg-amber-500',
    hover: 'bg-amber-600',
    text: 'text-amber-500',
  },
  // 中性色（背景）
  background: {
    DEFAULT: 'bg-zinc-950',
    secondary: 'bg-zinc-900',
    tertiary: 'bg-zinc-800',
    hover: 'bg-zinc-800/50',
  },
  // 中性色（边框）
  border: {
    DEFAULT: 'border-zinc-800',
    secondary: 'border-zinc-700',
    input: 'border-zinc-600',
  },
  // 文本色
  text: {
    PRIMARY: 'text-white',
    SECONDARY: 'text-zinc-300',
    TERTIARY: 'text-zinc-400',
    DISABLED: 'text-zinc-500',
    ERROR: 'text-red-400',
  },
  // 胶片品牌色
  filmStock: {
    KODAK: 'bg-yellow-500',
    FUJIFILM: 'bg-green-500',
    ILFORD: 'bg-neutral-500',
    CINESTILL: 'bg-red-500',
    FOMA: 'bg-blue-500',
    HARMAN: 'bg-gray-500',
    AGFA: 'bg-orange-500',
    LOMOGRAPHY: 'bg-purple-500',
    ROLLEI: 'bg-slate-500',
    KENTMERE: 'bg-zinc-500',
  },
} as const;

// ==================== 间距系统 ====================

export const spacing = {
  // 内边距
  padding: {
    XS: 'px-2',
    SM: 'px-3',
    MD: 'px-4',
    LG: 'px-6',
    XL: 'px-8',
  },
  // 外边距
  margin: {
    XS: 'mx-1',
    SM: 'mx-2',
    MD: 'mx-4',
    LG: 'mx-6',
  },
  // 间隙
  gap: {
    XS: 'gap-1',
    SM: 'gap-2',
    MD: 'gap-3',
    LG: 'gap-4',
  },
} as const;

// ==================== 字体系统 ====================

export const typography = {
  // 字号
  fontSize: {
    XS: 'text-xs',   // 0.75rem
    SM: 'text-sm',   // 0.875rem
    BASE: 'text-base', // 1rem
    LG: 'text-lg',   // 1.125rem
    XL: 'text-xl',   // 1.25rem
    '2XL': 'text-2xl', // 1.5rem
    '3XL': 'text-3xl', // 1.875rem
  },
  // 字重
  fontWeight: {
    NORMAL: 'font-normal',
    MEDIUM: 'font-medium',
    SEMIBOLD: 'font-semibold',
    BOLD: 'font-bold',
  },
} as const;

// ==================== 图标尺寸 ====================

export const iconSizes = {
  XS: 'h-3 w-3',    // 12px
  SM: 'h-3.5 w-3.5',  // 14px
  MD: 'h-4 w-4',    // 16px - 默认
  LG: 'h-5 w-5',    // 20px
  XL: 'h-6 w-6',    // 24px
} as const;

// ==================== 圆角 ====================

export const borderRadius = {
  NONE: 'rounded-none',
  SM: 'rounded-sm',   // 0.125rem
  MD: 'rounded-md',   // 0.375rem
  LG: 'rounded-lg',   // 0.5rem
  XL: 'rounded-xl',   // 0.75rem
  FULL: 'rounded-full',
} as const;

// ==================== 阴影 ====================

export const shadows = {
  NONE: 'shadow-none',
  SM: 'shadow-sm',
  MD: 'shadow-md',
  LG: 'shadow-lg',
  XL: 'shadow-xl',
} as const;

// ==================== 对话框尺寸 ====================

export const dialogSizes = {
  SM: 'max-w-sm',
  MD: 'max-w-md',
  LG: 'max-w-lg',
  XL: 'max-w-xl',
} as const;

// 对话框内容间距
export const dialogContentPadding = {
  SM: 'py-3',
  MD: 'py-4',
  LG: 'py-4',
} as const;

// ==================== 过渡动画 ====================

export const transitions = {
  FAST: 'duration-150',
  NORMAL: 'duration-200',
  SLOW: 'duration-300',
} as const;

// ==================== 断点 ====================

export const breakpoints = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
} as const;

// ==================== 辅助函数 ====================

/**
 * 根据胶片型号获取品牌颜色
 */
export function getFilmStockBrandColor(filmStock: string): string {
  const lowerName = filmStock.toLowerCase();

  for (const [brand, color] of Object.entries(colors.filmStock)) {
    if (lowerName.startsWith(brand.toLowerCase())) {
      return color;
    }
  }

  return colors.filmStock.KODAK; // 默认
}

/**
 * 获取主要操作按钮颜色类
 */
export function getPrimaryButtonClass(): string {
  return colors.primary.DEFAULT;
}

/**
 * 获取破坏性操作按钮颜色类
 */
export function getDestructiveButtonClass(): string {
  return colors.destructive.DEFAULT;
}

/**
 * 获取中性文本颜色
 */
export function getNeutralTextColor(level: 'primary' | 'secondary' | 'tertiary' = 'primary'): string {
  return colors.text[level.toUpperCase() as keyof typeof colors.text];
}

/**
 * 获取中性边框颜色
 */
export function getNeutralBorderColor(level: 'primary' | 'secondary' = 'primary'): string {
  return colors.border[level.toUpperCase() as keyof typeof colors.border];
}
