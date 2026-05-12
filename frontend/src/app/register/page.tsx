'use client';

import TopNav from "@/components/TopNav";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/services/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, isAuthenticated, isLoading: isAuthLoading, firebaseUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);      // show verification banner
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');     // resend feedback
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      if (firebaseUser?.emailVerified) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isAuthLoading, router, firebaseUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.name.trim(), formData.email, formData.password);
      // Show verification banner instead of going to dashboard
      setRegisteredEmail(formData.email);
      setRegistered(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError(err?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendStatus('');
    try {
      await authApi.resendVerification();
      setResendStatus('Verification email resent! Check your inbox.');
    } catch {
      setResendStatus('Could not resend. Please try again in a moment.');
    } finally {
      setResending(false);
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
    <div className="antialiased bg-background text-on-surface">
      <TopNav />
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-8 py-20">

          {/* ── Email Verification Banner ── */}
          {registered && (
            <div className="max-w-xl mx-auto">
              <div className="bg-surface-container-lowest border-2 border-primary p-12 text-center">
                <div className="text-6xl mb-6">📧</div>
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold block mb-4">
                  Account Created
                </span>
                <h1 className="font-display text-4xl font-black text-on-surface mb-4 tracking-tight">
                  Verify Your Email
                </h1>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-2">
                  A verification link has been sent to:
                </p>
                <p className="font-mono font-bold text-on-surface mb-6">{registeredEmail}</p>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                  Please click the link in the email to activate your account.
                  The link expires in <strong>24 hours</strong>.
                </p>
                {resendStatus && (
                  <p className={`text-sm mb-4 ${resendStatus.includes('resent') ? 'text-green-600' : 'text-red-600'}`}>
                    {resendStatus}
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-primary text-on-primary py-3 font-bold uppercase text-[10px] tracking-widest hover:bg-primary-dim transition-colors"
                  >
                    Continue to Dashboard →
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full border border-outline text-on-surface py-3 font-bold uppercase text-[10px] tracking-widest hover:bg-surface-container transition-colors disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
                <p className="mt-6 text-[10px] text-on-surface-variant">
                  Didn't get it? Check your spam folder.
                </p>
              </div>
            </div>
          )}

          {/* Main Registration Form — hidden once registered */}
          {!registered && (<>
          <div className="swiss-grid mb-20">
            <div className="col-span-12 lg:col-span-7">
              <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold mb-4 block">
                Institutional Access
              </span>
              <h1 className="text-6xl md:text-8xl font-display font-bold leading-[0.9] tracking-tighter text-on-surface mb-8 italic">
                The Forensic <br />Archive
              </h1>
              <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
                Secure registration for certified forensic analysts. Access high-precision
                instrumentation, encrypted intelligence reports, and the central truth-status
                repository.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-5 flex flex-col justify-end">
              <div className="bg-surface-container-high p-8 border-l-4 border-primary">
                <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface mb-2">
                  Protocol 04-A
                </p>
                <p className="text-sm italic font-display">
                  &quot;Accuracy is the only metric of authority.&quot;
                </p>
              </div>
            </div>
          </div>

          <div className="swiss-grid">
            {/* Sidebar */}
            <aside className="col-span-12 lg:col-span-3">
              <div className="sticky top-24 space-y-12">
                <div className="space-y-6">
                  {[
                    { num: "01", label: "Identity", active: true },
                    { num: "02", label: "Credentials", active: false },
                    { num: "03", label: "Vetting", active: false },
                    { num: "04", label: "Encryption", active: false },
                  ].map((step) => (
                    <div key={step.num} className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 flex items-center justify-center font-bold text-xs ${
                          step.active
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {step.num}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          step.active ? "text-on-surface" : "text-on-surface-variant"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-12 border-t border-outline-variant/20">
                  <h4 className="text-[11px] font-black uppercase mb-4 tracking-tighter">
                    Requirements
                  </h4>
                  <ul className="space-y-3 text-xs text-on-surface-variant uppercase tracking-widest font-medium">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-green-600">check_circle</span>
                      Valid Email Address
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-green-600">check_circle</span>
                      Secure Password (6+ chars)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">security</span>
                      Firebase Auth Protected
                    </li>
                  </ul>
                </div>
              </div>
            </aside>

            {/* Form */}
            <div className="col-span-12 lg:col-span-9">
              <div className="bg-surface-container-lowest p-12 lg:p-16 shadow-[32px_32px_64px_rgba(0,0,0,0.03)]">
                <h2 className="text-4xl font-display mb-10">Verification of Identity</h2>

                {/* Google Sign-In */}
                <button
                  onClick={handleGoogle}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full flex items-center justify-center gap-3 border-2 border-outline py-3.5 mb-8 font-bold text-sm tracking-wide hover:border-on-surface transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
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

                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-px bg-outline-variant/30" />
                  <span className="text-[0.625rem] font-bold uppercase tracking-widest text-on-surface-variant">
                    or register with email
                  </span>
                  <div className="flex-1 h-px bg-outline-variant/30" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="As per official documentation"
                        required
                        className="w-full bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-0 py-3 text-lg placeholder:text-surface-container-highest outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        required
                        className="w-full bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-0 py-3 text-lg placeholder:text-surface-container-highest outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Min. 6 characters"
                          required
                          className="w-full bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-0 py-3 text-lg placeholder:text-surface-container-highest outline-none pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-3 text-on-surface-variant"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repeat password"
                        required
                        className="w-full bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-0 py-3 text-lg placeholder:text-surface-container-highest outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-surface-container">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined">verified_user</span>
                      <span className="text-xs uppercase tracking-widest font-bold">
                        Firebase Auth Protected
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary-dim text-on-primary px-12 py-4 font-bold uppercase tracking-[0.2em] flex items-center gap-4 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin material-symbols-outlined">autorenew</span>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                            arrow_forward
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">
                      Already registered?{' '}
                      <Link href="/login" className="text-primary font-bold hover:underline">
                        Login here
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
          </>)}
        </div>
      </main>
    </div>
  );
}
