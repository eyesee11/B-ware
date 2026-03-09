import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronDown, Download, FileText, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const mockResult = {
  claim: "India's GDP growth rate was 7.5% in 2024",
  credibilityScore: 72,
  verdict: "Misleading",
  claimedValue: 7.5,
  officialValue: 6.49,
  percentageError: 15.48,
  tierUsed: "Full (Adaptive)",
  
  tier1: {
    source: "World Bank API",
    matchStatus: "Partial Match",
    confidence: 0.89,
  },
  
  tier2: {
    articles: [
      {
        source: "Reuters",
        headline: "India's GDP grows 6.5% in Q4 2024",
        nliVerdict: "Contradict",
        confidence: 0.82,
      },
      {
        source: "Economic Times",
        headline: "World Bank revises India growth forecast to 6.49%",
        nliVerdict: "Contradict",
        confidence: 0.91,
      },
    ],
  },
  
  tier3: {
    llmExplanation: "The claim states India's GDP growth was 7.5%, but official World Bank data shows 6.49% for 2024. This represents a 15.48% error margin. Multiple news sources corroborate the official figure. The claim appears to round up optimistically or cite unofficial projections.",
  },
};

const historicalData = [
  { year: "2020", claimed: 5.2, official: 4.8 },
  { year: "2021", claimed: 6.8, official: 6.2 },
  { year: "2022", claimed: 7.1, official: 6.8 },
  { year: "2023", claimed: 7.3, official: 6.7 },
  { year: "2024", claimed: 7.5, official: 6.49 },
];

const verdictDistribution = [
  { name: "Accurate", value: 42, color: "#22C55E" },
  { name: "Misleading", value: 31, color: "#F59E0B" },
  { name: "False", value: 18, color: "#EF4444" },
  { name: "Unverifiable", value: 9, color: "#94A3B8" },
];

function CredibilityResultPage() {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScore(mockResult.credibilityScore);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Accurate": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "Misleading": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "False": return "text-red-400 border-red-500/30 bg-red-500/10";
      default: return "text-slate-400 border-slate-500/30 bg-slate-500/10";
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

          <button
            onClick={() => navigate("/verify")}
            className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            New Verification
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Verdict Card - Hero Component */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5" />

            <div className="relative z-10">
              <div className="mb-8">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Verified Claim
                </div>
                <h1
                  className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  "{mockResult.claim}"
                </h1>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-sm text-slate-400 mb-3">Credibility Score</div>
                  <motion.div
                    className="text-7xl font-mono font-bold text-blue-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {score}%
                  </motion.div>
                </div>

                <div className="flex items-center">
                  <div className={`inline-flex items-center gap-2 px-6 py-3 border rounded-xl text-lg font-semibold ${getVerdictColor(mockResult.verdict)}`}>
                    <AlertCircle className="w-5 h-5" />
                    {mockResult.verdict}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">Claimed</div>
                  <div className="text-2xl font-mono font-bold text-blue-400">
                    {mockResult.claimedValue}%
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">Official</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {mockResult.officialValue}%
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">Error</div>
                  <div className="text-2xl font-mono font-bold text-red-400">
                    {mockResult.percentageError}%
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">Tier Used</div>
                  <div className="text-sm font-semibold text-white mt-1">
                    {mockResult.tierUsed}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-2">
                    Claimed: {mockResult.claimedValue}%
                  </div>
                  <motion.div
                    className="h-3 bg-blue-500/40 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-2">
                    Official: {mockResult.officialValue}%
                  </div>
                  <motion.div
                    className="h-3 bg-emerald-500/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "86.5%" }}
                    transition={{ duration: 1, delay: 0.7 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Evidence Section - Accordion */}
          <div className="space-y-4">
            <h2 className="text-[28px] font-serif font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Verification Evidence
            </h2>

            {/* Tier 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedTier(expandedTier === 1 ? null : 1)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Tier 1: Numeric Check</div>
                    <div className="text-xs text-slate-400">{mockResult.tier1.source}</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedTier === 1 ? "rotate-180" : ""}`} />
              </button>

              {expandedTier === 1 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-6 pb-6 border-t border-white/10"
                >
                  <div className="pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Match Status:</span>
                      <span className="text-amber-400 font-semibold">{mockResult.tier1.matchStatus}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="text-emerald-400 font-mono">{mockResult.tier1.confidence}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Tier 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedTier(expandedTier === 2 ? null : 2)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Tier 2: NLI Evidence Check</div>
                    <div className="text-xs text-slate-400">{mockResult.tier2.articles.length} sources analyzed</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedTier === 2 ? "rotate-180" : ""}`} />
              </button>

              {expandedTier === 2 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-6 pb-6 border-t border-white/10"
                >
                  <div className="pt-4 space-y-4">
                    {mockResult.tier2.articles.map((article, i) => (
                      <div key={i} className="bg-black/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-white text-sm">{article.source}</div>
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            article.nliVerdict === "Contradict" 
                              ? "bg-red-500/10 border border-red-500/30 text-red-400"
                              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          }`}>
                            {article.nliVerdict}
                          </div>
                        </div>
                        <div className="text-sm text-slate-400 mb-2">{article.headline}</div>
                        <div className="text-xs text-slate-500">
                          Confidence: <span className="text-emerald-400 font-mono">{article.confidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Tier 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedTier(expandedTier === 3 ? null : 3)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Tier 3: LLM Reasoning</div>
                    <div className="text-xs text-slate-400">Gemini 1.5 Flash Analysis</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedTier === 3 ? "rotate-180" : ""}`} />
              </button>

              {expandedTier === 3 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-6 pb-6 border-t border-white/10"
                >
                  <div className="pt-4">
                    <div className="relative bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="absolute inset-0 opacity-50 pointer-events-none" style={{
                        background: "radial-gradient(circle at top right, rgba(139, 92, 246, 0.1), transparent)",
                      }} />
                      <p className="relative text-sm text-slate-300 leading-relaxed">
                        {mockResult.tier3.llmExplanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Infographics Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[28px] font-serif font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Visual Context
              </h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:border-white/20 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  PNG
                </button>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:border-white/20 transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-sm font-semibold text-white mb-4">Historical Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000",
                        border: "1px solid #ffffff20",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="claimed" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="official" stroke="#22C55E" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-sm font-semibold text-white mb-4">Verdict Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={verdictDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {verdictDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000",
                        border: "1px solid #ffffff20",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CredibilityResultPage;
