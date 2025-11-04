'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/(contexts)/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    currentPage?: 'home' | 'menu' | 'orders' | 'reservation';
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
    const { user, loading } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage and system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const initialTheme = savedTheme || systemTheme;

        setTheme(initialTheme);
        setMounted(true);
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (mounted) {
            const root = document.documentElement;
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            localStorage.setItem('theme', theme);
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Load cart count from localStorage
    useEffect(() => {
        const savedCartCount = localStorage.getItem('cartCount');
        if (savedCartCount) {
            setCartCount(parseInt(savedCartCount, 10));
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle search functionality
        console.log('Searching for:', searchQuery);
        // Close mobile search after search
        setIsSearchOpen(false);
    };

    // Close mobile menus when clicking outside or on navigation
    const closeMobileMenus = () => {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
    };

    // Close mobile menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('header')) {
                closeMobileMenus();
            }
        };

        if (isMobileMenuOpen || isSearchOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isMobileMenuOpen, isSearchOpen]);

    const navItems = [
        { name: 'Home', href: '/', key: 'home' },
        { name: 'Menu', href: '/user/menu', key: 'menu' },
        { name: 'Orders', href: '/user/orders', key: 'orders' },
        { name: 'Reservation', href: '/user/reservation', key: 'reservation' },
    ];

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300 ease-in-out">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300 ease-in-out">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-1 md:gap-0 hover:opacity-80 transition-all duration-200 ease-in-out hover:scale-105 ">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 ease-in-out  p-1 ">
                            <img
                                src="/logo.png"
                                alt="Dineezy Logo"
                                className="w-20 h-20 md:w-24 md:h-24 object-cover object-center dark:invert"
                            />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-none md:pb-1">Dineezy</h1>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-8 md:ml-8">
                        {navItems.map((item, index) => (
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

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 ml-auto">

                        <ThemeToggle />

                        {/* Cart */}
                        <Link
                            href="/user/checkout"
                            className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110"
                            aria-label={`Cart with ${cartCount} items`}
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </Link>



                        {/* Notifications - Hidden on small screens */}
                        <button className="hidden sm:block p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110">
                            <svg fill="currentColor" height="16" width="16" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" className="text-gray-600 dark:text-gray-400">
                                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                            </svg>
                        </button>

                        {/* Profile - Show ProfileDropdown for logged in users, login/signup for guests */}
                        {user ? (
                            <ProfileDropdown />
                        ) : (
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Link
                                    href="/user/phone-login"
                                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Login
                                </Link>
                                {/* <Link
                                    href="/user/phone-login"
                                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors`}
                                >
                                    Sign Up
                                </Link> */}
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`md:hidden ml-1 sm:ml-2 flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 ${isMobileMenuOpen ? 'bg-gray-100 dark:bg-gray-700' : ''
                                }`}
                            aria-label="Toggle mobile menu"
                        >
                            <div className="relative w-6 h-6">
                                <svg
                                    className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <svg
                                    className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <form onSubmit={handleSearch} className="flex items-center">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search menu..."
                                className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all duration-200"
                                autoFocus={isSearchOpen}
                            />
                            <button
                                type="submit"
                                className="ml-2 p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(false)}
                                className="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="border-t border-gray-200 dark:border-gray-700 py-4">
                        <nav className="flex flex-col space-y-2">
                            {navItems.map((item, index) => (
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
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 px-4">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="flex w-fit gap-4 items-center justify-between rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-gray-900"
                                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                            >
                                <span>Toggle theme</span>
                                {theme === 'light' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
