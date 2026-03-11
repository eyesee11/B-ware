import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";
import api from "../../api/axios";

const VERDICT_CHIPS = ["all", "false", "misleading", "accurate", "unverifiable"] as const;

const chipColors: Record<string, string> = {
  all: "bg-white/10 text-white border-white/20",
  false: "bg-red-500/20 text-red-400 border-red-500/30",
  misleading: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  accurate: "bg-green-500/20 text-green-400 border-green-500/30",
  unverifiable: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

function TrendingRumoursPage() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"danger" | "recency">("danger");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchTrending = useCallback(() => {
    const params: Record<string, string> = {};
    if (filter !== "all") params.verdict = filter;
    api.get("/api/trending", { params }).then(({ data }) => {
      let sorted = data.stories ?? data ?? [];
      if (sort === "recency") {
        sorted = [...sorted].sort(
          (a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        );
      }
      setStories(sorted);
      setLastUpdate(new Date());
    }).catch(() => {});
  }, [filter, sort]);

  // Fetch on mount + poll every 5 minutes
  useEffect(() => {
    fetchTrending();
    const interval = setInterval(fetchTrending, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTrending]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTrending();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getDangerColor = (score: number) => {
    if (score >= 70) return "from-red-500 to-orange-500";
    if (score >= 50) return "from-amber-500 to-yellow-500";
    return "from-blue-500 to-emerald-500";
  };

  const getDangerLevel = (score: number) => {
    if (score >= 70) return { label: "High", color: "text-red-400" };
    if (score >= 50) return { label: "Medium", color: "text-amber-400" };
    return { label: "Low", color: "text-emerald-400" };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Noise texture */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />

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
            <button onClick={() => navigate("/analytics")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Analytics
            </button>
            <button onClick={() => navigate("/sources")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Sources
            </button>
            <button onClick={() => navigate("/verify")} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-500/20 transition-colors">
              Verify Claim
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-serif font-bold text-white mb-4 tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Trending Misinformation
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[17px] text-slate-400"
            >
              Real-time tracking of high-risk economic claims
            </motion.p>

            {/* Controls row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-4 mt-6"
            >
              {/* Filter chips */}
              <div className="flex flex-wrap gap-2">
                {VERDICT_CHIPS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilter(v)}
                    className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border transition-colors ${
                      filter === v
                        ? chipColors[v] + " border-current"
                        : "border-white/10 text-white/40 hover:text-white/70"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Sort toggle */}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setSort("danger")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    sort === "danger"
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  Danger Score
                </button>
                <button
                  onClick={() => setSort("recency")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    sort === "recency"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      : "border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  Recency
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <motion.div
                  className="w-2 h-2 bg-red-400 rounded-full"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {lastUpdate.toLocaleTimeString()}
              </div>
            </motion.div>
          </div>

          {/* Empty state */}
          {stories.length === 0 && !isRefreshing && (
            <div className="text-center py-20 text-slate-500">
              No trending stories found for this filter.
            </div>
          )}

          {/* Story cards */}
          <div className="space-y-6">
            {stories.map((story: any, index: number) => {
              const dangerScore = story.danger_score ?? 0;
              const fmtTime = story.published_at
                ? (() => {
                    const h = (Date.now() - new Date(story.published_at).getTime()) / 3600000;
                    if (h < 1) return "Just now";
                    if (h < 24) return `${Math.floor(h)}h ago`;
                    return `${Math.floor(h / 24)}d ago`;
                  })()
                : "";

              return (
              <motion.div
                key={story.id ?? index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative backdrop-blur-xl border rounded-2xl p-8 overflow-hidden group cursor-pointer hover:border-red-500/30 transition-colors ${
                  dangerScore >= 70
                    ? "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {dangerScore >= 70 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50" />
                )}

                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <AlertTriangle className={`w-8 h-8 flex-shrink-0 mt-1 ${
                      dangerScore >= 70 ? "text-red-400" : "text-amber-400"
                    }`} />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {dangerScore >= 60 && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 font-semibold mb-2">
                              <TrendingUp className="w-3 h-3" />
                              Trending
                            </div>
                          )}
                          <h3
                            className="text-2xl font-serif font-bold text-white"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {story.headline}
                          </h3>
                        </div>
                        <div className="text-xs text-slate-500">{fmtTime}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Danger Score
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div
                          className="text-5xl font-mono font-bold"
                          style={{
                            color: dangerScore >= 70 ? "#EF4444" : dangerScore >= 50 ? "#F59E0B" : "#22C55E"
                          }}
                        >
                          {dangerScore}
                        </div>
                        <span className={`text-sm font-semibold ${getDangerLevel(dangerScore).color}`}>
                          {getDangerLevel(dangerScore).label}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Confidence
                      </div>
                      <div className="text-5xl font-mono font-bold text-amber-400">
                        {story.confidence != null ? story.confidence.toFixed(2) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Source
                      </div>
                      <div className="text-lg font-semibold text-blue-400 truncate">
                        {story.source_name ?? "—"}
                      </div>
                      {story.verdict && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          story.verdict === "false" ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : story.verdict === "misleading" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : story.verdict === "accurate" ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/30"
                        }`}>
                          {story.verdict}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                      Threat Level
                    </div>
                    <div className="relative h-3 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getDangerColor(dangerScore)} rounded-full`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${dangerScore}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.1 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Low Risk</span>
                      <span>High Risk</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TrendingRumoursPage;
