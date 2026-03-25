'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

/**
 * Component to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'user' }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    if (!isLoading && isAuthenticated && requiredRole === 'admin' && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
};
