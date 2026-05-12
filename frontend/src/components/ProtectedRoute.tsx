'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

/**
 * Protects routes that require authentication.
 * Uses Firebase auth state (via AuthContext) — redirects to /login if unauthenticated.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'user',
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, firebaseUser } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && firebaseUser && !firebaseUser.emailVerified) {
      router.push('/verify-pending');
    } else if (!isLoading && isAuthenticated && requiredRole === 'admin' && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  // Show spinner while Firebase resolves auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-bold">
            Verifying Identity...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (firebaseUser && !firebaseUser.emailVerified) return null;
  if (requiredRole === 'admin' && user?.role !== 'admin') return null;

  return <>{children}</>;
};
