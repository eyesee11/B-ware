'use client';

import TopNav from "@/components/TopNav";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="bg-background text-on-surface antialiased">
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
                      AES-256 GCM Secure Tunnel Active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-center items-start lg:pl-20 py-20">
            <div className="w-full max-w-sm">
              <header className="mb-12">
                <h2 className="text-4xl font-display tracking-tight text-inverse-surface mb-2">
                  Identify Yourself
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Submit credentials to access the Forensic Unit 01.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="group">
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">
                    Agent Identifier
                  </label>
                  <input
                    type="email"
                    placeholder="name@b-ware.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border-b border-outline py-3 focus:outline-none focus:border-primary transition-all placeholder:text-outline-variant/50 text-on-surface"
                  />
                </div>

                <div className="group">
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2 group-focus-within:text-primary transition-colors">
                    Security Cipher
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent border-b border-outline py-3 focus:outline-none focus:border-primary transition-all placeholder:text-outline-variant/50 text-on-surface"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 border-outline text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                      Stay Sessionized
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary hover:text-primary-dim transition-colors"
                  >
                    Forgot Cipher?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-inverse-surface text-surface py-4 font-bold tracking-[0.1em] uppercase hover:bg-on-surface-variant transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-sm">
                        autorenew
                      </span>
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

              <footer className="mt-20 pt-8 border-t border-outline-variant/15">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container-low">
                    <div className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                      Integrity Score
                    </div>
                    <div className="text-xl font-display text-inverse-surface tracking-tighter">
                      99.98%
                    </div>
                  </div>
                  <div className="p-4 bg-surface-container-low">
                    <div className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                      Last Sync
                    </div>
                    <div className="text-xl font-display text-inverse-surface tracking-tighter">
                      0.4ms
                    </div>
                  </div>
                </div>
                <p className="mt-8 text-[0.6875rem] text-on-surface-variant leading-relaxed">
                  Authorized personnel only. All session interactions are logged under the{" "}
                  <span className="text-on-surface font-semibold">
                    B-ware Intelligence Directive
                  </span>
                  . Unauthorized access will be flagged for immediate redaction.
                </p>
                <p className="mt-4 text-[0.6875rem] text-on-surface-variant">
                  No account?{" "}
                  <Link href="/register" className="text-primary font-bold hover:underline">
                    Register here
                  </Link>
                </p>
              </footer>
            </div>
          </div>
        </div>
      </main>

      {/* Swiss decorations */}
      <div className="fixed bottom-8 left-8 hidden lg:block">
        <div className="flex items-center gap-6">
          <div className="w-px h-12 bg-outline-variant/30"></div>
          <div className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">
            System Truth Protocol
          </div>
        </div>
      </div>
      <div className="fixed top-24 right-8 hidden lg:block">
        <div className="text-[0.6875rem] font-mono text-outline-variant/50">
          [ LAT: 47.3769° N ]<br />[ LON: 8.5417° E ]
        </div>
      </div>
    </div>
  );
}
