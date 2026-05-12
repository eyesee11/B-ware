'use client';

import { useAuth } from '@/hooks/useAuth';
import { claimsApi } from '@/services/api';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function ProfileContent() {
  const { user, firebaseUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit name
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

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
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || !firebaseUser) return;
    setIsSaving(true);
    try {
      await updateProfile(firebaseUser, { displayName: editName.trim() });
      setSaveMsg('Name updated successfully');
      setIsEditing(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to update name');
    } finally {
      setIsSaving(false);
    }
  };

  const accuracyRate =
    stats && stats.total > 0
      ? ((stats.accurate || 0) / stats.total * 100).toFixed(1)
      : '0';

  const avgConfidence = stats?.avg_confidence
    ? Math.round(parseFloat(stats.avg_confidence) * 100)
    : 0;

  const providerIcon = firebaseUser?.providerData?.[0]?.providerId === 'google.com'
    ? '🔵 Google'
    : '📧 Email';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : firebaseUser?.metadata?.creationTime
    ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <main className="md:pl-64 pt-16 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* ── Hero Card ── */}
        <section className="mb-10">
          <div className="bg-inverse-surface text-on-primary relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
              backgroundSize: '20px 20px',
            }} />

            <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Avatar */}
              <div className="shrink-0">
                {user?.avatar_url || firebaseUser?.photoURL ? (
                  <img
                    src={user?.avatar_url || firebaseUser?.photoURL || ''}
                    alt={user?.name || 'Avatar'}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-red-600 shadow-2xl"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-red-500 to-red-800 border-4 border-red-600 shadow-2xl flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-black text-white">
                      {(user?.name || firebaseUser?.displayName || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">
                  Personnel Dossier // Ref: {user?.id?.toString().padStart(6, '0') || '——'}
                </p>

                {isEditing ? (
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-white/10 border-b-2 border-red-500 text-white text-3xl font-black tracking-tight outline-none placeholder:text-white/30 py-1 flex-1 min-w-0"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSaving}
                      className="text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isSaving ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white px-3 py-2 shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-4 group">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none truncate">
                      {user?.name || firebaseUser?.displayName || 'Analyst'}
                    </h1>
                    <button
                      onClick={() => { setEditName(user?.name || firebaseUser?.displayName || ''); setIsEditing(true); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>
                )}

                {saveMsg && (
                  <p className="text-xs text-green-400 mb-3">{saveMsg}</p>
                )}

                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-sm font-mono text-white/70">{user?.email || firebaseUser?.email}</span>
                  <span className="h-4 w-px bg-white/20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                    {user?.role?.toUpperCase() || 'ANALYST'}
                  </span>
                  <span className="h-4 w-px bg-white/20" />
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">{providerIcon}</span>
                </div>
              </div>

              {/* Verification badge */}
              <div className="shrink-0 hidden md:block">
                <div className="text-center">
                  <div className="text-6xl font-black text-white tracking-tighter leading-none">
                    {accuracyRate}%
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 mt-1">
                    Accuracy Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Row ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Verifications', value: stats?.total || 0, icon: 'verified', color: 'text-blue-600' },
            { label: 'Accurate', value: stats?.accurate || 0, icon: 'check_circle', color: 'text-green-600' },
            { label: 'Misleading', value: stats?.misleading || 0, icon: 'warning', color: 'text-yellow-600' },
            { label: 'Avg Confidence', value: `${avgConfidence}%`, icon: 'analytics', color: 'text-purple-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-surface-container-lowest border border-surface-container-high p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`material-symbols-outlined text-[22px] ${stat.color}`}>{stat.icon}</span>
                <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">
                  {stat.label}
                </span>
              </div>
              <div className="text-3xl font-black tracking-tighter text-on-surface">
                {isLoading ? (
                  <div className="h-8 w-16 bg-surface-container-high animate-pulse rounded" />
                ) : stat.value}
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* ── Recent Verifications ── */}
          <section className="lg:col-span-2 bg-surface-container-lowest border border-surface-container-high">
            <div className="flex items-center justify-between px-8 py-5 border-b border-surface-container-high">
              <h2 className="text-xs font-black uppercase tracking-widest text-on-surface">
                Recent Verifications
              </h2>
              {claims.length > 0 && (
                <a href="/history" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-dim">
                  View All →
                </a>
              )}
            </div>

            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 bg-surface-container-high animate-pulse rounded" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-red-600">{error}</div>
            ) : claims.length > 0 ? (
              <div className="divide-y divide-surface-container-high">
                {claims.map((claim) => (
                  <div key={claim.id} className="px-8 py-5 hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate mb-1">
                          {claim.original_text?.substring(0, 90)}...
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-mono">
                          #{claim.id} · {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <span className="text-sm font-black text-on-surface">
                          {Math.round((claim.confidence || 0) * 100)}%
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 tracking-widest ${
                          claim.verdict === 'accurate' ? 'bg-green-100 text-green-800' :
                          claim.verdict === 'false' ? 'bg-red-100 text-red-800' :
                          claim.verdict === 'misleading' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {claim.verdict?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block mb-3">search_off</span>
                <p className="text-sm text-on-surface-variant">No verifications yet. Head to the dashboard to analyze a claim.</p>
                <a href="/dashboard" className="inline-block mt-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-dim">
                  Start Verifying →
                </a>
              </div>
            )}
          </section>

          {/* ── Account Info Panel ── */}
          <section className="space-y-4">
            {/* Account details */}
            <div className="bg-surface-container-lowest border border-surface-container-high p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-6">
                Account Details
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Member Since', value: memberSince, icon: 'calendar_today' },
                  { label: 'Auth Provider', value: providerIcon, icon: 'login' },
                  {
                    label: 'Email Verified',
                    value: firebaseUser?.emailVerified ? '✓ Verified' : '✕ Not Verified',
                    icon: 'verified',
                    valueClass: firebaseUser?.emailVerified ? 'text-green-600' : 'text-red-600',
                  },
                  { label: 'Account Role', value: (user?.role || 'user').toUpperCase(), icon: 'badge' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-0.5">{item.label}</p>
                      <p className={`text-xs font-bold ${item.valueClass || 'text-on-surface'}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Info (replaces UID card) */}
            <div className="bg-surface-container-low p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[14px] text-primary">manage_accounts</span>
                <p className="text-[9px] uppercase tracking-widest font-bold">Session Info</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-on-surface-variant">Account #</span>
                  <span className="font-mono text-on-surface">{user?.id || '—'}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-on-surface-variant">Email Status</span>
                  <span className={firebaseUser?.emailVerified ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>
                    {firebaseUser?.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-on-surface-variant">Auth Method</span>
                  <span className="text-on-surface">{providerIcon}</span>
                </div>
              </div>
            </div>

            {/* Security info */}
            <div className="bg-surface-container-low p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
                <p className="text-[9px] uppercase tracking-widest font-bold">Security</p>
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Firebase Auth · AES-256 GCM · Redis Session Tracking · Zero plaintext storage
              </p>
            </div>
          </section>
        </div>

        {/* ── Footer meta ── */}
        <footer className="pt-8 border-t border-outline-variant/20 flex justify-between items-center opacity-30 text-[9px] uppercase tracking-[0.2em]">
          <span>© 2025 B-ware Forensic Division · Proprietary & Confidential</span>
          <span>AES-256-GCM Active</span>
        </footer>
      </div>
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
