import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Server, Database, Zap, Activity, RefreshCw, Clock } from "lucide-react";

const systemNodes = [
  { id: 1, name: "API Gateway", status: "healthy", uptime: 99.9, avgResponse: "42ms", icon: Server },
  { id: 2, name: "MySQL Database", status: "healthy", uptime: 99.8, avgResponse: "18ms", icon: Database },
  { id: 3, name: "Redis Cache", status: "healthy", uptime: 99.99, avgResponse: "3ms", icon: Zap },
  { id: 4, name: "NLP Service", status: "degraded", uptime: 98.2, avgResponse: "240ms", icon: Activity },
  { id: 5, name: "World Bank API", status: "healthy", uptime: 97.5, avgResponse: "380ms", icon: Server },
  { id: 6, name: "Gemini API", status: "healthy", uptime: 99.1, avgResponse: "1200ms", icon: Activity },
];

const tierUsageStats = [
  { tier: "Tier 1", usage: 65, color: "from-blue-500 to-blue-600" },
  { tier: "Tier 2", usage: 28, color: "from-emerald-500 to-emerald-600" },
  { tier: "Tier 3", usage: 7, color: "from-purple-500 to-purple-600" },
];

const rateLimitStatus = {
  worldBank: { current: 234, limit: 1000, resetIn: "42m" },
  newsAPI: { current: 89, limit: 500, resetIn: "18m" },
  gemini: { current: 156, limit: 300, resetIn: "35m" },
  googleFactCheck: { current: 67, limit: 200, resetIn: "12m" },
};

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleForceRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

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
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg tracking-tight">B-ware</div>
              <div className="text-[10px] text-red-400 font-mono uppercase tracking-widest -mt-1">
                Admin Dashboard
              </div>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <motion.div
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs text-emerald-400 font-semibold">System Operational</span>
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

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Uptime:</span>
                          <span className="text-emerald-400 font-mono">{node.uptime}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Avg Response:</span>
                          <span className="text-blue-400 font-mono">{node.avgResponse}</span>
                        </div>
                      </div>
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

            {/* Rate Limit Monitor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6">API Rate Limit Monitor</h2>
              
              <div className="space-y-4">
                {Object.entries(rateLimitStatus).map(([api, data], index) => (
                  <div
                    key={index}
                    className="bg-black/30 rounded-xl p-4 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white font-semibold capitalize">
                        {api.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        Reset in {data.resetIn}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">
                        {data.current} / {data.limit} requests
                      </span>
                      <span className="text-xs font-mono text-blue-400">
                        {Math.round((data.current / data.limit) * 100)}%
                      </span>
                    </div>
                    
                    <div className="relative h-2 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          (data.current / data.limit) > 0.8
                            ? "bg-gradient-to-r from-red-500 to-orange-500"
                            : (data.current / data.limit) > 0.6
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                            : "bg-gradient-to-r from-blue-500 to-emerald-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.current / data.limit) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                      />
                    </div>
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

          {/* Redis Cache Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Redis Cache Performance</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black/30 rounded-xl p-5 border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Hit Rate</div>
                <div className="text-4xl font-mono font-bold text-emerald-400 mb-1">94.2%</div>
                <div className="text-xs text-slate-500">Excellent cache efficiency</div>
              </div>
              
              <div className="bg-black/30 rounded-xl p-5 border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Avg Latency</div>
                <div className="text-4xl font-mono font-bold text-blue-400 mb-1">3ms</div>
                <div className="text-xs text-slate-500">Well within SLA</div>
              </div>
              
              <div className="bg-black/30 rounded-xl p-5 border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Memory Usage</div>
                <div className="text-4xl font-mono font-bold text-amber-400 mb-1">68%</div>
                <div className="text-xs text-slate-500">2.7GB / 4GB allocated</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
