import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import api from "../../api/axios";

const supportedMetrics = [
  "GDP Growth",
  "Inflation",
  "Unemployment",
  "Fiscal Deficit",
  "Poverty Rate",
  "Population",
  "Per Capita Income",
  "Forex Reserves",
  "Current Account Deficit",
  "Literacy Rate",
];

const verificationDepths = [
  { id: "quick", label: "Quick", description: "Tier 1 - Numeric Check Only", time: "< 500ms" },
  { id: "full", label: "Full", description: "Adaptive - Dynamic Tier Selection", time: "2-4s" },
  { id: "deep", label: "Deep", description: "All 3 Tiers - Complete Analysis", time: "5-8s" },
];

function ClaimSubmissionPage() {
  const navigate = useNavigate();
  const [claim, setClaim] = useState("");
  const [selectedDepth, setSelectedDepth] = useState("full");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Real API call — picks the right endpoint based on verification depth.
  // "quick" = Tier 1 only (fastest, numeric check)
  // "full"  = Adaptive (backend decides which tiers to run)
  // "deep"  = All 3 tiers forced (most thorough but slowest)
  const handleSubmit = async () => {
    if (!claim.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const endpoint =
        selectedDepth === "quick" ? "/api/claims/quick"
        : selectedDepth === "deep" ? "/api/claims/deep"
        : "/api/claims/verify";

      const { data } = await api.post(endpoint, { text: claim });
      navigate(`/result/${data.claim_id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
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

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate("/analytics")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Analytics
            </button>
            <button onClick={() => navigate("/trending")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Trending
            </button>
            <button onClick={() => navigate("/analyze")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Analyze
            </button>
          </nav>
        </div>
      </header>

      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M 0 500 Q 200 400 400 450 T 800 420 L 1200 400 L 1600 430"
            stroke="#2563EB"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Main content */}
      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Heading */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-6xl font-serif font-bold text-white mb-6 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Verify a Claim.
              </h1>
              <p className="text-[17px] text-slate-400 mb-12 leading-relaxed">
                Paste a claim or paragraph to begin AI verification using real-time official datasets.
              </p>

              {/* Supported metrics grid */}
              <div className="mb-8">
                <h3 className="text-sm text-slate-500 uppercase tracking-wider mb-4">
                  Supported Economic Indicators
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {supportedMetrics.map((metric, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-500/30 transition-colors"
                    >
                      <div className="text-sm text-slate-300 group-hover:text-white transition-colors">
                        {metric}
                      </div>
                      
                      <motion.div
                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: "radial-gradient(circle at center, rgba(37, 99, 235, 0.1), transparent)",
                          filter: "blur(20px)",
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right: Input card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden group">
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(135deg, #2563EB, #22C55E, #2563EB)",
                      backgroundSize: "200% 200%",
                      padding: "2px",
                    }}
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="w-full h-full bg-black rounded-2xl" />
                  </motion.div>

                  <div className="relative z-10">
                    <div className="mb-6">
                      <label className="text-sm text-slate-400 mb-3 block">
                        Enter Claim to Verify
                      </label>
                      {error && (
                        <p className="text-red-400 text-sm mb-3">{error}</p>
                      )}
                      <textarea
                        value={claim}
                        onChange={(e) => setClaim(e.target.value)}
                        placeholder="e.g., &quot;India's GDP growth rate was 7.5% in 2024&quot;"
                        className="w-full h-40 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="text-sm text-slate-400 mb-3 block">
                        Verification Depth
                      </label>
                      <div className="grid grid-cols-3 gap-2 bg-black/50 p-2 rounded-xl">
                        {verificationDepths.map((depth) => (
                          <button
                            key={depth.id}
                            onClick={() => setSelectedDepth(depth.id)}
                            className="relative group"
                          >
                            <div
                              className={`relative z-10 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                                selectedDepth === depth.id
                                  ? "text-white"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {depth.label}
                            </div>
                            
                            {selectedDepth === depth.id && (
                              <motion.div
                                layoutId="activeDepth"
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-500/30 rounded-lg"
                                transition={{ type: "spring", duration: 0.6 }}
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      <motion.div
                        key={selectedDepth}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex items-center gap-2 text-xs text-slate-500"
                      >
                        <Info className="w-3 h-3" />
                        <span>
                          {verificationDepths.find((d) => d.id === selectedDepth)?.description}
                          {" · "}
                          {verificationDepths.find((d) => d.id === selectedDepth)?.time}
                        </span>
                      </motion.div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!claim.trim() || isSubmitting}
                      className="group relative w-full px-8 py-4 bg-transparent text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Processing...
                          </>
                        ) : (
                          <>
                            Run Verification
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>

                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-75 group-hover:opacity-100"
                        style={{
                          background: "linear-gradient(90deg, #2563EB, #22C55E, #2563EB)",
                          backgroundSize: "200% 100%",
                          padding: "2px",
                        }}
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <div className="w-full h-full bg-black rounded-xl" />
                      </motion.div>

                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          boxShadow: isSubmitting
                            ? ["0 0 20px rgba(37,99,235,0.3)", "0 0 40px rgba(37,99,235,0.6)", "0 0 20px rgba(37,99,235,0.3)"]
                            : "0 0 0px rgba(37,99,235,0)",
                        }}
                        transition={{ duration: 2, repeat: isSubmitting ? Infinity : 0 }}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClaimSubmissionPage;
