'use client';

import { useState, useEffect, useRef } from 'react';
import { trendingApi, outletsApi, claimsApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

function TrendingContent() {
  const { token } = useAuth();
  const initializationRef = useRef(false);
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [topStory, setTopStory] = useState<any>(null);
  const [availableOutlets, setAvailableOutlets] = useState<string[]>([]);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [verifyingStoryId, setVerifyingStoryId] = useState<number | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    // Prevent double initialization in React StrictMode (development)
    if (initializationRef.current) return;
    initializationRef.current = true;

    loadOutlets();
    fetchTrending();
  }, []);

  useEffect(() => {
    // Refetch when outlets change
    if (selectedOutlets.length >= 0 && initializationRef.current) {
      fetchTrending();
    }
  }, [selectedOutlets]);

  useEffect(() => {
    // Set timestamp on client side to avoid hydration mismatch
    const now = new Date();
    setCurrentDate(now.toISOString().split('T')[0]);
    setCurrentTime(now.toLocaleTimeString());
  }, []);

  const loadOutlets = async () => {
    try {
      // Load available outlets
      const availableData = await outletsApi.getAvailable();
      setAvailableOutlets(availableData.outlets || []);

      // Load user's saved outlets if authenticated
      if (token) {
        try {
          const userData = await outletsApi.getUserOutlets(token);
          if (userData.outlets && userData.outlets.length > 0) {
            setSelectedOutlets(userData.outlets);
          } else {
            setSelectedOutlets(availableData.outlets || []);
          }
        } catch {
          // Fallback to all outlets
          setSelectedOutlets(availableData.outlets || []);
        }
      } else {
        // Not authenticated, select all outlets by default
        setSelectedOutlets(availableData.outlets || []);
      }
    } catch (err) {
      console.error('Failed to load outlets:', err);
      setSelectedOutlets([]);
    }
  };

  const handleOutletChange = async (outlet: string, checked: boolean) => {
    let newOutlets: string[];
    if (checked) {
      newOutlets = [...selectedOutlets, outlet];
    } else {
      newOutlets = selectedOutlets.filter(o => o !== outlet);
    }
    setSelectedOutlets(newOutlets);

    // Save to backend if authenticated
    if (token) {
      try {
        await outletsApi.updateUserOutlets(newOutlets, token);
      } catch (err) {
        console.error('Failed to save outlet preferences:', err);
      }
    }
  };

  const fetchTrending = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await trendingApi.getTrending('all', 20, selectedOutlets.length > 0 ? selectedOutlets : undefined);
      const allStories = response.stories || [];
      console.log('Trending stories fetched:', allStories);
      console.log('First story:', allStories[0]);
      setStories(allStories);
      if (allStories.length > 0) {
        setTopStory(allStories[0]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load trending stories';
      console.error('Trending fetch error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (dangerScore: number) => {
    if (dangerScore >= 75) return { label: 'High Risk', color: 'text-red-600', border: 'bg-red-500' };
    if (dangerScore >= 50) return { label: 'Moderate Risk', color: 'text-yellow-600', border: 'bg-yellow-500' };
    return { label: 'Low Risk', color: 'text-green-600', border: 'bg-green-500' };
  };

  const handleVerifyClaim = async (story: any) => {
    console.log('Verify button clicked, story:', story);
    setVerifyingStoryId(story.id);
    setIsVerifying(true);
    setVerificationError('');
    setVerificationResult(null);

    try {
      const text = (story.claim_text || story.headline || '') as string;
      console.log('Sending verification request with text:', text);
      const result = await claimsApi.verify(text, token || undefined);
      console.log('Verification result:', result);
      setVerificationResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify claim';
      console.error('Verification error:', err);
      setVerificationError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const closeVerificationModal = () => {
    setVerifyingStoryId(null);
    setVerificationResult(null);
    setVerificationError('');
  };

  return (
    <main className="ml-64 pt-16 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-12 py-16">

        {/* Header */}
        <div className="mb-20">
          <span className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold border-l-2 border-primary pl-4">
            Real-Time Surveillance
          </span>
          <h1 className="font-display text-6xl mt-6 text-on-surface tracking-tight">
            Trending Rumours
          </h1>
          <p className="mt-6 text-on-surface-variant max-w-2xl leading-relaxed text-lg">
            High-precision indexing of emerging economic narratives. Ranked by algorithmic risk
            detection and societal transmission rate.
          </p>
        </div>

        {/* Outlet Filter */}
        <div className="mb-12 bg-surface-container-low p-6 rounded-lg border border-outline-variant">
          <div className="mb-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              Filter by News Outlets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {availableOutlets.map((outlet) => (
                <label key={outlet} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOutlets.includes(outlet)}
                    onChange={(e) => handleOutletChange(outlet, e.target.checked)}
                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface">{outlet}</span>
                </label>
              ))}
            </div>
          </div>
          {selectedOutlets.length > 0 && (
            <div className="text-[10px] text-on-surface-variant">
              {selectedOutlets.length} outlet{selectedOutlets.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Bento Grid */}
        {topStory && (
          <div className="grid grid-cols-12 gap-8 mb-16">
            {/* Critical Alert */}
            <div className="col-span-8 bg-surface-container-lowest p-10 relative overflow-hidden group border border-transparent hover:border-outline-variant transition-all">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <span className={`${topStory.danger_score >= 75 ? 'bg-red-600' : topStory.danger_score >= 50 ? 'bg-yellow-600' : 'bg-green-600'} text-white px-3 py-1 text-[10px] font-bold uppercase tracking-tighter`}>
                    {topStory.danger_score >= 75 ? 'Critical' : topStory.danger_score >= 50 ? 'Elevated' : 'Moderate'} Alert
                  </span>
                  <div className="mt-8 flex items-end gap-2">
                    <span className="font-display text-8xl leading-none">{Math.round(topStory.danger_score || 0)}</span>
                    <span className="text-xl font-bold pb-2">Danger Score</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-red-600 text-4xl">warning</span>
              </div>
              <h2 className="font-display text-3xl mb-4 leading-tight">
                {topStory.headline || topStory.claim_text}
              </h2>
              <p className="text-on-surface-variant mb-8">
                {topStory.official_value ? `Official value: ${topStory.official_value}. Claimed: ${topStory.claimed_value}` : topStory.explanation || 'Emerging narrative with rapid transmission.'}
              </p>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">
                    Source
                  </div>
                  <div className="font-display text-2xl truncate">{topStory.source_name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">
                    Verdict
                  </div>
                  <div className="font-display text-2xl">{topStory.verdict?.toUpperCase() || 'PENDING'}</div>
                </div>
                <button 
                  onClick={() => handleVerifyClaim(topStory)}
                  disabled={isVerifying && verifyingStoryId === topStory.id}
                  className="ml-auto bg-primary text-on-primary px-8 py-3 font-bold uppercase text-xs tracking-widest hover:bg-primary-dim transition-all disabled:opacity-50">
                  {isVerifying && verifyingStoryId === topStory.id ? 'Verifying...' : 'Verify Claim'}
                </button>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="col-span-4 flex flex-col gap-8">
              <div className="bg-inverse-surface text-on-primary p-8 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-8">
                  Danger Trend
                </div>
                <div className="h-24 flex items-end gap-1 mb-4">
                  {stories.slice(0, 6).map((s, i) => (
                    <div key={i} className="bg-primary-container w-full" style={{ height: `${Math.min((s.danger_score || 0) / 100 * 100, 100)}%` }} />
                  ))}
                </div>
                <div className="font-display text-3xl">{topStory.danger_score || 0}%</div>
                <div className="text-[10px] mt-1 opacity-60">
                  Highest danger score in feed
                </div>
              </div>
              <div className="bg-surface-container p-8 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-8">
                  Feed Metrics
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <span className="text-sm font-medium">Total Stories</span>
                    <span className="font-display">{stories.length}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <span className="text-sm font-medium">Critical</span>
                    <span className="font-display">{stories.filter(s => (s.danger_score || 0) >= 75).length}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span className="font-display text-sm">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-8 border-b border-surface-container-highest pb-4">
            <h3 className="font-display text-2xl">Active Surveillance Feed</h3>
            <button onClick={fetchTrending} className="text-[10px] font-bold uppercase tracking-widest border border-outline px-4 py-2 hover:bg-surface-container transition-colors">
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          ) : stories.length > 0 ? (
            stories.slice(1).map((story, i) => {
              const riskInfo = getRiskColor(story.danger_score || 0);
              const timeAgoMs = new Date().getTime() - new Date(story.published_at || story.fetched_at).getTime();
              const timeAgo = timeAgoMs < 3600000 ? `${Math.floor(timeAgoMs / 60000)}m ago` : `${Math.floor(timeAgoMs / 3600000)}h ago`;

              return (
                <div
                  key={i}
                  className="group grid grid-cols-12 items-center bg-surface-container-low hover:bg-surface-container-lowest transition-all p-6 gap-6 relative"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${riskInfo.border}`}></div>
                  <div className="col-span-1 text-center">
                    <div className="font-display text-3xl">{Math.round(story.danger_score || 0)}</div>
                    <div className="text-[9px] font-bold uppercase text-on-surface-variant">Danger</div>
                  </div>
                  <div className="col-span-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${riskInfo.color}`}>
                        {riskInfo.label}
                      </span>
                      <span className="h-1 w-1 bg-outline-variant rounded-full"></span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {timeAgo}
                      </span>
                    </div>
                    <h4 className="font-semibold text-lg tracking-tight truncate">{story.headline || story.claim_text}</h4>
                  </div>
                  <div className="col-span-2 text-center border-l border-outline-variant/20">
                    <div className="font-display text-xl">{story.source_name}</div>
                    <div className="text-[9px] font-bold uppercase text-on-surface-variant">Source</div>
                  </div>
                  <div className="col-span-3 flex justify-end gap-3">
                    {story.source_url ? (
                      <a 
                        href={story.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest hover:bg-outline-variant transition-colors"
                      >
                        Details
                      </a>
                    ) : (
                      <button 
                        disabled
                        className="px-6 py-2 bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest opacity-50 cursor-not-allowed"
                      >
                        Details
                      </button>
                    )}
                    <button 
                      onClick={() => handleVerifyClaim(story)}
                      disabled={isVerifying && verifyingStoryId === story.id}
                      className="px-6 py-2 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50"
                    >
                      {isVerifying && verifyingStoryId === story.id ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              <p className="text-sm">No trending stories available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-16 border-t border-surface-container-highest flex justify-between items-end">
          <div className="max-w-md">
            <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
              B-WARE
            </span>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Forensic Archive &amp; Economic Surveillance Unit
            </p>
            <p className="mt-2 text-[10px] text-on-surface-variant opacity-60">
              All data is subject to verification protocols 10.4-B.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2">Timestamp</div>
            <div className="font-display text-xl">{currentDate} // {currentTime} UTC</div>
          </div>
        </footer>
      </div>

      {/* Verification Results Modal */}
      {verifyingStoryId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-outline-variant">
            <div className="sticky top-0 bg-surface-container p-6 border-b border-outline-variant flex justify-between items-center">
              <h2 className="text-2xl font-bold">Verification Result</h2>
              <button 
                onClick={closeVerificationModal}
                className="text-2xl text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isVerifying && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-on-surface-variant">Verifying claim with NLP service...</p>
                </div>
              )}

              {verificationError && (
                <div className="p-4 bg-red-50 border border-red-300 rounded text-red-700">
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{verificationError}</p>
                </div>
              )}

              {verificationResult && !isVerifying && (
                <>
                  {/* Claim */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Original Claim
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {stories.find(s => s.id === verifyingStoryId)?.claim_text || stories.find(s => s.id === verifyingStoryId)?.headline}
                    </p>
                  </div>

                  {/* Verdict */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                        Verdict
                      </h3>
                      <div className={`inline-block px-4 py-2 rounded font-bold uppercase text-sm ${
                        verificationResult.verdict === 'accurate' ? 'bg-green-100 text-green-700' :
                        verificationResult.verdict === 'misleading' ? 'bg-yellow-100 text-yellow-700' :
                        verificationResult.verdict === 'false' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {verificationResult.verdict?.toUpperCase() || 'UNVERIFIABLE'}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                        Confidence
                      </h3>
                      <div className="text-2xl font-bold">
                        {Math.round((verificationResult.confidence || 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {verificationResult.explanation && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                        Explanation
                      </h3>
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        {verificationResult.explanation}
                      </p>
                    </div>
                  )}

                  {/* Evidence */}
                  {verificationResult.evidence && verificationResult.evidence.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                        Evidence
                      </h3>
                      <div className="space-y-2">
                        {verificationResult.evidence.map((e: any, i: number) => (
                          <div key={i} className="p-3 bg-surface-container-low rounded text-sm">
                            <p className="font-medium">{e.source || 'Unknown Source'}</p>
                            <p className="text-on-surface-variant text-xs mt-1">{e.snippet || e.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  {(verificationResult.official_value || verificationResult.extracted_value) && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-on-surface-variant">Official Value</p>
                        <p className="text-lg font-bold">{verificationResult.official_value || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-on-surface-variant">Claimed Value</p>
                        <p className="text-lg font-bold">{verificationResult.extracted_value || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={closeVerificationModal}
                    className="w-full px-6 py-3 bg-primary text-on-primary font-bold uppercase text-sm tracking-widest hover:bg-primary-dim transition-colors"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TrendingPage() {
  return (
    <TrendingContent />
  );
}
