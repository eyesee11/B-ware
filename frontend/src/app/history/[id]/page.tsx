'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { claimsApi } from '@/services/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function ClaimDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [claim, setClaim] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params?.id) fetchClaim(params.id as string);
  }, [params?.id]);

  const fetchClaim = async (id: string) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await claimsApi.getById(id);
      setClaim(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load claim';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const verdictStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
    accurate:      { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-l-green-500',  label: 'Accurate' },
    false:         { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-l-red-500',    label: 'False' },
    misleading:    { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-l-yellow-500', label: 'Misleading' },
    unverifiable:  { bg: 'bg-gray-100',   text: 'text-gray-800',   border: 'border-l-gray-400',   label: 'Unverifiable' },
  };

  const vs = claim ? (verdictStyles[claim.verdict] || verdictStyles['unverifiable']) : verdictStyles['unverifiable'];

  return (
    <main className="md:pl-64 pt-16 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* Back Button */}
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface mb-10 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to History
        </button>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-surface-container-high animate-pulse rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 border border-red-200 rounded text-red-700">
            <p className="font-bold mb-1">Error Loading Claim</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : claim ? (
          <>
            {/* Header */}
            <header className={`mb-10 border-l-4 ${vs.border} pl-8`}>
              <div className="flex flex-wrap gap-3 items-center mb-4">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${vs.bg} ${vs.text}`}>
                  {vs.label}
                </span>
                <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">
                  Ref: #{claim.id}
                </span>
              </div>
              <h1 className="font-display text-4xl font-black text-on-surface tracking-tight leading-tight mb-4">
                Claim Analysis Report
              </h1>
              <p className="text-on-surface-variant text-sm">
                Submitted {new Date(claim.created_at).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })} at {new Date(claim.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </header>

            {/* Original Claim */}
            <section className="mb-8 bg-surface-container-lowest border border-surface-container-high p-8">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">
                Original Claim Submitted
              </h2>
              <blockquote className="text-lg leading-relaxed text-on-surface border-l-2 border-primary pl-6 italic">
                "{claim.original_text}"
              </blockquote>
            </section>

            {/* Verdict + Confidence */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Verdict', value: vs.label, sub: '', highlight: true },
                { label: 'Confidence', value: `${Math.round((claim.confidence || 0) * 100)}%`, sub: 'NLP score' },
                { label: 'Metric', value: claim.extracted_metric || 'N/A', sub: 'Detected metric' },
                { label: 'Tier Used', value: (claim.tier_used || 'N/A').toUpperCase(), sub: 'Analysis tier' },
              ].map((s, i) => (
                <div key={i} className="bg-surface-container-low p-6 border border-surface-container-high">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">{s.label}</p>
                  <p className={`text-2xl font-black tracking-tight ${s.highlight ? vs.text : 'text-on-surface'}`}>{s.value}</p>
                  {s.sub && <p className="text-[9px] text-on-surface-variant mt-1">{s.sub}</p>}
                </div>
              ))}
            </section>

            {/* Explanation */}
            {claim.explanation && (
              <section className="mb-8 bg-surface-container-lowest border border-surface-container-high p-8">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">
                  Analysis Explanation
                </h2>
                <p className="text-sm leading-relaxed text-on-surface">{claim.explanation}</p>
              </section>
            )}

            {/* Official vs Claimed Values */}
            {(claim.official_value || claim.claimed_value) && (
              <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 p-6">
                  <p className="text-[9px] uppercase tracking-widest text-green-700 font-bold mb-2">Official Value</p>
                  <p className="text-2xl font-black text-green-800">{claim.official_value || 'N/A'}</p>
                </div>
                <div className="bg-red-50 border border-red-200 p-6">
                  <p className="text-[9px] uppercase tracking-widest text-red-700 font-bold mb-2">Claimed Value</p>
                  <p className="text-2xl font-black text-red-800">{claim.claimed_value || 'N/A'}</p>
                </div>
                <div className="bg-surface-container-low border border-surface-container-high p-6">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">% Error</p>
                  <p className="text-2xl font-black text-on-surface">
                    {claim.pct_error != null ? `${parseFloat(claim.pct_error).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </section>
            )}

            {/* Evidence */}
            {(() => {
              let evidence: any[] = [];
              try {
                evidence = typeof claim.evidence_json === 'string'
                  ? JSON.parse(claim.evidence_json)
                  : (claim.evidence_json || []);
              } catch {}
              if (!evidence.length) return null;
              return (
                <section className="mb-8 bg-surface-container-lowest border border-surface-container-high p-8">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-6">
                    Supporting Evidence ({evidence.length})
                  </h2>
                  <div className="space-y-3">
                    {evidence.map((e: any, i: number) => (
                      <div key={i} className="p-4 bg-surface-container-low border-l-2 border-primary">
                        <p className="text-xs font-bold text-on-surface mb-1">{e.source || 'Unknown Source'}</p>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{e.snippet || e.title || 'No details available'}</p>
                        {e.url && (
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary font-bold uppercase tracking-widest mt-2 inline-block hover:underline"
                          >
                            View Source →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Footer Actions */}
            <footer className="flex gap-4 pt-8 border-t border-surface-container-highest">
              <button
                onClick={() => router.push('/history')}
                className="px-8 py-3 border border-outline text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                ← Back to History
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
              >
                Verify Another Claim
              </button>
            </footer>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function ClaimDetailPage() {
  return (
    <ProtectedRoute>
      <ClaimDetailContent />
    </ProtectedRoute>
  );
}
