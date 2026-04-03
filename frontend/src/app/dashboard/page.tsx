'use client';

import { useState } from 'react';
import { claimsApi } from '@/services/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function DashboardContent() {
  const [claimText, setClaimText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);

  const handleAnalyzeClaim = async () => {
    setError('');
    setIsLoading(true);
    setBatchResults(null);

    try {
      const response = await claimsApi.verify(claimText);
      setResult(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchVerify = async () => {
    setError('');
    setIsLoading(true);
    setResult(null);
    
    console.log("🔹 Batch verify triggered");
    console.log("   Text length:", claimText.length);

    try {
      // Split by newlines and filter empty lines
      const claims = claimText
        .split('\n')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      console.log("   Claims count:", claims.length);
      console.log("   Claims:", claims);

      if (claims.length === 0) {
        const msg = 'Please enter at least one claim (one per line)';
        setError(msg);
        setIsLoading(false);
        console.log("❌", msg);
        return;
      }

      if (claims.length > 50) {
        const msg = 'Maximum 50 claims per batch';
        setError(msg);
        setIsLoading(false);
        console.log("❌", msg);
        return;
      }

      console.log("📤 Calling API...");
      const response = await claimsApi.batch(claims);
      console.log("✅ Response received:", response);
      setBatchResults(response);
      setIsBatchMode(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Batch verification failed. Please try again.';
      setError(message);
      console.error("❌ Batch error:", message);
      console.error("Full error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="md:pl-64 pt-16 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">

        {/* Page Header */}
        <header className="mb-12">
          <div className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            Workspace / Verification Hub
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-on-surface">Forensic Archive</h1>
        </header>

        {/* Input Section */}
        <section className="mb-16">
          <div className="bg-surface-container-lowest p-8 border border-surface-container-high">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex justify-between items-end mb-4">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">
                {isBatchMode ? 'Batch Claims (One per line)' : 'Input Economic Claim'}
              </label>
              <span className="text-[0.625rem] text-outline">Characters: {claimText.length}/5000</span>
            </div>
            <textarea
              value={claimText}
              onChange={(e) => setClaimText(e.target.value.slice(0, 5000))}
              maxLength={5000}
              className="w-full h-48 bg-transparent border-b-2 border-surface-container-highest focus:border-primary focus:ring-0 resize-none font-display text-lg text-on-surface placeholder:text-surface-variant p-0 leading-relaxed outline-none"
              placeholder={isBatchMode ? "Enter one economic claim per line...\nExample:\nIndia's GDP growth rate was 7.5% in 2024\nInflation rate stood at 4.8% in January 2024" : "Paste the statement or paragraph for analysis here..."}
              disabled={isLoading}
            />
            <div className="flex gap-4 mt-8">
              <button 
                onClick={handleAnalyzeClaim}
                disabled={isLoading || !claimText.trim()}
                className="px-10 py-4 bg-primary text-on-primary font-bold uppercase text-xs tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-sm">autorenew</span>
                    Analyzing...
                  </>
                ) : (
                  'Analyze Claims'
                )}
              </button>
              <button 
                onClick={handleBatchVerify}
                disabled={isLoading || !claimText.trim()}
                className="px-10 py-4 bg-surface-container-high text-on-surface font-bold uppercase text-xs tracking-widest hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-sm">autorenew</span>
                    Processing...
                  </>
                ) : (
                  'Batch Verify'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Batch Results */}
        {batchResults ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest">
                Batch Verification Results
              </h2>
              <div className="flex gap-4 text-xs font-bold">
                <div className="text-green-600">✓ {batchResults.successful} Successful</div>
                {batchResults.failed > 0 && <div className="text-red-600">✕ {batchResults.failed} Failed</div>}
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {batchResults.results.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`bg-surface-container-lowest border-l-4 p-4 shadow-sm ${
                    item.error
                      ? 'border-red-500'
                      : item.verdict === 'accurate'
                      ? 'border-green-500'
                      : item.verdict === 'misleading'
                      ? 'border-yellow-500'
                      : 'border-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug text-on-surface mb-1">
                        {item.original_text}
                      </p>
                      {item.error && (
                        <p className="text-xs text-red-600 font-medium">{item.error}</p>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0 text-2xl font-black tracking-tighter">
                      {item.error ? '—' : `${Math.round((item.confidence ?? 0) * 100)}%`}
                    </div>
                  </div>

                  {!item.error && (
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-surface-container-low text-xs">
                      <div>
                        <div className="font-bold uppercase text-on-surface-variant mb-1">Verdict</div>
                        <div className="font-bold">{(item.verdict ?? 'UNVERIFIABLE').toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="font-bold uppercase text-on-surface-variant mb-1">Metric</div>
                        <div className="font-bold">{item.extracted_metric || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-bold uppercase text-on-surface-variant mb-1">Year</div>
                        <div className="font-bold">{item.extracted_year || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setBatchResults(null);
                setClaimText('');
              }}
              className="px-6 py-3 bg-primary text-on-primary font-bold uppercase text-xs tracking-widest hover:bg-primary-dim transition-colors"
            >
              Clear & Start Over
            </button>
          </div>
        ) : (
          // Single Result View
          result ? (
            <div className="grid grid-cols-12 gap-6">
              {/* Left: Extracted Units */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-black uppercase tracking-widest">
                    Verification Results
                  </h2>
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs font-bold uppercase ${result.verdict === 'accurate' ? 'text-green-600' : result.verdict === 'misleading' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {result.verdict?.toUpperCase() ?? 'UNVERIFIABLE'}
                    </span>
                  </div>
                </div>

                <div className={`bg-surface-container-lowest border-l-4 p-6 shadow-sm ${result.verdict === 'accurate' ? 'border-green-500' : result.verdict === 'misleading' ? 'border-yellow-500' : 'border-red-500'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-lg font-medium leading-snug max-w-2xl">
                      {result.original_text}
                    </p>
                    <div className="text-right ml-4 shrink-0">
                      <div className="text-2xl font-black tracking-tighter">
                        {Math.round((result.confidence ?? 0) * 100)}%
                      </div>
                      <div className="text-[10px] font-bold uppercase text-on-surface-variant">
                        Confidence
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-8 pt-6 border-t border-surface-container-low">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Metric</div>
                      <div className="text-sm font-bold tracking-tight">{result.extracted_metric}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Claimed Value</div>
                      <div className="text-sm font-bold tracking-tight">{result.claimed_value}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Official Value</div>
                      <div className="text-sm font-bold tracking-tight">{result.official_value}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Year</div>
                      <div className="text-sm font-bold tracking-tight">{result.extracted_year}</div>
                    </div>
                  </div>
                </div>

                {result.explanation && (
                  <div className="bg-surface-container-low p-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Explanation</h4>
                    <p className="text-sm leading-relaxed">{result.explanation}</p>
                  </div>
                )}
              </div>

              {/* Right: Confidence panel */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-inverse-surface text-white p-8">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-8 text-outline-variant">
                    Analysis Details
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-outline-variant text-xs uppercase font-bold block mb-1">Verdict</span>
                      <span className="font-bold text-base">{result.verdict?.toUpperCase() ?? 'UNVERIFIABLE'}</span>
                    </div>
                    <div>
                      <span className="text-outline-variant text-xs uppercase font-bold block mb-1">Confidence</span>
                      <span className="font-bold text-base">{Math.round((result.confidence ?? 0) * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-outline-variant text-xs uppercase font-bold block mb-1">Tier Used</span>
                      <span className="font-bold text-base">{result.tier_used?.toUpperCase() ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-outline-variant text-xs uppercase font-bold block mb-1">Error %</span>
                      <span className="font-bold text-base">{result.percentage_error ? result.percentage_error.toFixed(2) : 'N/A'}%</span>
                    </div>
                  </div>
                </div>

                {result.evidence && result.evidence.length > 0 && (
                  <div className="bg-surface-container-low p-6">
                    <h3 className="text-[0.625rem] font-black uppercase tracking-widest mb-4 text-on-surface-variant">
                      Evidence Used
                    </h3>
                    <div className="space-y-3">
                      {result.evidence.map((e: any, idx: number) => (
                        <div key={idx} className="text-xs bg-surface-container-lowest p-3 rounded">
                          <div className="font-bold text-on-surface mb-1">{e.source}</div>
                          <div className="text-on-surface-variant line-clamp-2">{e.snippet}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-12 text-on-surface-variant">
                <p className="text-sm">Submit a claim above to begin analysis</p>
              </div>
            )
          )
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
