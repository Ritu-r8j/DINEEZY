'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '../(components)/Header';
import UnifiedCart from '../(components)/UnifiedCart';
import { RouteProtection } from '../(utils)/routeProtection';

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const pathname = usePathname();

  // Hide the navigation bar on all auth-related routes
  const authPrefixes = [
    '/user/login',
    '/user/register',
    '/user/phone-login',
    '/user/forgot-password',
    '/user/reset-password',
  ];
  const isAuthPage = authPrefixes.some(route => pathname.startsWith(route));

  // Determine current page based on pathname
  const getCurrentPage = () => {
    if (pathname.startsWith('/user/menu')) return 'menu';
    if (pathname.startsWith('/user/orders')) return 'orders';
    if (pathname.startsWith('/user/reservation')) return 'reservation';
    if (pathname.startsWith('/user/profile')) return 'home'; // Map profile to home
    if (pathname.startsWith('/user/checkout')) return 'menu'; // Map checkout to menu
    return 'home';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* User Header - Only show on non-auth pages */}
      {!isAuthPage && <Header currentPage={getCurrentPage()} />}

      {/* Main Content */}
      <main className="transition-all duration-200">
        {children}
      </main>

      {/* Unified Cart Component - Shows on all pages except auth and checkout */}
      <UnifiedCart />
    </div>
  );
}
