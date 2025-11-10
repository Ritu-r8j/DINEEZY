'use client';

import { useTheme } from '@/app/(contexts)/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ThemeToggle({
  className = '',
  size = 'md',
  showLabel = false
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const isDark = theme === 'dark';
  const baseClasses = 'relative inline-flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:-translate-y-0.5';
  const themeClasses = isDark
    ? 'border border-amber-200/50 bg-amber-400/20 text-amber-100 shadow-[0_4px_20px_rgba(251,191,36,0.15)] hover:bg-amber-400/30 focus-visible:outline-amber-200/60'
    : 'border border-gray-900/20 bg-gray-900 text-white shadow-[0_4px_18px_rgba(17,24,39,0.18)] hover:bg-gray-800 focus-visible:outline-gray-500/60';

  return (
    <button
      onClick={toggleTheme}
      className="hidden md:flex group relative h-9 w-9 rounded-xl border border-foreground/10 bg-gradient-to-br from-white/10 to-transparent text-foreground shadow-sm backdrop-blur transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 lg:items-center lg:justify-center cursor-pointer"
      aria-label="Toggle theme"
    >
      <div className="hidden md:block absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      <div className="relative flex  items-center justify-center">
        {theme === "light" ? (
          <Moon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-12" />
        ) : (
          <Sun className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-90" />
        )}
      </div>
    </button>
  );
}
