'use client';

import TopNav from "@/components/TopNav";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type State = 'idle' | 'loading' | 'success' | 'error';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setState('loading');

    try {
      await forgotPassword(email.trim().toLowerCase());
      setState('success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send reset email. Please try again.');
      setState('error');
    }
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen">
      <TopNav />

      <main className="min-h-screen flex items-center justify-center pt-16 px-8">
        <div className="w-full max-w-[480px]">

          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors mb-12"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Login
          </Link>

          {state === 'success' ? (
            // ── Success state ──
            <div className="text-center space-y-8">
              <div className="w-20 h-20 mx-auto bg-green-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 text-4xl">mark_email_read</span>
              </div>
              <div>
                <h1 className="text-4xl font-display font-black tracking-tight text-inverse-surface mb-3">
                  Check Your Inbox
                </h1>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
                  A password reset link has been sent to{' '}
                  <strong className="text-on-surface">{email}</strong>.
                  The link expires in <strong className="text-on-surface">1 hour</strong>.
                </p>
              </div>
              <div className="bg-surface-container-low p-6 text-left">
                <p className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                  Didn't receive it?
                </p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Check your spam folder. If it's still not there, wait a minute and try again.
                </p>
              </div>
              <button
                onClick={() => { setState('idle'); setEmail(''); }}
                className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary hover:text-primary-dim transition-colors"
              >
                Try a different email
              </button>
            </div>
          ) : (
            // ── Form state ──
            <>
              <div className="mb-10">
                <div className="inline-block bg-surface-container-highest px-3 py-1 mb-6">
                  <span className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
                    Security Protocol
                  </span>
                </div>
                <h1 className="text-5xl font-display font-black tracking-tight text-inverse-surface leading-[0.95] mb-4">
                  Reset<br />Password
                </h1>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Enter the email address associated with your account and we'll send you a
                  secure reset link via our encrypted mail service.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {state === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{errorMsg}</p>
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
                    disabled={state === 'loading'}
                    className="w-full bg-transparent border-b border-outline py-3 focus:outline-none focus:border-primary transition-all placeholder:text-outline-variant/50 text-on-surface disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={state === 'loading' || !email.trim()}
                  className="w-full bg-inverse-surface text-surface py-4 font-bold tracking-[0.1em] uppercase hover:bg-on-surface-variant transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state === 'loading' ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-sm">autorenew</span>
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <span className="material-symbols-outlined text-sm">send</span>
                    </>
                  )}
                </button>
              </form>

              {/* Info box */}
              <div className="mt-12 pt-8 border-t border-outline-variant/15">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-surface-container-low">
                    <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                  </div>
                  <div>
                    <p className="text-[0.6875rem] font-bold uppercase tracking-widest mb-1">
                      Nodemailer Secured
                    </p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Reset emails are sent via our encrypted SMTP service using Firebase-generated
                      one-time tokens. Your credentials are never transmitted.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
