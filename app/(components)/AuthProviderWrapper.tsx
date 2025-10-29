'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../(contexts)/AuthContext';
import { ThemeProvider } from '../(contexts)/ThemeContext';

interface AuthProviderWrapperProps {
  children: ReactNode;
}

export default function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
