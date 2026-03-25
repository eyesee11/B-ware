'use client';

import { useState, useEffect } from 'react';
import { claimsApi } from '@/services/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AnalyticsContent() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await claimsApi.getStats();
      setStats(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const bars = [20, 35, 30, 50, 45, 70, 60, 85, 75, 90, 65, 40, 55, 80, 95, 70, 60, 40, 30, 45, 50];

  return (
    <main className="ml-64 min-h-screen p-12 bg-background">
      {/* Header */}
      <header className="mb-16">
        <span className="text-[10px] tracking-[0.3em] text-primary uppercase font-bold mb-4 block">
          Archive Intel / v2.4
        </span>
        <h2 className="text-5xl font-black font-display tracking-tight text-on-surface">
          User Analytics
        </h2>
        <div className="w-24 h-1.5 bg-primary mt-6"></div>
      </header>

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
          {/* High-Level Stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-px bg-surface-container-highest mb-20">
            {[
              { 
                label: "Total Claims Verified", 
                val: stats?.total || "0", 
                trend: "All time", 
                up: true 
              },
              { 
                label: "Accuracy Rate", 
                val: stats?.total > 0 ? `${((stats?.accurate || 0) / stats.total * 100).toFixed(1)}%` : "0%", 
                trend: "Calculated", 
                up: null 
              },
              { 
                label: "Misleading Claims", 
                val: stats?.misleading || "0", 
                trend: `${stats?.misleading || 0} claims`, 
                up: false 
              },
              { 
                label: "False Claims", 
                val: stats?.false || "0", 
                trend: `${stats?.false || 0} claims`, 
                up: false 
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-white p-8 group">
                <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-bold mb-6">
                  {stat.label}
                </p>
                <h3 className="text-4xl font-black font-display text-on-surface group-hover:text-primary transition-colors">
                  {stat.val}
                </h3>
                <div
                  className={`mt-4 flex items-center text-xs font-bold ${
                    stat.up === true
                      ? "text-green-600"
                      : stat.up === false
                      ? "text-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm mr-1">
                    {stat.up === true ? "arrow_upward" : stat.up === false ? "verified" : "horizontal_rule"}
                  </span>
                  {stat.trend}
                </div>
              </div>
            ))}
          </section>

          {/* Mid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
            {/* Verdict Distribution */}
            <div className="lg:col-span-1 space-y-8">
              <h4 className="text-xl font-black font-display text-on-surface border-l-4 border-primary pl-4">
                Verdict Distribution
              </h4>
              <div className="bg-surface-container-low p-8 h-80 flex flex-col justify-center">
                <div className="space-y-6">
                  {[
                    { 
                      label: "Accurate", 
                      pct: stats?.total > 0 ? ((stats?.accurate || 0) / stats.total * 100) : 0, 
                      color: "bg-green-600", 
                      textColor: "text-green-600" 
                    },
                    { 
                      label: "Misleading", 
                      pct: stats?.total > 0 ? ((stats?.misleading || 0) / stats.total * 100) : 0, 
                      color: "bg-yellow-600", 
                      textColor: "text-yellow-600" 
                    },
                    { 
                      label: "False", 
                      pct: stats?.total > 0 ? ((stats?.false || 0) / stats.total * 100) : 0, 
                      color: "bg-red-600", 
                      textColor: "text-red-600" 
                    },
                    { 
                      label: "Unverifiable", 
                      pct: stats?.total > 0 ? ((stats?.unverifiable || 0) / stats.total * 100) : 0, 
                      color: "bg-gray-400", 
                      textColor: "text-gray-600" 
                    },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span>{item.label}</span>
                        <span className={item.textColor}>{item.pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-surface-container-highest">
                        <div
                          className={`h-full ${item.color}`}
                          style={{ width: `${Math.max(item.pct, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verification Timeline */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex justify-between items-baseline">
                <h4 className="text-xl font-black font-display text-on-surface border-l-4 border-primary pl-4">
                  Verification Timeline
                </h4>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">
                  Activity Distribution
                </span>
              </div>
              <div className="bg-surface-container-low p-8 h-80 relative flex items-end justify-between space-x-1">
                <div className="w-full h-full flex items-end justify-around px-2 pb-8">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className="w-2 bg-primary transition-all hover:bg-primary-dim"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
                <div className="absolute inset-x-8 bottom-4 flex justify-between text-[9px] font-bold text-on-surface-variant tracking-tighter uppercase">
                  <span>Start</span>
                  <span>Mid</span>
                  <span>End</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Source Credibility - Simplified */}
            <div className="lg:col-span-2 space-y-8">
              <h4 className="text-xl font-black font-display text-on-surface border-l-4 border-primary pl-4">
                Statistics Summary
              </h4>
              <div className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high">
                      {["Metric", "Value", "Ratio"].map((h) => (
                        <th
                          key={h}
                          className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant last:text-right"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {[
                      { metric: "Total Claims", value: stats?.total || 0, ratio: "100%" },
                      { metric: "Accurate", value: stats?.accurate || 0, ratio: stats?.total > 0 ? `${((stats?.accurate || 0) / stats.total * 100).toFixed(1)}%` : "0%" },
                      { metric: "Misleading", value: stats?.misleading || 0, ratio: stats?.total > 0 ? `${((stats?.misleading || 0) / stats.total * 100).toFixed(1)}%` : "0%" },
                    ].map((row) => (
                      <tr key={row.metric} className="bg-white hover:bg-surface-container-low transition-colors">
                        <td className="p-4 font-bold text-on-surface">{row.metric}</td>
                        <td className="p-4 font-medium">{row.value}</td>
                        <td className="p-4 text-right">
                          <span className="px-2 py-1 font-bold text-[10px] bg-green-100 text-green-700">
                            {row.ratio}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Indicators */}
            <div className="lg:col-span-1 space-y-8">
              <h4 className="text-xl font-black font-display text-on-surface border-l-4 border-primary pl-4">
                Stats Summary
              </h4>
              <div className="space-y-4">
                {[
                  { indicator: "Total", frequency: stats?.total || "0" },
                  { indicator: "Avg Confidence", frequency: stats?.avg_confidence ? `${(Math.round(parseFloat(stats.avg_confidence) * 100))}%` : "0%" },
                  { indicator: "Status", frequency: stats?.total > 0 ? "Active" : "Idle" },
                ].map((item) => (
                  <div
                    key={item.indicator}
                    className="bg-surface-container-low p-6 flex items-center justify-between group cursor-pointer hover:bg-primary transition-colors"
                  >
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary-container">
                        {item.indicator}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black font-display text-on-surface group-hover:text-white mt-1">
                        {item.frequency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer meta */}
          <footer className="mt-32 pt-12 border-t border-surface-container-highest flex justify-between items-center text-on-surface-variant">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  Server Status: Optimal
                </span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest">
                Session Encryption: AES-256
              </div>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest">
              © 2024 B-WARE Forensic Systems. All Claims Logged.
            </div>
          </footer>
        </>
      )}
    </main>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
