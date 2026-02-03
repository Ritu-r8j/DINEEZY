'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './animations.css';
import { useAuth } from '../(contexts)/AuthContext';
import { useBusinessType } from '@/app/(utils)/useFeatures';
import ThemeToggle from '../(components)/ThemeToggle';
import { 
  LayoutDashboard, 
  Menu, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  CalendarRange, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Menu as MenuIcon, 
  X, 
  Loader2, 
  User
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

// --- Auth Wrapper ---
function AdminAuthWrapper({ children }: { children: ReactNode }) {
  const { user, loading, authReady, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady || loading) return;

    if (!user) {
      router.replace('/admin/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/user');
      return;
    }
  }, [user, loading, authReady, isAdmin, router]);

  if (loading || !authReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-gray-900 dark:text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Admin Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we verify your access...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// --- Main Layout ---
export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();
  const { isRESTO } = useBusinessType();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation Items
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Menu', href: '/admin/menu', icon: Menu },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Reservations', href: '/admin/reservations', icon: CalendarRange, requiresRESTO: true },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.requiresRESTO) return isRESTO();
    return true;
  });

  const authPrefixes = [
    '/admin/login',
    '/admin/register',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/admin/phone-login',
  ];
  const isAuthPage = authPrefixes.some(route => pathname.startsWith(route));

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] transition-colors duration-200">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex font-sans text-gray-900 dark:text-gray-100">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 z-50 h-screen w-64 
          bg-white dark:bg-[#0f1115] border-r border-gray-200 dark:border-gray-800
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 relative flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  width={40} 
                  height={40} 
                  alt="Dineezy" 
                  className="object-contain dark:invert" 
                  priority
                />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Dineezy
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-hide">
            <div className="mb-6">
              <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Overview
              </p>
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                      ${isActive 
                        ? 'bg-gradient-to-r from-[#b8dcff33] via-[#c9cbff33] to-[#e5c0ff33] text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}`} strokeWidth={isActive ? 2 : 1.5} />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
               <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" strokeWidth={1.5} />
                  Sign Out
                </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
          
          {/* Top Header */}
          <header className="h-16 sticky top-0 z-30 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize hidden sm:block">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <ThemeToggle />
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block max-w-[100px] truncate">
                    {userProfile?.displayName || 'Admin'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#14161a] rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 animate-in fade-in zoom-in-95 duration-200">
                     <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {userProfile?.displayName || 'Admin User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/admin/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-200 dark:border-gray-800 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
