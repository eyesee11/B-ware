import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

const navItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "history", label: "Verification History", icon: Activity },
  { id: "distribution", label: "Verdict Distribution", icon: TrendingUp },
  { id: "trending", label: "Trending Rumours", icon: AlertTriangle },
  { id: "sources", label: "Source Credibility", icon: CheckCircle },
];

const overviewStats = [
  { label: "Total Claims Verified", value: 1247, icon: BarChart3, color: "from-blue-500 to-blue-600" },
  { label: "Accuracy Rate", value: 42, suffix: "%", icon: CheckCircle, color: "from-emerald-500 to-emerald-600" },
  { label: "Misleading %", value: 31, suffix: "%", icon: AlertTriangle, color: "from-amber-500 to-amber-600" },
  { label: "False %", value: 18, suffix: "%", icon: AlertTriangle, color: "from-red-500 to-red-600" },
  { label: "Avg Confidence", value: 0.84, icon: Activity, color: "from-purple-500 to-purple-600" },
];

const timelineData = [
  { month: "Jan", accurate: 45, misleading: 28, false: 12 },
  { month: "Feb", accurate: 52, misleading: 31, false: 15 },
  { month: "Mar", accurate: 48, misleading: 35, false: 18 },
  { month: "Apr", accurate: 61, misleading: 29, false: 14 },
  { month: "May", accurate: 58, misleading: 33, false: 20 },
  { month: "Jun", accurate: 65, misleading: 28, false: 16 },
];

const scatterData = Array.from({ length: 50 }, () => ({
  error: Math.random() * 100,
  confidence: Math.random(),
}));

const sourceLeaderboard = [
  { source: "World Bank", accuracy: 98, verifications: 456 },
  { source: "Reuters", accuracy: 94, verifications: 234 },
  { source: "IMF", accuracy: 92, verifications: 189 },
  { source: "Economic Times", accuracy: 87, verifications: 312 },
  { source: "NewsAPI", accuracy: 81, verifications: 567 },
];

function TrendAnalyticsPage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("overview");
  const [animatedStats, setAnimatedStats] = useState(overviewStats.map(() => 0));

  useEffect(() => {
    overviewStats.forEach((stat, index) => {
      setTimeout(() => {
        const target = typeof stat.value === "number" ? stat.value : 0;
        let current = 0;
        const increment = target / 30;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setAnimatedStats((prev) => {
            const newStats = [...prev];
            newStats[index] = current;
            return newStats;
          });
        }, 20);
      }, index * 100);
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Noise texture */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-black/50 backdrop-blur-xl border-r border-white/5 p-6 hidden lg:block">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <div className="text-white font-bold text-lg tracking-tight">B-ware</div>
            <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest -mt-1">
              Analytics
            </div>
          </div>
        </button>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeNav === item.id
                  ? "bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-500/30 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
              
              {activeNav === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-2 h-2 bg-blue-400 rounded-full"
                  transition={{ type: "spring", duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => navigate("/verify")}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            New Verification
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 px-6 py-6 backdrop-blur-xl bg-black/50 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-serif font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Trend Analytics Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-1">Real-time verification intelligence</p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none">
                <option>All Countries</option>
                <option>India</option>
                <option>USA</option>
              </select>
              <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none">
                <option>All Metrics</option>
                <option>GDP</option>
                <option>Inflation</option>
              </select>
              <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none">
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
              </select>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Overview Panel - Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {overviewStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 overflow-hidden group hover:border-white/20 transition-colors"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8 text-slate-400" />
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg opacity-20`} />
                  </div>
                  <div className="text-3xl font-mono font-bold text-white mb-1">
                    {animatedStats[index].toFixed(typeof stat.value === "number" && stat.value < 10 ? 2 : 0)}
                    {stat.suffix || ""}
                  </div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Timeline Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">Verification Timeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid #ffffff20",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="accurate" stroke="#22C55E" strokeWidth={2} />
                  <Line type="monotone" dataKey="misleading" stroke="#F59E0B" strokeWidth={2} />
                  <Line type="monotone" dataKey="false" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Scatter Plot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">Error vs Confidence</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="error" name="Error %" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="confidence" name="Confidence" stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid #ffffff20",
                      borderRadius: "8px",
                    }}
                  />
                  <Scatter data={scatterData} fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Source Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 lg:col-span-2"
            >
              <h3 className="text-lg font-semibold text-white mb-6">Source Credibility Leaderboard</h3>
              <div className="space-y-4">
                {sourceLeaderboard.map((source, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">{source.source}</span>
                        <span className="text-sm text-slate-400">{source.verifications} verifications</span>
                      </div>
                      <div className="relative h-2 bg-black/50 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${source.accuracy}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                      <div className="text-xs text-emerald-400 font-mono mt-1">{source.accuracy}% accuracy</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TrendAnalyticsPage;
