import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";

const sources = [
  "Reuters",
  "AltNews",
  "FactCheck.org",
  "NewsAPI",
  "World Bank",
  "Google Fact Check",
  "Economic Times",
  "Bloomberg",
];

const mockRumours = [
  {
    id: 1,
    headline: "Fiscal deficit hits 10% in Q2 2024",
    dangerScore: 82,
    confidence: 0.71,
    sources: 4,
    timeDetected: "2 hours ago",
    trending: true,
  },
  {
    id: 2,
    headline: "Unemployment rate drops to 3.2%",
    dangerScore: 68,
    confidence: 0.64,
    sources: 3,
    timeDetected: "5 hours ago",
    trending: true,
  },
  {
    id: 3,
    headline: "Inflation reaches all-time high of 15%",
    dangerScore: 91,
    confidence: 0.88,
    sources: 6,
    timeDetected: "8 hours ago",
    trending: true,
  },
  {
    id: 4,
    headline: "GDP growth accelerates to 9% annually",
    dangerScore: 54,
    confidence: 0.59,
    sources: 2,
    timeDetected: "12 hours ago",
    trending: false,
  },
  {
    id: 5,
    headline: "Poverty rate reduced by 50% this year",
    dangerScore: 77,
    confidence: 0.73,
    sources: 5,
    timeDetected: "1 day ago",
    trending: false,
  },
];

function TrendingRumoursPage() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }, 2000);
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
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
            <button onClick={() => navigate("/verify")} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-500/20 transition-colors">
              Verify Claim
            </button>
          </nav>
        </div>
      </header>

      {/* Animated scrolling ticker */}
      <div className="fixed top-20 left-0 right-0 overflow-hidden border-b border-red-500/10 bg-red-500/5">
        <div className="flex">
          <motion.div
            className="flex gap-12 whitespace-nowrap py-3"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...sources, ...sources, ...sources].map((source, index) => (
              <div key={index} className="flex items-center gap-12">
                <span className="text-xs font-mono text-red-400/50">
                  {source}
                </span>
                <span className="text-red-500/30">•</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Moving red gradient wave background */}
      <motion.div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle 1000px at 50% 50%, rgba(239, 68, 68, 0.5), transparent)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
        }}
      />

      {/* Main content */}
      <main className="relative pt-40 pb-20 px-4">
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

            {/* Live refresh indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6 mt-6"
            >
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Feed
              </button>
              
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <motion.div
                  className="w-2 h-2 bg-red-400 rounded-full"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </motion.div>
          </div>

          {/* Rumour cards */}
          <div className="space-y-6">
            {mockRumours.map((rumour, index) => (
              <motion.div
                key={rumour.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative backdrop-blur-xl border rounded-2xl p-8 overflow-hidden group cursor-pointer hover:border-red-500/30 transition-colors ${
                  rumour.dangerScore >= 70
                    ? "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {rumour.dangerScore >= 70 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50" />
                )}

                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <AlertTriangle className={`w-8 h-8 flex-shrink-0 mt-1 ${
                      rumour.dangerScore >= 70 ? "text-red-400" : "text-amber-400"
                    }`} />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {rumour.trending && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 font-semibold mb-2">
                              <TrendingUp className="w-3 h-3" />
                              Trending
                            </div>
                          )}
                          <h3
                            className="text-2xl font-serif font-bold text-white"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {rumour.headline}
                          </h3>
                        </div>
                        <div className="text-xs text-slate-500">{rumour.timeDetected}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Danger Score
                      </div>
                      <div className="flex items-baseline gap-2">
                        <motion.div
                          className="text-5xl font-mono font-bold"
                          style={{
                            color: rumour.dangerScore >= 70 ? "#EF4444" : 
                                   rumour.dangerScore >= 50 ? "#F59E0B" : "#22C55E"
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {rumour.dangerScore}
                        </motion.div>
                        <span className={`text-sm font-semibold ${getDangerLevel(rumour.dangerScore).color}`}>
                          {getDangerLevel(rumour.dangerScore).label}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Confidence
                      </div>
                      <div className="text-5xl font-mono font-bold text-amber-400">
                        {rumour.confidence}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Sources
                      </div>
                      <div className="text-5xl font-mono font-bold text-blue-400">
                        {rumour.sources}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                      Threat Level
                    </div>
                    <div className="relative h-3 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getDangerColor(rumour.dangerScore)} rounded-full`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${rumour.dangerScore}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.1 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ["-100%", "200%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TrendingRumoursPage;
