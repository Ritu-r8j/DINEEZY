'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import ThemeToggle from './ThemeToggle';

interface AdminHeaderProps {
  currentPage?: 'dashboard' | 'menu' | 'orders' | 'payments' | 'reservations' | 'reviews' | 'settings';
}

export default function AdminHeader({ currentPage = 'dashboard' }: AdminHeaderProps) {
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();
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
    { name: 'Payments', href: '/admin/payments', key: 'payments' },
    { name: 'Reservations', href: '/admin/reservations', key: 'reservations' },
    { name: 'Reviews', href: '/admin/reviews', key: 'reviews' },
    { name: 'Settings', href: '/admin/settings', key: 'settings' },
  ];

  return (
    <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-all duration-200 ease-in-out hover:scale-105">
            <div className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900 dark:text-white flex-shrink-0 transition-transform duration-200 ease-in-out">
              <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12ZM16 4.00002L12 2L8 4.00002C8 6.50002 8.5 8.50002 9.5 10.5C10.5 12.5 12 14 12 14C12 14 13.5 12.5 14.5 10.5C15.5 8.50002 16 6.50002 16 4.00002Z M20.3999 18.2C20.0999 17.5 19.5999 16.2 19.3999 15.6C19.1999 15 18.9999 14.5 18.7999 14C18.1999 12.7 17.1999 11.1 16.3999 9.90002C16.1999 9.60002 16.2999 9.20002 16.5999 9.00002C16.8999 8.80002 17.2999 8.90002 17.4999 9.20002C18.3999 10.5 19.4999 12.2 20.1999 13.7C20.3999 14.2 20.5999 14.7 20.7999 15.2C21.1999 16.2 21.8999 18 22.1999 18.8C22.3999 19.2 22.1999 19.7 21.7999 19.9C21.6999 19.9 21.5999 20 21.4999 20C21.1999 20 20.8999 19.8 20.6999 19.5C20.5999 19.2 20.4999 18.7 20.3999 18.2ZM19.7999 22H4.19986C3.93465 22 3.6892 21.8946 3.51419 21.7071C3.33918 21.5196 3.25164 21.2652 3.26986 21L5.46986 6.00002C5.56986 5.30002 6.19986 4.80002 6.89986 4.80002H8.39986C8.89986 4.20002 9.59986 3.60002 10.3999 3.20002L11.5999 2.50002C11.7999 2.40002 12.0999 2.40002 12.2999 2.50002L13.4999 3.20002C14.2999 3.60002 15.0999 4.20002 15.5999 4.80002H17.0999C17.7999 4.80002 18.3999 5.30002 18.4999 6.00002L20.6999 21C20.7181 21.2652 20.6305 21.5196 20.4555 21.7071C20.2805 21.8946 20.0351 22 19.7999 22ZM17.0999 6.80002H6.89986C6.79986 6.80002 6.69986 6.90002 6.69986 7.00002L4.79986 19.8L19.1999 19.8L17.2999 7.00002C17.2999 6.90002 17.1999 6.80002 17.0999 6.80002Z"></path>
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Dineezy Admin</h1>
          </Link>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item, index) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-sm font-medium transition-all duration-200 ease-in-out hover:scale-105 relative ${
                  currentPage === item.key
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
            {/* Notifications */}
            <ThemeToggle/>
            <button className="hidden sm:block p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

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
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
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
              className={`lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 ${
                isMobileMenuOpen ? 'bg-gray-100 dark:bg-gray-700' : ''
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
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="border-t border-gray-200 dark:border-gray-700 py-4">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item, index) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${
                    currentPage === item.key
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
