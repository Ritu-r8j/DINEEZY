'use client';

import { useTheme } from '@/app/(contexts)/ThemeContext';

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
      className={`${baseClasses} ${themeClasses} ${sizeClasses[size]} ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg className={`${iconSizes[size]} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className={`${iconSizes[size]} text-amber-100`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      {showLabel && (
        <span className={isDark ? 'ml-2 text-sm font-medium text-amber-100' : 'ml-2 text-sm font-medium text-white'}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
