import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const comparisonData = [
  { category: "Claim", value: 20 },
  { category: "Official", value: 7 },
];

export function InteractiveClaimShowcase() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative group cursor-pointer"
        >
          {/* Glass card */}
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 overflow-hidden">
            {/* Glow effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                filter: "blur(40px)",
              }}
            />

            <div className="relative z-10">
              {/* Example claim */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="text-sm text-slate-400 uppercase tracking-wider mb-4">
                  Example Claim
                </div>
                <div className="text-3xl md:text-4xl font-serif text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  "Unemployment is highest ever in 2022."
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"
              />

              {/* AI Analysis Result */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Credibility</div>
                    <div className="text-6xl font-mono font-bold text-red-400">28%</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Status</div>
                    <div className="inline-flex px-6 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-lg font-semibold">
                      Misleading
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="pt-8">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="category" stroke="rgba(255,255,255,0.3)" fontSize={14} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={14} />
                      <Bar dataKey="value" fill="#2563EB" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Link below */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2 }}
            className="text-center mt-8"
          >
            <a
              href="#verify"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Run Your Own Verification →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
