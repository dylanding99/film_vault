'use client';

import Link from 'next/link';
import { Film, Settings, CheckSquare, Upload, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface HeaderProps {
  rollsCount?: number;
  selectionMode?: boolean;
  selectedCount?: number;
  onToggleSelectionMode?: () => void;
  onOpenSettings?: () => void;
  onOpenImport?: () => void;
  showSearch?: boolean;
}

export function Header({
  rollsCount,
  selectionMode = false,
  selectedCount = 0,
  onToggleSelectionMode,
  onOpenSettings,
  onOpenImport,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'py-3 bg-surface/80 backdrop-blur-xl border-b border-subtle shadow-lg' 
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3 transition-transform active:scale-95">
            <div className="logo-mark shadow-glow" />
            <div className="hidden sm:block">
              <h1 className="font-display text-xl font-semibold leading-none tracking-tight text-primary">
                FilmVault
              </h1>
              <p className="text-[10px] mt-1 tracking-[0.2em] uppercase font-mono text-tertiary">
                Visual Archive
              </p>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/presets">
              <Button variant="ghost" size="sm" className="btn-ghost gap-2 group">
                <Film className="w-4 h-4 transition-transform group-hover:rotate-12" />
                <span>胶片预设</span>
              </Button>
            </Link>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            {rollsCount !== undefined && rollsCount > 0 && onToggleSelectionMode && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleSelectionMode} 
                className={`btn-ghost gap-2 ${selectionMode ? 'bg-elevated text-primary' : ''}`}
              >
                <CheckSquare className={`w-4 h-4 ${selectionMode ? 'fill-color-brand/20' : ''}`} />
                <span className="hidden lg:inline">{selectionMode ? `已选 ${selectedCount}` : '选择'}</span>
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onOpenSettings} 
              className="btn-ghost gap-2"
              title="设置"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">设置</span>
            </Button>
          </div>

          <Button 
            onClick={onOpenImport} 
            size="lg" 
            className="btn-primary btn-lg shadow-glow group"
          >
            <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="hidden sm:inline">导入胶卷</span>
            <span className="sm:hidden">导入</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
