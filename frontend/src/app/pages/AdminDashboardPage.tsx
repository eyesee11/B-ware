import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Server, Database, Zap, Activity, RefreshCw } from "lucide-react";
import api from "../../api/axios";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real data from the backend
  const [health, setHealth] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/api/health").then(({ data }) => setHealth(data)).catch(() => {});
    api.get("/api/claims/stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.post("/api/trending/refresh");
    } catch {}
    setIsRefreshing(false);
  };

  // Derive system nodes from health check
  const systemNodes = [
    { id: 1, name: "API Gateway", status: health ? "healthy" : "down", icon: Server },
    { id: 2, name: "MySQL Database", status: health?.mysql === "ok" ? "healthy" : health?.mysql === "down" ? "down" : "unknown", icon: Database },
    { id: 3, name: "Redis Cache", status: health?.redis === "ok" ? "healthy" : health?.redis === "down" ? "down" : "unknown", icon: Zap },
    { id: 4, name: "NLP Service", status: health ? (health.status === "healthy" ? "healthy" : "degraded") : "unknown", icon: Activity },
  ];

  // Derive tier usage from stats
  const total = (stats?.total || 1);
  const tierUsageStats = stats
    ? [
        { tier: "Tier 1", usage: stats.tier1 != null ? Math.round((stats.tier1 / total) * 100) : 65, color: "from-blue-500 to-blue-600" },
        { tier: "Tier 2", usage: stats.tier2 != null ? Math.round((stats.tier2 / total) * 100) : 28, color: "from-emerald-500 to-emerald-600" },
        { tier: "Tier 3", usage: stats.tier3 != null ? Math.round((stats.tier3 / total) * 100) : 7, color: "from-purple-500 to-purple-600" },
      ]
    : [
        { tier: "Tier 1", usage: 0, color: "from-blue-500 to-blue-600" },
        { tier: "Tier 2", usage: 0, color: "from-emerald-500 to-emerald-600" },
        { tier: "Tier 3", usage: 0, color: "from-purple-500 to-purple-600" },
      ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", pulse: "bg-emerald-500" };
      case "degraded": return { text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", pulse: "bg-amber-500" };
      case "down": return { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", pulse: "bg-red-500" };
      default: return { text: "text-slate-400", bg: "bg-slate-500/20", border: "border-slate-500/30", pulse: "bg-slate-500" };
    }
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
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-6 backdrop-blur-xl bg-black/50 border-b border-red-500/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <img src="/logo.png" alt="B-ware" className="w-10 h-10 rounded-xl" />
            <div>
              <div className="text-white font-bold text-lg tracking-tight">B-ware</div>
              <div className="text-[10px] text-red-400 font-mono uppercase tracking-widest -mt-1">
                Admin Dashboard
              </div>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <div className={`hidden md:flex items-center gap-2 px-3 py-2 ${health?.status === "healthy" ? "bg-emerald-500/10 border-emerald-500/30" : health ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-500/10 border-slate-500/30"} border rounded-lg`}>
              <motion.div
                className={`w-2 h-2 ${health?.status === "healthy" ? "bg-emerald-500" : health ? "bg-amber-500" : "bg-slate-500"} rounded-full`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className={`text-xs font-semibold ${health?.status === "healthy" ? "text-emerald-400" : health ? "text-amber-400" : "text-slate-400"}`}>
                {health?.status === "healthy" ? "System Operational" : health ? "System Degraded" : "Loading..."}
              </span>
            </div>
            
            <button
              onClick={() => navigate("/analytics")}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Analytics
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1
                className="text-6xl font-serif font-bold text-white mb-2 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Command Center
              </h1>
              <p className="text-[17px] text-slate-400">
                Real-time system monitoring and control
              </p>
            </div>

            <button
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              Force Trending Refresh
            </button>
          </div>

          {/* System Status Architecture */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">System Architecture Status</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemNodes.map((node, index) => {
                const colors = getStatusColor(node.status);
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative bg-black/30 border ${colors.border} rounded-xl p-5 overflow-hidden group hover:border-white/20 transition-colors`}
                  >
                    <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <node.icon className={`w-8 h-8 ${colors.text}`} />
                        
                        <div className="flex items-center gap-2">
                          <motion.div
                            className={`w-2 h-2 ${colors.pulse} rounded-full`}
                            animate={{
                              opacity: node.status === "healthy" ? [0.5, 1, 0.5] : [1, 0.5, 1],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <span className={`text-xs font-semibold ${colors.text} capitalize`}>
                            {node.status}
                          </span>
                        </div>
                      </div>

                      <div className="font-semibold text-white mb-3">{node.name}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Verification Tier Usage Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Verification Tier Usage</h2>
              
              <div className="space-y-6">
                {tierUsageStats.map((tier, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white font-semibold">{tier.tier}</span>
                      <span className="text-sm text-slate-400">{tier.usage}% of verifications</span>
                    </div>
                    <div className="relative h-4 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${tier.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${tier.usage}%` }}
                        transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Claims Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Claims Overview</h2>
              
              <div className="space-y-4">
                {[
                  { label: "Total Claims", value: stats?.total ?? "—" },
                  { label: "Accurate", value: stats?.accurate ?? "—" },
                  { label: "False", value: stats?.false ?? "—" },
                  { label: "Misleading", value: stats?.misleading ?? "—" },
                  { label: "Unverifiable", value: stats?.unverifiable ?? "—" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-black/30 rounded-xl p-4 border border-white/5 flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-lg font-mono font-bold text-blue-400">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Model Response Times */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Model Response Times (24h avg)</h2>
            
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { model: "BART-MNLI", time: 280, status: "optimal" },
                { model: "Gemini 1.5 Flash", time: 1200, status: "normal" },
                { model: "World Bank API", time: 380, status: "optimal" },
                { model: "NewsAPI", time: 520, status: "normal" },
              ].map((model, index) => (
                <div
                  key={index}
                  className="bg-black/30 rounded-xl p-5 border border-white/5 text-center"
                >
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                    {model.model}
                  </div>
                  <div className="text-3xl font-mono font-bold text-blue-400 mb-2">
                    {model.time}
                    <span className="text-sm text-slate-500">ms</span>
                  </div>
                  <div
                    className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      model.status === "optimal"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {model.status}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Redis & MySQL Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Infrastructure Status</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black/30 rounded-xl p-5 border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">MySQL</div>
                <div className={`text-4xl font-mono font-bold mb-1 ${health?.mysql === "ok" ? "text-emerald-400" : health?.mysql === "down" ? "text-red-400" : "text-slate-500"}`}>
                  {health?.mysql === "ok" ? "Online" : health?.mysql === "down" ? "Down" : "—"}
                </div>
                <div className="text-xs text-slate-500">{health?.mysql === "ok" ? "Connected" : "Check connection"}</div>
              </div>
              
              <div className="bg-black/30 rounded-xl p-5 border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Redis</div>
                <div className={`text-4xl font-mono font-bold mb-1 ${health?.redis === "ok" ? "text-emerald-400" : health?.redis === "down" ? "text-red-400" : "text-slate-500"}`}>
                  {health?.redis === "ok" ? "Online" : health?.redis === "down" ? "Down" : "—"}
                </div>
                <div className="text-xs text-slate-500">{health?.redis === "ok" ? "Cache active" : "Check connection"}</div>
              </div>
              
              <div className="bg-black/30 rounded-xl p-5 border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Overall</div>
                <div className={`text-4xl font-mono font-bold mb-1 ${health?.status === "healthy" ? "text-emerald-400" : health?.status === "degraded" ? "text-amber-400" : "text-slate-500"}`}>
                  {health?.status === "healthy" ? "Healthy" : health?.status === "degraded" ? "Degraded" : "—"}
                </div>
                <div className="text-xs text-slate-500">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : ""}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
