'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../(contexts)/AuthContext';

interface RouteProtectionProps {
  allowedUserTypes: ('user' | 'admin')[];
  redirectTo?: string;
  children: React.ReactNode;
}

export function RouteProtection({ 
  allowedUserTypes, 
  redirectTo, 
  children 
}: RouteProtectionProps) {
  const { user, loading, isAdmin, isUser } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (loading) return;

    // Prevent redirect loops by checking current path
    const currentPath = window.location.pathname;
    
    // If no user, redirect to appropriate login page
    if (!user) {
      if (allowedUserTypes.includes('admin') && !allowedUserTypes.includes('user')) {
        if (currentPath !== '/admin/login') {
          setRedirectPath('/admin/login');
          setShouldRedirect(true);
        }
        return;
      }
      if (currentPath !== '/user/login') {
        setRedirectPath('/user/login');
        setShouldRedirect(true);
      }
      return;
    }

    // Check if user type is allowed
    const isAllowed = allowedUserTypes.some(type => {
      if (type === 'admin') return isAdmin;
      if (type === 'user') return isUser;
      return false;
    });

    // If user is not allowed, redirect or show access denied
    if (!isAllowed) {
      if (isAdmin) {
        const targetPath = redirectTo || '/admin';
        if (currentPath !== targetPath) {
          setRedirectPath(targetPath);
          setShouldRedirect(true);
        }
        return;
      } else if (isUser) {
        const targetPath = redirectTo || '/user';
        if (currentPath !== targetPath) {
          setRedirectPath(targetPath);
          setShouldRedirect(true);
        }
        return;
      }
    }
  }, [user, loading, isAdmin, isUser, allowedUserTypes, redirectTo]);

  // Perform redirect
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      router.push(redirectPath);
    }
  }, [shouldRedirect, redirectPath, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Check if user type is allowed
  const isAllowed = allowedUserTypes.some(type => {
    if (type === 'admin') return isAdmin;
    if (type === 'user') return isUser;
    return false;
  });

  // If user is not allowed, show loading while redirecting or access denied
  if (!isAllowed) {
    if (isAdmin || isUser) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
          </div>
        </div>
      );
    } else {
      // Show access denied for unknown user types
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // User is allowed, render children
  return <>{children}</>;
}

// Helper hooks for specific route protection
export function useAdminOnly() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      router.push('/user');
    }
  }, [user, loading, isAdmin, router]);

  return { user, loading, isAdmin };
}

export function useUserOnly() {
  const { user, loading, isUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !isUser) {
      router.push('/admin');
    }
  }, [user, loading, isUser, router]);

  return { user, loading, isUser };
}

// Hook for checking if user can access a specific route
export function useRouteAccess(allowedUserTypes: ('user' | 'admin')[]) {
  const { user, loading, isAdmin, isUser } = useAuth();
  
  const hasAccess = allowedUserTypes.some(type => {
    if (type === 'admin') return isAdmin;
    if (type === 'user') return isUser;
    return false;
  });

  return {
    user,
    loading,
    hasAccess,
    isAdmin,
    isUser
  };
}
