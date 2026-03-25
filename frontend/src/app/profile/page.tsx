'use client';

import { useAuth } from '@/hooks/useAuth';
import { claimsApi } from '@/services/api';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function ProfileContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [statsResponse, claimsResponse] = await Promise.all([
        claimsApi.getStats().catch(() => null),
        claimsApi.getHistory(1, 5).catch(() => null),
      ]);

      if (statsResponse) setStats(statsResponse);
      if (claimsResponse) setClaims(claimsResponse.claims || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'accurate':
        return 'bg-green-100 text-green-800 bg-[#22C55E]';
      case 'false':
        return 'bg-red-100 text-red-800 bg-error';
      case 'misleading':
        return 'bg-orange-100 text-orange-800 bg-tertiary';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <main className="ml-64 pt-24 px-12 pb-20 bg-background min-h-screen">
      {/* Identity Header */}
      <header className="mb-20">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">
              Personnel Dossier // Ref: {user?.id}
            </p>
            <h1 className="text-6xl font-display font-black tracking-tight leading-none text-on-surface">
              {user?.name || 'Analyst'}
            </h1>
            <div className="flex gap-6 items-center mt-6">
              <div className="flex flex-col">
                <span className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant mb-1">
                  Email
                </span>
                <span className="text-sm font-mono font-bold">{user?.email}</span>
              </div>
              <div className="h-8 w-[1px] bg-outline-variant opacity-30"></div>
              <div className="flex flex-col">
                <span className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant mb-1">
                  Role
                </span>
                <span className="text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary"></span>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="w-48 h-64 bg-surface-container-highest relative overflow-hidden">
            <div className="w-full h-full bg-gradient-to-b from-zinc-300 to-zinc-500 grayscale contrast-125 flex items-center justify-center text-on-surface-variant">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bento */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-12">
          {error}
        </div>
      ) : (
        <>
          <section className="swiss-grid mb-24">
            <div className="col-span-8 bg-surface-container-low p-12 flex flex-col justify-between min-h-[400px]">
              <div className="flex justify-between items-start">
                <h3 className="font-display text-3xl font-bold italic">Verification Accuracy</h3>
                <span className="material-symbols-outlined text-primary text-4xl">verified</span>
              </div>
              <div>
                <div className="text-[7rem] font-headline font-black leading-none tracking-tighter -ml-3">
                  {stats && stats.total > 0 ? ((stats.accurate || 0) / stats.total * 100).toFixed(1) : '0'}%
                </div>
                <p className="text-on-surface-variant max-w-md mt-4 text-sm leading-relaxed">
                  Accuracy rating across {stats?.total || 0} documented forensic verifications. 
                  {stats?.accurate || 0} accurate, {stats?.misleading || 0} misleading, {stats?.false || 0} false claims identified.
                </p>
              </div>
            </div>
            <div className="col-span-4 space-y-8">
              <div className="bg-surface-container-highest p-8 h-[calc(50%-1rem)] flex flex-col justify-center">
                <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-on-surface-variant mb-4">
                  Total Verifications
                </span>
                <span className="text-5xl font-headline font-bold">{stats?.total || 0}</span>
              </div>
              <div className="bg-inverse-surface p-8 h-[calc(50%-1rem)] flex flex-col justify-center text-surface">
                <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-surface-variant/60 mb-4">
                  Avg Confidence
                </span>
                <span className="text-5xl font-headline font-bold">{stats?.avg_confidence ? (Math.round(parseFloat(stats.avg_confidence) * 100)) : '0'}%</span>
              </div>
            </div>
          </section>

          {/* Recent Verdicts */}
          <section>
            <div className="flex items-end justify-between mb-12 border-b border-outline-variant/20 pb-4">
              <h2 className="text-4xl font-display font-bold">Recent Verifications</h2>
            </div>
            {claims.length > 0 ? (
              <div className="space-y-6">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="group relative bg-surface-container-lowest hover:bg-surface-container-low transition-all p-8"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${claim.verdict === 'accurate' ? 'bg-[#22C55E]' : claim.verdict === 'false' ? 'bg-error' : 'bg-tertiary'}`}></div>
                    <div className="grid grid-cols-12 gap-6 items-center">
                      <div className="col-span-2">
                        <span className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant block mb-1">
                          Claim ID
                        </span>
                        <span className="font-mono font-bold text-sm">#{claim.id}</span>
                      </div>
                      <div className="col-span-5">
                        <span className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant block mb-1">
                          Subject
                        </span>
                        <p className="font-bold truncate">{claim.original_text.substring(0, 100)}</p>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant block mb-1">
                          Status
                        </span>
                        <span className={`text-[0.6875rem] font-bold uppercase py-1 px-2 ${
                          claim.verdict === 'accurate' ? 'bg-green-100 text-green-800' : 
                          claim.verdict === 'false' ? 'bg-red-100 text-red-800' : 
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {claim.verdict?.toUpperCase() || 'UNVERIFIABLE'}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant block mb-1">
                          Date
                        </span>
                        <span className="text-xs">
                          {new Date(claim.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-on-surface-variant">
                <p className="text-sm">No verifications yet</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Footer Meta */}
      <footer className="mt-40 pt-12 border-t border-outline-variant/30 flex justify-between items-center opacity-40 grayscale">
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="text-[0.5rem] uppercase tracking-widest mb-1">Terminal Session</span>
            <span className="text-[0.625rem] font-mono">X88-293-VANE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.5rem] uppercase tracking-widest mb-1">Encryption Key</span>
            <span className="text-[0.625rem] font-mono">AES-256-GCM-ACTIVE</span>
          </div>
        </div>
        <div className="text-[0.5rem] uppercase tracking-[0.3em]">
          © 2024 B-ware Forensic Division. Proprietary &amp; Confidential.
        </div>
      </footer>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
