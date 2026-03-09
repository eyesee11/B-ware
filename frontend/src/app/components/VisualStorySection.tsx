import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const pipeline = [
  { label: "Claim", color: "text-blue-400" },
  { label: "NLP", color: "text-emerald-400" },
  { label: "API", color: "text-purple-400" },
  { label: "Analysis", color: "text-amber-400" },
  { label: "Score", color: "text-red-400" },
];

export function VisualStorySection() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-6xl mx-auto space-y-32">
        {/* Panel 1: Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-12 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            How a Claim Becomes Data
          </h3>

          {/* Pipeline visualization */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {pipeline.map((node, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-4"
              >
                {/* Node */}
                <div className="relative group">
                  <motion.div
                    className="relative z-10 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div
                      className={`text-lg font-mono font-semibold ${node.color}`}
                    >
                      {node.label}
                    </div>
                  </motion.div>
                  {/* Glow */}
                  <motion.div
                    className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity"
                    style={{
                      background: node.color.includes("blue")
                        ? "#2563EB"
                        : node.color.includes("emerald")
                        ? "#22C55E"
                        : node.color.includes("purple")
                        ? "#8B5CF6"
                        : node.color.includes("amber")
                        ? "#F59E0B"
                        : "#EF4444",
                    }}
                  />
                </div>

                {/* Arrow */}
                {index < pipeline.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.1 }}
                  >
                    <ArrowRight className="w-6 h-6 text-slate-600" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Panel 2: Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3
              className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Claimed vs Official
            </h3>
            <p className="text-lg text-slate-400">
              Direct comparison with verified government datasets reveals the gap
              between rhetoric and reality.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Claimed</div>
                  <motion.div
                    className="text-5xl font-mono font-bold text-red-400"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    20%
                  </motion.div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Official</div>
                  <motion.div
                    className="text-5xl font-mono font-bold text-emerald-400"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    7%
                  </motion.div>
                </div>
              </div>

              {/* Visual bars */}
              <div className="space-y-3">
                <motion.div
                  className="h-4 bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                />
                <motion.div
                  className="h-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "35%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Panel 3: Trend line */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Background trend line */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <motion.path
                d="M 0 200 L 100 180 L 200 190 L 300 150 L 400 160 L 500 140 L 600 120 L 700 130 L 800 100 L 900 110 L 1000 90"
                stroke="#2563EB"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </svg>
          </div>

          <div className="relative z-10 text-center py-20">
            <h3
              className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Context matters. We show history.
            </h3>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
