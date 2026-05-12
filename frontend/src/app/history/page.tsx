'use client';

import { useState, useEffect } from 'react';
import { claimsApi } from '@/services/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function HistoryContent() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [verdict, setVerdict] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchClaims();
  }, [page, verdict]);

  const fetchClaims = async () => {
    setIsLoading(true);
    setError('');

    try {
      // For now, we'll fetch without verdict filter since API doesn't support it
      // TODO: Add verdict filter support to backend
      const response = await claimsApi.getHistory(page, 10);
      setClaims(response.claims || []);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load history';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'accurate':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-500' };
      case 'false':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500' };
      case 'misleading':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-500' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-500' };
    }
  };
  return (
    <main className="md:pl-64 pt-16 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">

        {/* Header */}
        <header className="mb-16">
          <h1 className="font-display text-5xl font-black text-on-surface mb-4 tracking-tight leading-tight">
            Verification History
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            A chronological archive of all submitted claims, forensic analysis results, and
            conclusive verdicts processed under current credentials.
          </p>
        </header>

        {/* Filters */}
        <section className="mb-12 p-1 bg-surface-container-low">
          <div className="bg-surface-container-lowest p-6 flex flex-wrap items-end gap-8">
            <div className="flex-1 min-w-[200px]">
              <label className="block uppercase tracking-[0.05em] text-[10px] font-bold text-on-surface-variant mb-3">
                Verdict Classification
              </label>
              <div className="flex gap-2 flex-wrap">
                {["All Records", "accurate", "misleading", "false"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setVerdict(filter === 'All Records' ? '' : filter)}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      (filter === 'All Records' && !verdict) || verdict === filter
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                    }`}
                  >
                    {filter === 'All Records' ? 'All Records' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Entries */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : claims.length > 0 ? (
            claims.map((claim) => {
              const colors = getVerdictColor(claim.verdict);
              return (
                <div
                  key={claim.id}
                  className={`group bg-surface-container-lowest hover:bg-white transition-all flex flex-col md:flex-row items-stretch border-l-4 ${colors.border}`}
                >
                  <div className="flex-1 p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <span
                        className={`uppercase tracking-[0.1em] text-[10px] font-black ${colors.color} px-2 py-0.5 ${colors.bg}`}
                      >
                        {claim.verdict?.toUpperCase() || 'UNVERIFIABLE'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">
                        Ref: {claim.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-on-surface mb-2 leading-snug">
                      "{claim.original_text.length > 100 ? claim.original_text.substring(0, 100) + '...' : claim.original_text}"
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-4">Metric: {claim.extracted_metric || 'N/A'}</p>
                    
                    {claim.explanation && (
                      <div className="bg-surface-container p-4 mb-6 text-sm text-on-surface-variant">
                        <span className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-on-surface">Explanation</span>
                        {claim.explanation}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-8 border-t border-surface-container pt-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">
                          Verification Date
                        </span>
                        <span className="text-xs font-bold">
                          {new Date(claim.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">
                          Confidence Score
                        </span>
                        <span className="text-xs font-bold">{Math.round((claim.confidence || 0) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-48 bg-surface-container-low flex flex-col items-center justify-center p-6 gap-3 group-hover:bg-primary-container transition-colors">
                    <a
                      href={`/history/${claim.id}`}
                      className="w-full py-3 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest text-center hover:bg-primary-dim transition-all"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              <p className="text-sm">No claims found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && (
          <footer className="mt-16 flex justify-between items-center border-t border-surface-container-highest pt-8">
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
              Showing {(page - 1) * pagination.limit + 1}-{Math.min(page * pagination.limit, pagination.total)} of {pagination.total} Investigations
            </div>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center border text-sm ${
                    page === i + 1
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant hover:bg-surface-container text-on-surface'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              {pagination.pages > 5 && (
                <>
                  <span className="w-10 h-10 flex items-center justify-center text-on-surface-variant">
                    ...
                  </span>
                  <button
                    onClick={() => setPage(pagination.pages)}
                    className="w-10 h-10 flex items-center justify-center border border-outline-variant hover:bg-surface-container text-on-surface text-sm"
                  >
                    {pagination.pages}
                  </button>
                </>
              )}
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
