'use client';

import { Toaster as SonnerToaster } from 'sonner';
import type { ToasterProps } from 'sonner';

/**
 * FilmVault Toast 通知组件
 *
 * 基于 sonner 库封装，提供统一的 Toast 通知体验
 * 支持：success, error, warning, info 类型
 */

export function Toaster({
  position = 'bottom-right',
  expand = false,
  richColors = false,
  ...props
}: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      expand={expand}
      richColors={richColors}
      theme="dark"
      toastOptions={{
        className: 'bg-zinc-900 border border-zinc-800 text-white',
        descriptionClassName: 'text-zinc-400',
        actionButtonStyle: {
          backgroundColor: 'hsl(var(--primary) / 0.9)',
        },
      }}
      closeButton
      {...props}
    />
  );
}

// ==================== 辅助函数 ====================

import { toast as sonnerToast } from 'sonner';

/**
 * 显示成功通知
 */
export const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    return sonnerToast.success(message, {
      duration: 3000,
      ...options,
    });
  },
  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  },
  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      ...options,
    });
  },
  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
    return sonnerToast.info(message, {
      duration: 3000,
      ...options,
    });
  },
  /**
   * 显示加载中的操作
   */
  loading: (message: string, options?: Parameters<typeof sonnerToast.loading>[1]) => {
    return sonnerToast.loading(message, {
      ...options,
    });
  },
  /**
   * 包装异步操作，自动显示加载状态
   */
  promise: function<T>(promise: Promise<T>, options: {
    loading?: string;
    success?: string;
    error?: string;
  } = {}) {
    return sonnerToast.promise(promise, {
      loading: options.loading || '处理中...',
      success: options.success || '操作成功',
      error: options.error || '操作失败',
    });
  },
};

export default Toaster;
