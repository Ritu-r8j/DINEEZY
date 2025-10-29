'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import './animations.css';
import AdminHeader from '../(components)/AdminHeader';
import { RouteProtection } from '../(utils)/routeProtection';

interface AdminLayoutProps {
  children: ReactNode;
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

  // For non-auth pages, use RouteProtection
  return (
    <RouteProtection allowedUserTypes={['admin']} redirectTo="/user">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Admin Header with Profile Dropdown */}
        <AdminHeader currentPage={getCurrentPage()} />

        {/* Main Content */}
        <main className="transition-all duration-200">
          {children}
        </main>
      </div>
    </RouteProtection>
  );
}
