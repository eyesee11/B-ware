import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../../api/axios";

// No more mockResult — we fetch real data from the backend.

const verdictDistribution = [
  { name: "Accurate", value: 42, color: "#22C55E" },
  { name: "Misleading", value: 31, color: "#F59E0B" },
  { name: "False", value: 18, color: "#EF4444" },
  { name: "Unverifiable", value: 9, color: "#94A3B8" },
];

function CredibilityResultPage() {
  const navigate = useNavigate();
  // useParams() reads the ":id" from the URL, e.g. /result/42 → id = "42"
  // This is exactly like req.params.id in Express.
  const { id } = useParams();

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);

  // Fetch the real claim result when the page loads (or when id changes)
  useEffect(() => {
    api.get(`/api/claims/${id}`)
      .then(({ data }) => {
        setResult(data);
        // Animate the score after a short delay for visual effect
        setTimeout(() => setScore(Math.round((data.confidence ?? 0) * 100)), 500);
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Parse evidence JSON safely — the backend stores evidence as a JSON string
  const evidence = (() => {
    if (!result?.evidence_json) return [];
    try {
      return typeof result.evidence_json === "string"
        ? JSON.parse(result.evidence_json)
        : result.evidence_json;
    } catch {
      return [];
    }
  })();

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
            <img src="/logo.png" alt="B-ware logo" className="w-10 h-10 rounded-xl object-contain" />
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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
          />
        </div>
      )}

      {/* Not found state */}
      {!loading && !result && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <AlertCircle className="w-12 h-12 text-slate-500" />
          <p className="text-slate-400">Claim not found</p>
          <button onClick={() => navigate("/verify")} className="text-blue-400 hover:text-blue-300">
            Verify a new claim →
          </button>
        </div>
      )}

      {/* Main content — only rendered when we have real data */}
      {!loading && result && (
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
                  "{result.claim_text}"
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
                  <div className={`inline-flex items-center gap-2 px-6 py-3 border rounded-xl text-lg font-semibold ${getVerdictColor(result.verdict)}`}>
                    <AlertCircle className="w-5 h-5" />
                    {result.verdict}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">Claimed</div>
                  <div className="text-2xl font-mono font-bold text-blue-400">
                    {result.claimed_value ?? "—"}
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">Official</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {result.official_value ?? "—"}
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">Error</div>
                  <div className="text-2xl font-mono font-bold text-red-400">
                    {result.percentage_error != null ? `${result.percentage_error.toFixed(2)}%` : "—"}
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">Tier Used</div>
                  <div className="text-sm font-semibold text-white mt-1">
                    {result.tier_used ?? "Adaptive"}
                  </div>
                </div>
              </div>

              {result.claimed_value != null && result.official_value != null && (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-2">
                    Claimed: {result.claimed_value}
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
                    Official: {result.official_value}
                  </div>
                  <motion.div
                    className="h-3 bg-emerald-500/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (result.official_value / result.claimed_value) * 100)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.7 }}
                  />
                </div>
              </div>
              )}
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
                    <div className="text-xs text-slate-400">World Bank API</div>
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
                      <span className="text-slate-400">Claimed Value:</span>
                      <span className="text-blue-400 font-mono">{result.claimed_value ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Official Value:</span>
                      <span className="text-emerald-400 font-mono">{result.official_value ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="text-emerald-400 font-mono">{result.confidence != null ? (result.confidence * 100).toFixed(1) + "%" : "—"}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Tier 2 — NLI Evidence */}
            {evidence.length > 0 && (
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
                    <div className="text-xs text-slate-400">{evidence.length} sources analyzed</div>
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
                    {evidence.map((article: any, i: number) => (
                      <div key={i} className="bg-black/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-white text-sm">{article.source}</div>
                          {article.nli_label && (
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            article.nli_label === "contradiction"
                              ? "bg-red-500/10 border border-red-500/30 text-red-400"
                              : article.nli_label === "entailment"
                              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                              : "bg-slate-500/10 border border-slate-500/30 text-slate-400"
                          }`}>
                            {article.nli_label}
                          </div>
                          )}
                        </div>
                        {article.title && <div className="text-sm text-slate-400 mb-2">{article.title}</div>}
                        {article.nli_score != null && (
                        <div className="text-xs text-slate-500">
                          Confidence: <span className="text-emerald-400 font-mono">{(article.nli_score * 100).toFixed(0)}%</span>
                        </div>
                        )}
                        {article.url && (
                          <a href={article.url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs mt-1 block">
                            View source →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
            )}

            {/* Tier 3 — LLM Explanation */}
            {result.explanation && (
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
                      <p className="relative text-sm text-slate-300 leading-relaxed">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
            )}
          </div>

          {/* Verdict Distribution (static chart — keep for visual context) */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[28px] font-serif font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Visual Context
              </h2>
            </div>

            <div className="grid md:grid-cols-1 gap-6">
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
      )}
    </div>
  );
}

export default CredibilityResultPage;
