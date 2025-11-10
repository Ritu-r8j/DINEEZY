'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { useTheme } from '@/app/(contexts)/ThemeContext';
import ProfileDropdown from './ProfileDropdown';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    currentPage?: 'home' | 'menu' | 'orders' | 'reservation';
}

interface NavItem {
    name: string;
    href: string;
    key: string;
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
    const { user, userProfile, loading: authLoading, signOut } = useAuth();
    const { theme: themeMode } = useTheme();
    const isDarkMode = themeMode === "dark";
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    // Load cart count from localStorage
    useEffect(() => {
        const savedCartCount = localStorage.getItem('cartCount');
        if (savedCartCount) {
            setCartCount(parseInt(savedCartCount, 10));
        }
    }, []);

    // Mounted effect
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery);
        setIsSearchOpen(false);
    };

    // Navigation items - dynamic based on auth status
    const navItems: NavItem[] = user ? [
        { name: "Home", href: "/", key: "home" },
        { name: "Menu", href: "/user/menu", key: "menu" },
        { name: "Orders", href: "/user/orders", key: "orders" },
        { name: "Reservation", href: "/user/my-reservations", key: "reservation" },
        { name: "Profile", href: "/user/profile", key: "profile" },
    ] : [
        { name: "Home", href: "/", key: "home" },
        { name: "Menu", href: "/user/menu", key: "menu" },
        { name: "Orders", href: "/user/orders", key: "orders" },
        { name: "Reservation", href: "/user/my-reservations", key: "reservation" },
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

                {/* Mobile Navigation */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="border-t border-gray-200 dark:border-gray-700 py-4 pb-6 px-2 sm:px-4">
                        {/* User Profile Section in Mobile Menu */}
                        {user && (
                            <div
                                className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-gradient-to-r from-gray-900/10 to-gray-900/5 dark:from-gray-700/30 dark:to-gray-700/10 border border-gray-200 dark:border-gray-700"
                                style={{
                                    animationDelay: '0s',
                                    transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
                                    transition: 'all 0.3s ease-in-out'
                                }}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900/20 to-gray-900/10 dark:from-gray-600/30 dark:to-gray-600/10 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {(userProfile?.displayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {userProfile?.displayName || user?.displayName || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {userProfile?.email || user?.email}
                                    </p>
                                </div>
                            </div>
                        )}
                        <nav className="flex flex-col space-y-2">
                            {navItems.map((item, index) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${
                                        item.href.startsWith('#')
                                            ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                    style={{
                                        animationDelay: `${(index + (user ? 1 : 0)) * 0.1}s`,
                                        transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
                                        transition: `all 0.3s ease-in-out ${(index + (user ? 1 : 0)) * 0.1}s`
                                    }}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <div
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                                style={{
                                    animationDelay: `${(navItems.length + (user ? 1 : 0)) * 0.1}s`,
                                    transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
                                    transition: `all 0.3s ease-in-out ${(navItems.length + (user ? 1 : 0)) * 0.1}s`
                                }}
                            >
                                <span>Theme</span>
                                <ThemeToggle size="sm" />
                            </div>
                            {/* Login/Logout Section */}
                            {user ? (
                                <div
                                    className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700"
                                    style={{
                                        animationDelay: `${(navItems.length + (user ? 1 : 0) + 1) * 0.1}s`,
                                        transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
                                        transition: `all 0.3s ease-in-out ${(navItems.length + (user ? 1 : 0) + 1) * 0.1}s`
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            signOut();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                            <path d="m16 17 5-5-5-5" />
                                            <path d="M21 12H9" />
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700"
                                    style={{
                                        animationDelay: `${(navItems.length + 1) * 0.1}s`,
                                        transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
                                        transition: `all 0.3s ease-in-out ${(navItems.length + 1) * 0.1}s`
                                    }}
                                >
                                    <Link href="/user/phone-login" onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                                <path d="M10 17l5-5-5-5" />
                                                <path d="M15 12H3" />
                                            </svg>
                                            Log in
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
}
