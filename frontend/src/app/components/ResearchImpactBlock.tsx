import { motion } from "motion/react";
import { Vote, TrendingUp, BookOpen } from "lucide-react";

const impacts = [
  {
    icon: Vote,
    title: "Election fact-checking",
    description: "Real-time verification during political campaigns",
  },
  {
    icon: TrendingUp,
    title: "Economic policy analysis",
    description: "Data-driven evaluation of fiscal statements",
  },
  {
    icon: BookOpen,
    title: "Academic research support",
    description: "Rigorous verification for scholarly work",
  },
];

export function ResearchImpactBlock() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Heading */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Designed for Citizens, Journalists, and Policy Researchers.
            </h2>
          </motion.div>

          {/* Right: Impact points */}
          <div className="space-y-6">
            {impacts.map((impact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors cursor-pointer"
              >
                {/* Animated underline on hover */}
                <motion.div
                  className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-blue-500 to-emerald-500"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center">
                    <impact.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {impact.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {impact.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
