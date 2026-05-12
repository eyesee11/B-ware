'use client';

import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface User {
  id?: number;
  firebase_uid: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helper: sync Firebase user to MySQL via backend ─────────────────────────
async function syncToBackend(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const idToken = await firebaseUser.getIdToken();
    const res = await fetch(`${API_BASE_URL}/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch (err) {
    console.error('[AuthContext] syncToBackend failed:', err);
    return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profile = await syncToBackend(fbUser);
        if (profile) {
          setUser(profile);
        } else {
          // Fallback to Firebase user data if backend sync fails
          setUser({
            firebase_uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Analyst',
            email: fbUser.email || '',
            avatar_url: fbUser.photoURL,
            role: 'user',
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get current Firebase ID token (auto-refreshed)
  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    try {
      return await firebaseUser.getIdToken();
    } catch {
      return null;
    }
  }, [firebaseUser]);

  // Email/password login
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Email/password registration
  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      // Set display name in Firebase profile
      await updateProfile(fbUser, { displayName: name });
      // Force token refresh so displayName is in the token
      await fbUser.getIdToken(true);
      // onAuthStateChanged will fire and sync to backend
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Google Sign-In
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged handles the rest
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Tell backend to revoke Firebase refresh tokens + blacklist Redis session
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
        }).catch(() => {}); // Non-fatal if backend is down
      }
      await signOut(auth);
    } finally {
      setUser(null);
      setFirebaseUser(null);
      setIsLoading(false);
    }
  }, [firebaseUser]);

  // Forgot password — uses Firebase to generate reset email
  const forgotPassword = useCallback(async (email: string) => {
    // Use backend (Nodemailer) for branded email
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to send reset email');
    }
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user && !!firebaseUser,
    login,
    register,
    loginWithGoogle,
    logout,
    forgotPassword,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
