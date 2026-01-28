'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './animations.css';
import AdminHeader from '../(components)/AdminHeader';
import { useAuth } from '../(contexts)/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

// Custom authentication wrapper for admin routes
function AdminAuthWrapper({ children }: { children: ReactNode }) {
  const { user, loading, authReady, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to be ready (all async operations completed)
    if (!authReady || loading) return;

    if (!user) {
      // No user, redirect to admin login
      router.replace('/admin/login');
      return;
    }

    if (!isAdmin) {
      // User exists but not admin, redirect to user area
      router.replace('/user');
      return;
    }

    // User is admin and auth is ready - no redirect needed
  }, [user, loading, authReady, isAdmin, router]);

  // Show loading screen while checking authentication
  if (loading || !authReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-blue-600 dark:text-blue-400" />
            <div className="absolute inset-0 h-16 w-16 mx-auto border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Admin Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we verify your access...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we reach here, user is authenticated and is admin
  return <>{children}</>;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  // Hide the navigation bar on all auth-related routes
  const authPrefixes = [
    '/admin/login',
    '/admin/register',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/admin/phone-login',
  ];
  const isAuthPage = authPrefixes.some(route => pathname.startsWith(route));

  // Determine current page based on pathname
  const getCurrentPage = () => {
    if (pathname === '/admin') return 'dashboard';
    if (pathname.startsWith('/admin/menu')) return 'menu';
    if (pathname.startsWith('/admin/orders')) return 'orders';
    if (pathname.startsWith('/admin/customers')) return 'customers';
    if (pathname.startsWith('/admin/payments')) return 'payments';
    if (pathname.startsWith('/admin/reservations')) return 'reservations';
    if (pathname.startsWith('/admin/reviews')) return 'reviews';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  // For auth pages, don't use RouteProtection to avoid redirect loops
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Main Content */}
        <main className="transition-all duration-200">
          {children}
        </main>
      </div>
    );
  }

  // For non-auth pages, use custom authentication handling
  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Admin Header with Profile Dropdown */}
        <AdminHeader currentPage={getCurrentPage()} />

        {/* Main Content */}
        <main className="transition-all duration-200">
          {children}
        </main>
      </div>
    </AdminAuthWrapper>
  );
}
