'use client';

import TopNav from "@/components/TopNav";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later or reset your password.');
      } else {
        setError(err?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen">
      <TopNav />

      <main className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-full max-w-[1440px] px-8 grid grid-cols-12 gap-0">

          {/* Left: Branding */}
          <div className="hidden lg:flex col-span-7 flex-col justify-center pr-20 border-r border-outline-variant/15">
            <div className="space-y-12">
              <div className="inline-block bg-surface-container-highest px-3 py-1">
                <span className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
                  Access Protocol v.4.0
                </span>
              </div>
              <h1 className="font-display text-8xl leading-[0.9] tracking-tighter text-inverse-surface">
                No Lies Told<span className="text-primary">.</span>
              </h1>
              <div className="max-w-md">
                <p className="text-base leading-relaxed text-on-surface-variant mb-8">
                  Enter the forensic archive. Every data point is cross-referenced, every claim is
                  verified, and every truth is documented with surgical precision.
                </p>
                <div className="flex items-center gap-4 py-6 border-t border-outline-variant/15">
                  <div className="w-12 h-12 flex items-center justify-center bg-surface-container-low">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                  </div>
                  <div>
                    <div className="text-[0.6875rem] font-bold tracking-widest uppercase">
                      Encryption Status
                    </div>
                    <div className="text-sm font-medium text-on-surface">
                      Firebase Auth + AES-256 Secure
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-center items-start lg:pl-20 py-20">
            <div className="w-full max-w-sm">
              <header className="mb-10">
                <h2 className="text-4xl font-display tracking-tight text-inverse-surface mb-2">
                  Identify Yourself
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Submit credentials to access the Forensic Unit 01.
                </p>
              </header>

              {/* Google Sign-In */}
              <button
                onClick={handleGoogle}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 border-2 border-outline py-3.5 mb-6 font-bold text-sm tracking-wide hover:border-on-surface transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <span className="animate-spin material-symbols-outlined text-sm">autorenew</span>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
                    <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.4 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.5 6.3 14.7z"/>
                    <path fill="#FBBC05" d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.4C29.9 37 27.1 38 24 38c-5.8 0-10.7-3.9-12.4-9.3l-7 5.4C8 40.8 15.5 46 24 46z"/>
                    <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.6-2.7 4.8-5.1 6.3l6.6 5.4C41.3 37.1 45 31 45 24c0-1.4-.2-2.7-.5-4z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-outline-variant/30" />
                <span className="text-[0.625rem] font-bold uppercase tracking-widest text-on-surface-variant">or</span>
                <div className="flex-1 h-px bg-outline-variant/30" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="group">
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border-b border-outline py-3 focus:outline-none focus:border-primary transition-all placeholder:text-outline-variant/50 text-on-surface"
                  />
                </div>

                <div className="group">
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent border-b border-outline py-3 focus:outline-none focus:border-primary transition-all placeholder:text-outline-variant/50 text-on-surface pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-3 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[0.6875rem] text-on-surface-variant">
                    No account?{' '}
                    <Link href="/register" className="text-primary font-bold hover:underline">
                      Register
                    </Link>
                  </span>
                  <Link
                    href="/forgot-password"
                    className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary hover:text-primary-dim transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-inverse-surface text-surface py-4 font-bold tracking-[0.1em] uppercase hover:bg-on-surface-variant transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-sm">autorenew</span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Initialize Session
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Stats footer */}
              <div className="mt-12 pt-8 border-t border-outline-variant/15 grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-low">
                  <div className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    Integrity Score
                  </div>
                  <div className="text-xl font-display text-inverse-surface tracking-tighter">99.98%</div>
                </div>
                <div className="p-4 bg-surface-container-low">
                  <div className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    Verified Claims
                  </div>
                  <div className="text-xl font-display text-inverse-surface tracking-tighter">124K+</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Decorations */}
      <div className="fixed bottom-8 left-8 hidden lg:block">
        <div className="flex items-center gap-6">
          <div className="w-px h-12 bg-outline-variant/30" />
          <div className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">
            System Truth Protocol
          </div>
        </div>
      </div>
    </div>
  );
}
