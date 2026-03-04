/**
 * FilmVault EmptyState Component
 *
 * Elegant empty state illustrations and messaging
 */

'use client';

import { Camera, FolderOpen, Search, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  type: 'no-rolls' | 'no-results' | 'loading' | 'import-ready';
  message?: string;
  submessage?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EMPTY_STATE_CONFIG = {
  'no-rolls': {
    icon: Camera,
    gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
    title: '开始您的胶片之旅',
    description: '导入第一个胶卷，记录每一次快门释放的瞬间',
    bgColor: 'bg-[hsl(var(--bg-deep))]',
  },
  'no-results': {
    icon: Search,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    title: '没有找到匹配的胶卷',
    description: '尝试调整搜索条件或清除筛选器',
    bgColor: 'bg-[hsl(var(--bg-deep))]',
  },
  'loading': {
    icon: Sparkles,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    title: '正在加载...',
    description: '请稍候',
    bgColor: 'bg-[hsl(var(--bg-deep))]',
  },
  'import-ready': {
    icon: FolderOpen,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    title: '准备好导入了',
    description: '选择包含照片的文件夹开始',
    bgColor: 'bg-[hsl(var(--bg-deep))]',
  },
} as const;

export function EmptyState({
  type,
  message,
  submessage,
  action,
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center"
      style={{
        animation: 'fadeInUp 0.5s ease-out-quin',
      }}
    >
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(ellipse at center, ${config.gradient} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Icon Container with Glow Effect */}
      <div
        className="relative mb-8"
        style={{ animation: 'scaleIn 0.4s ease-out-quin' }}
      >
        {/* Glow Ring */}
        <div
          className="absolute inset-0 rounded-full opacity-0 animate-pulse"
          style={{
            padding: '32px',
            background: 'radial-gradient(circle, hsl(var(--color-brand)) 0%, transparent 70%)',
            animationDelay: '2s',
          }}
        />
        {/* Icon */}
        <div
          className="relative w-24 h-24 flex items-center justify-center rounded-2xl border border-subtle"
          style={{
            background: 'hsl(var(--bg-card))',
            boxShadow: '0 0 0 1px hsl(var(--border-subtle))',
          }}
        >
          <Icon className="w-12 h-12 text-tertiary" />
        </div>
      </div>

      {/* Content */}
      <div
        className="relative max-w-md"
        style={{ animation: 'fadeInUp 0.5s ease-out-quin 0.1s' }}
      >
        <h2
          className="font-display text-2xl md:text-3xl font-medium text-primary mb-3"
          style={{ lineHeight: '1.2' }}
        >
          {message || config.title}
        </h2>
        <p className="text-body-lg text-secondary mb-8">
          {submessage || config.description}
        </p>

        {/* Action Button */}
        {action && (
          <Button
            onClick={action.onClick}
            className="btn-primary btn-lg w-full sm:w-auto animate-scale-in"
          >
            {action.label}
          </Button>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-20">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <div className="w-2 h-2 rounded-full bg-secondary" />
        <div className="w-1 h-1 rounded-full bg-tertiary" />
      </div>
    </div>
  );
}
