import { motion } from "motion/react";
import { Database, Search, Brain } from "lucide-react";

const tiers = [
  {
    number: 1,
    title: "Numeric Check",
    icon: Database,
    features: ["World Bank API", "< 500ms", "% error classification"],
    color: "from-blue-500 to-blue-600",
  },
  {
    number: 2,
    title: "NLI Evidence Check",
    icon: Search,
    features: ["NewsAPI", "Google Fact Check", "BART-MNLI contradiction detection"],
    color: "from-emerald-500 to-emerald-600",
  },
  {
    number: 3,
    title: "LLM Reasoning",
    icon: Brain,
    features: ["Gemini 1.5 Flash", "Multi-source reasoning", "Structured JSON verdict"],
    color: "from-purple-500 to-purple-600",
  },
];

const verdictRules = [
  { range: "<5%", verdict: "Accurate", color: "text-emerald-400" },
  { range: "5–20%", verdict: "Misleading", color: "text-amber-400" },
  { range: "≥20%", verdict: "False", color: "text-red-400" },
  { range: "No data", verdict: "Unverifiable", color: "text-slate-400" },
];

export function RAVEngine() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2
            className="text-6xl font-serif font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The RAV Engine
          </h2>
          <p className="text-[17px] text-slate-400">
            Retrieval-Augmented Verification in 3 Tiers
          </p>
        </motion.div>

        {/* Vertical animated pipeline */}
        <div className="relative space-y-12 mb-20">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              {/* Connecting line */}
              {index < tiers.length - 1 && (
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 top-full w-px h-12 bg-gradient-to-b from-white/30 to-transparent"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                >
                  {/* Animated data pulse */}
                  <motion.div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"
                    animate={{
                      y: [0, 48, 48],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.5,
                    }}
                  />
                </motion.div>
              )}

              {/* Tier card */}
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden group hover:border-white/20 transition-colors">
                {/* Glow connector */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1), transparent)`,
                    filter: "blur(40px)",
                  }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
                  {/* Tier number & icon */}
                  <div className="flex-shrink-0">
                    <motion.div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tier.color} flex flex-col items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <tier.icon className="w-8 h-8 text-white mb-1" />
                      <div className="text-xs text-white/80 font-mono">
                        Tier {tier.number}
                      </div>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3
                      className="text-[28px] font-serif font-bold text-white mb-4 tracking-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {tier.title}
                    </h3>
                    <div className="space-y-2">
                      {tier.features.map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          <span className="text-slate-300 text-sm">
                            {feature}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Verdict rules mini table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            Verdict Classification Rules
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {verdictRules.map((rule, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-sm text-slate-400 mb-2 font-mono">
                  {rule.range}
                </div>
                <div className={`text-lg font-bold ${rule.color}`}>
                  {rule.verdict}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
