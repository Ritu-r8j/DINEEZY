'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import ThemeToggle from './ThemeToggle';
import AdminNotifications from './AdminNotifications';
import { useBusinessType } from '@/app/(utils)/useFeatures';

interface AdminHeaderProps {
  currentPage?: 'dashboard' | 'menu' | 'orders' | 'customers' | 'payments' | 'reservations' | 'reviews' | 'settings';
}

export default function AdminHeader({ currentPage = 'dashboard' }: AdminHeaderProps) {
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();
  const { isRESTO } = useBusinessType();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', key: 'dashboard' },
    { name: 'Menu', href: '/admin/menu', key: 'menu' },
    { name: 'Orders', href: '/admin/orders', key: 'orders' },
    { name: 'Customers', href: '/admin/customers', key: 'customers' },
    { name: 'Payments', href: '/admin/payments', key: 'payments' },
    { name: 'Reservations', href: '/admin/reservations', key: 'reservations', requiresRESTO: true },
    // { name: 'Reviews', href: '/admin/reviews', key: 'reviews' },
    { name: 'Settings', href: '/admin/settings', key: 'settings' },
  ];

  // Filter navigation items based on business type
  const visibleNavItems = navItems.filter(item => {
    if (item.requiresRESTO) {
      return isRESTO();
    }
    return true;
  });

  return (
    <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin" className="flex items-center hover:opacity-80 transition-all duration-200 ease-in-out hover:scale-105">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 ease-in-out p-1">
              <img
                src="/logo.png"
                alt="Dineezy Logo"
                className="w-28 h-28 md:w-32 md:h-32 object-cover object-center dark:invert"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Dineezy</h1>
          </Link>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-6">
            {visibleNavItems.map((item, index) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-sm font-medium transition-all duration-200 ease-in-out hover:scale-105 relative ${currentPage === item.key
                  ? 'text-gray-900 dark:text-white font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.name}
                {currentPage === item.key && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white rounded-full animate-in slide-in-from-left duration-300"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''
                  }`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-slide-in-from-top">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {userProfile?.displayName || user?.displayName || 'Admin User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email || 'admin@restaurant.com'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 ${isMobileMenuOpen ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
          <div className="border-t border-gray-200 dark:border-gray-700 py-4">
            <nav className="flex flex-col space-y-1">
              {visibleNavItems.map((item, index) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${currentPage === item.key
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
                    transition: `all 0.3s ease-in-out ${index * 0.1}s`
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
