'use client';

import { toast } from '@/components/ui/toast';

/**
 * 错误类型
 */
export type ErrorType = 'network' | 'database' | 'validation' | 'import' | 'export' | 'unknown';

/**
 * 错误上下文
 */
interface ErrorContext {
  type?: ErrorType;
  operation?: string;
  details?: Record<string, unknown>;
}

/**
 * 统一的错误处理 Hook
 *
 * 提供一致的错误处理和用户反馈机制
 */
export function useErrorHandler() {
  /**
   * 处理错误并显示 toast 通知
   */
  const handleError = (
    error: unknown,
    context: ErrorContext = {},
    showToast: boolean = true
  ): void => {
    // 解析错误
    const errorMessage = parseError(error);

    // 记录到控制台（保留上下文）
    console.error(`[${context.operation || '操作'} 错误]:`, {
      error: errorMessage,
      type: context.type || 'unknown',
      context,
    });

    // 显示 toast 通知
    if (showToast) {
      switch (context.type) {
        case 'network':
          toast.error(errorMessage);
          break;
        case 'database':
          toast.error(`数据库错误: ${errorMessage}`);
          break;
        case 'validation':
          toast.warning(errorMessage);
          break;
        case 'import':
          toast.error(`导入失败: ${errorMessage}`);
          break;
        case 'export':
          toast.error(`导出失败: ${errorMessage}`);
          break;
        default:
          toast.error(errorMessage);
      }
    }
  };

  /**
   * 处理成功操作
   */
  const handleSuccess = (
    message: string,
    showToast: boolean = true
  ): void => {
    if (showToast) {
      toast.success(message);
    }
  };

  /**
   * 处理警告
   */
  const handleWarning = (
    message: string,
    showToast: boolean = true
  ): void => {
    if (showToast) {
      toast.warning(message);
    }
  };

  /**
   * 包装异步操作，自动处理错误
   */
  const withErrorHandler = <T>(
    operation: () => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      context?: ErrorContext;
      showSuccessToast?: boolean;
      showErrorToast?: boolean;
    } = {}
  ): (() => Promise<T>) => {
    return async () => {
      try {
        const result = await operation();

        if (options.showSuccessToast !== false && options.successMessage) {
          handleSuccess(options.successMessage);
        }

        return result;
      } catch (error) {
        handleError(error, {
          ...options.context,
          operation: options.context?.operation,
        }, options.showErrorToast !== false);
        throw error;
      }
    };
  };

  return {
    handleError,
    handleSuccess,
    handleWarning,
    withErrorHandler,
  };
}

/**
 * 解析错误消息
 */
function parseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }

  return '未知错误';
}
