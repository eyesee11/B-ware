'use client';

import TopNav from "@/components/TopNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/services/api";

export default function VerifyPendingPage() {
  const router = useRouter();
  const { firebaseUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // If they somehow land here unauthenticated, send them to login
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // If they are already verified, send them to dashboard
  useEffect(() => {
    if (firebaseUser?.emailVerified) {
      router.push('/dashboard');
    }
  }, [firebaseUser, router]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (firebaseUser) {
        await firebaseUser.reload();
        if (firebaseUser.emailVerified) {
          await firebaseUser.getIdToken(true);
          router.push('/dashboard');
        } else {
          setResendStatus('Still not verified. Please check your email.');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  if (isAuthLoading || !isAuthenticated) return null;

  return (
    <div className="antialiased bg-background text-on-surface">
      <TopNav />
      <main className="pt-32 min-h-screen flex items-start justify-center">
        <div className="max-w-xl w-full px-8">
          <div className="bg-surface-container-lowest border-2 border-primary p-12 text-center shadow-[32px_32px_64px_rgba(0,0,0,0.03)]">
            <div className="text-6xl mb-6">🔒</div>
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold block mb-4">
              Access Restricted
            </span>
            <h1 className="font-display text-4xl font-black text-on-surface mb-4 tracking-tight">
              Email Verification Required
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-2">
              To access the Forensic Unit 01, you must verify your identity.
            </p>
            <p className="font-mono font-bold text-on-surface mb-6">
              {firebaseUser?.email}
            </p>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
              A verification link was sent to your email during registration. Please click the link to activate your session.
            </p>

            {resendStatus && (
              <p className={`text-sm mb-6 font-medium ${resendStatus.includes('resent') ? 'text-green-500' : 'text-red-500'}`}>
                {resendStatus}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full bg-primary text-on-primary py-4 font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-primary-dim transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {refreshing ? (
                  <><span className="animate-spin material-symbols-outlined text-[14px]">autorenew</span> Verifying...</>
                ) : (
                  "I have verified my email →"
                )}
              </button>
              
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full border-2 border-outline text-on-surface py-4 font-bold uppercase text-[10px] tracking-[0.2em] hover:border-on-surface transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {resending ? (
                  <><span className="animate-spin material-symbols-outlined text-[14px]">autorenew</span> Sending...</>
                ) : (
                  "Resend Verification Email"
                )}
              </button>
            </div>
            
            <p className="mt-8 text-[10px] text-on-surface-variant uppercase tracking-widest">
              Check your spam folder if you cannot find the email.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
