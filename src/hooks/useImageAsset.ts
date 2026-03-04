'use client';

import { useState, useEffect, useCallback } from 'react';
import { readImageAsBase64 } from '@/lib/db';

/**
 * 图片加载状态
 */
interface ImageAssetState {
  url: string | null;
  isLoading: boolean;
  hasError: boolean;
  error?: Error;
}

/**
 * 图片加载 Hook
 *
 * 统一处理图片文件到 base64 的转换
 * 包含缓存、加载状态和错误处理
 */
export function useImageAsset(imagePath: string | null | undefined) {
  const [state, setState] = useState<ImageAssetState>({
    url: null,
    isLoading: false,
    hasError: false,
  });

  // 加载图片
  const loadImage = useCallback(async () => {
    if (!imagePath) {
      setState({ url: null, isLoading: false, hasError: false });
      return;
    }

    // 如果已经有 URL 且没有错误，跳过加载
    if (state.url && !state.hasError && !state.isLoading) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, hasError: false }));

    try {
      const url = await readImageAsBase64(imagePath);
      setState({ url, isLoading: false, hasError: false });
    } catch (error) {
      console.error('图片加载失败:', error);
      setState({
        url: null,
        isLoading: false,
        hasError: true,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [imagePath]);

  // 组件挂载或路径变化时加载图片
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // 重试加载
  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, hasError: false }));
  }, []);

  return {
    ...state,
    retry,
  };
}

/**
 * 多个图片加载 Hook
 *
 * 批量加载多个图片，返回加载进度
 */
export function useMultipleImageAssets(paths: Array<string | null | undefined>) {
  const [states, setStates] = useState<Record<string, ImageAssetState>>({});
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const validPaths = paths.filter(Boolean);
    setTotalCount(validPaths.length);
    setLoadedCount(0);

    validPaths.forEach(async (path) => {
      if (path && !states[path]?.url) {
        try {
          const url = await readImageAsBase64(path);
          setStates((prev) => ({
            ...prev,
            [path]: { url, isLoading: false, hasError: false },
          }));
          setLoadedCount((prev) => prev + 1);
        } catch (error) {
          console.error(`图片加载失败 [${path}]:`, error);
          setStates((prev) => ({
            ...prev,
            [path]: {
              url: null,
              isLoading: false,
              hasError: true,
              error: error instanceof Error ? error : new Error(String(error)),
            },
          }));
          setLoadedCount((prev) => prev + 1);
        }
      }
    });
  }, [paths]);

  return {
    states,
    loadedCount,
    totalCount,
    isComplete: loadedCount === totalCount,
    progress: totalCount > 0 ? (loadedCount / totalCount) * 100 : 0,
  };
}
