import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { AlertCircle, Search } from "lucide-react";
import api from "../../api/axios";

interface SentenceResult {
  sentence: string;
  claim_probability: number;
  extraction?: {
    metric?: string;
    value?: number;
    year?: number;
    confidence?: number;
  };
  // populated after user clicks "Verify"
  verifyResult?: { claim_id: number; verdict: string; confidence: number };
  verifying?: boolean;
}

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [results, setResults] = useState<SentenceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 10) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      // Try the backend proxy route first; fall back to per-sentence verify
      const { data } = await api.post("/api/claims/analyze", { text });
      setResults(data.results ?? []);
    } catch (err: any) {
      // If the backend doesn't have /analyze yet, split & verify individually
      if (err.response?.status === 404) {
        const sentences = text
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 10);

        const sentenceResults: SentenceResult[] = sentences.map((s) => ({
          sentence: s,
          claim_probability: 0,
        }));

        // Verify each sentence
        const verified = await Promise.all(
          sentences.map(async (s) => {
            try {
              const { data } = await api.post("/api/claims/verify", { text: s });
              return {
                sentence: s,
                claim_probability: 1,
                verifyResult: {
                  claim_id: data.claim_id,
                  verdict: data.verdict,
                  confidence: data.confidence,
                },
              } as SentenceResult;
            } catch {
              return { sentence: s, claim_probability: 0 } as SentenceResult;
            }
          })
        );
        setResults(verified);
      } else {
        setError(err.response?.data?.error || "Analysis failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySentence = async (index: number) => {
    const sentence = results[index];
    if (!sentence || sentence.verifyResult || sentence.verifying) return;

    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, verifying: true } : r))
    );

    try {
      const { data } = await api.post("/api/claims/verify", {
        text: sentence.sentence,
      });
      setResults((prev) =>
        prev.map((r, i) =>
          i === index
            ? {
                ...r,
                verifying: false,
                verifyResult: {
                  claim_id: data.claim_id,
                  verdict: data.verdict,
                  confidence: data.confidence,
                },
              }
            : r
        )
      );
    } catch {
      setResults((prev) =>
        prev.map((r, i) => (i === index ? { ...r, verifying: false } : r))
      );
    }
  };

  const verdictColor = (v: string) => {
    switch (v.toLowerCase()) {
      case "accurate":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "misleading":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "false":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-6 backdrop-blur-xl bg-black/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <img
              src="/logo.png"
              alt="B-ware logo"
              className="w-10 h-10 rounded-xl object-contain"
            />
            <div>
              <div className="text-white font-bold text-lg tracking-tight">
                B-ware
              </div>
              <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest -mt-1">
                No Lies Told
              </div>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/verify")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Verify
            </button>
            <button onClick={() => navigate("/trending")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Trending
            </button>
            <button onClick={() => navigate("/analytics")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Analytics
            </button>
          </div>
        </div>
      </header>

      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-3">
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Paragraph Analyzer
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Paste a paragraph and we'll split it into sentences, score each
              for claim probability, and let you verify any flagged claims
              through our 3-tier NLP pipeline.
            </p>
          </div>

          {/* Textarea */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 2000))}
              placeholder="Paste a paragraph containing claims you'd like to analyze..."
              className="w-full bg-transparent text-white placeholder-white/30 resize-none outline-none min-h-[160px] text-lg"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-slate-500">
                {text.length} / 2000
              </span>
              <button
                onClick={handleAnalyze}
                disabled={loading || text.trim().length < 10}
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Sentence Analysis
              </h2>

              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5"
                >
                  <p className="text-white text-sm mb-3">"{r.sentence}"</p>

                  {/* Claim probability bar */}
                  {r.claim_probability > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Claim Probability</span>
                        <span>{(r.claim_probability * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            r.claim_probability > 0.7
                              ? "bg-gradient-to-r from-red-500 to-red-400"
                              : r.claim_probability > 0.4
                              ? "bg-gradient-to-r from-amber-500 to-amber-400"
                              : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          }`}
                          style={{
                            width: `${r.claim_probability * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Extraction details */}
                  {r.extraction && r.extraction.metric && (
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                      <span>
                        Metric:{" "}
                        <span className="text-white font-mono">
                          {r.extraction.metric}
                        </span>
                      </span>
                      {r.extraction.value != null && (
                        <span>
                          Value:{" "}
                          <span className="text-blue-400 font-mono">
                            {r.extraction.value}
                          </span>
                        </span>
                      )}
                      {r.extraction.year != null && (
                        <span>
                          Year:{" "}
                          <span className="text-emerald-400 font-mono">
                            {r.extraction.year}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Verify / Result */}
                  {r.verifyResult ? (
                    <button
                      onClick={() =>
                        navigate(`/result/${r.verifyResult!.claim_id}`)
                      }
                      className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold ${verdictColor(r.verifyResult.verdict)}`}
                    >
                      {r.verifyResult.verdict} —{" "}
                      {(r.verifyResult.confidence * 100).toFixed(0)}% confidence
                      → View details
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerifySentence(i)}
                      disabled={r.verifying}
                      className="px-4 py-2 text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 disabled:opacity-40 transition-colors"
                    >
                      {r.verifying ? "Verifying..." : "Verify this claim"}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
