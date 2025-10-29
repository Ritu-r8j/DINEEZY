import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function UserAuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {children}
    </div>
  );
}
