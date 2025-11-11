'use client';

import { useTheme } from '@/app/(contexts)/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

export default function ThemeToggle({
  className = '',
  size = 'md',
  showLabel = false,
  onClick
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

  const handleToggle = () => {
    toggleTheme();
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`${sizeClasses[size]} ${className} group relative rounded-xl border border-foreground/10 bg-gradient-to-br from-white/10 to-transparent text-foreground shadow-sm backdrop-blur transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60`}
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      <div className="relative flex items-center justify-center">
        {theme === "light" ? (
          <Moon className={`${iconSizes[size]} transition-transform duration-300 group-hover:rotate-12`} />
        ) : (
          <Sun className={`${iconSizes[size]} transition-transform duration-300 group-hover:rotate-90`} />
        )}
      </div>
    </button>
  );
}
