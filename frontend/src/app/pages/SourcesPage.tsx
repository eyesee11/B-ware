import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import api from "../../api/axios";

interface Source {
  source_name: string;
  total_claims: number;
  accurate_count: number;
  misleading_count: number;
  false_count: number;
  avg_danger_score: number;
}

export default function SourcesPage() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/trending/sources")
      .then(({ data }) => setSources(data.sources ?? data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-6 backdrop-blur-xl bg-black/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <img src="/logo.png" alt="B-ware logo" className="w-10 h-10 rounded-xl object-contain" />
            <div>
              <div className="text-white font-bold text-lg tracking-tight">B-ware</div>
              <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest -mt-1">
                No Lies Told
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate("/trending")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Trending
            </button>
            <button onClick={() => navigate("/analytics")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Analytics
            </button>
          </nav>
        </div>
      </header>

      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Source Credibility
          </h1>
          <p className="text-slate-400 mb-10">
            News publishers ranked by their average danger score and false-claim
            rate, as judged by the NLP RAV pipeline.
          </p>

          {loading && (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
              />
            </div>
          )}

          {!loading && sources.length === 0 && (
            <p className="text-center text-slate-500 py-20">No source data available yet.</p>
          )}

          {!loading && sources.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-5 py-4 text-slate-400 font-semibold">#</th>
                    <th className="text-left px-5 py-4 text-slate-400 font-semibold">Source</th>
                    <th className="text-right px-5 py-4 text-slate-400 font-semibold">Claims</th>
                    <th className="text-right px-5 py-4 text-slate-400 font-semibold">Accurate %</th>
                    <th className="text-right px-5 py-4 text-slate-400 font-semibold">False %</th>
                    <th className="text-right px-5 py-4 text-slate-400 font-semibold">Avg Danger</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s, i) => {
                    const total = s.total_claims || 1;
                    const accuratePct = ((s.accurate_count / total) * 100).toFixed(1);
                    const falsePct = ((s.false_count / total) * 100).toFixed(1);

                    return (
                      <motion.tr
                        key={s.source_name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-5 py-4 text-slate-500 font-mono">{i + 1}</td>
                        <td className="px-5 py-4 font-semibold text-white">{s.source_name}</td>
                        <td className="px-5 py-4 text-right font-mono text-slate-300">{s.total_claims}</td>
                        <td className="px-5 py-4 text-right font-mono text-emerald-400">{accuratePct}%</td>
                        <td className="px-5 py-4 text-right font-mono text-red-400">{falsePct}%</td>
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`font-mono font-bold ${
                              s.avg_danger_score >= 70
                                ? "text-red-400"
                                : s.avg_danger_score >= 40
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {s.avg_danger_score?.toFixed(0) ?? "—"}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
