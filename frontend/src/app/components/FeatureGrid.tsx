import { motion } from "motion/react";
import { Brain, Database, Scale, TrendingUp, BarChart3, FileText } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Claim Extraction",
    description: "Neural networks parse statements and extract verifiable metrics.",
  },
  {
    icon: Database,
    title: "Official Data APIs",
    description: "Direct integration with World Bank, IMF, RBI, and data.gov.",
  },
  {
    icon: Scale,
    title: "Credibility Scoring Engine",
    description: "Algorithmic scoring measuring claim accuracy against verified data.",
  },
  {
    icon: TrendingUp,
    title: "Trend Visualization",
    description: "Historical patterns displayed with interactive charts and timelines.",
  },
  {
    icon: BarChart3,
    title: "Historical Pattern Analysis",
    description: "Pattern recognition identifying recurring false claims over time.",
  },
  {
    icon: FileText,
    title: "Research-Grade Transparency",
    description: "Full source attribution and methodology disclosure for every claim.",
  },
];

export function FeatureGrid() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Built for Verification at Scale
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Advanced AI meets public data infrastructure
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative"
            >
              {/* Moving gradient border */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(135deg, #2563EB, #22C55E, #2563EB)",
                  backgroundSize: "200% 200%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Card content */}
              <div className="relative bg-black border border-white/10 rounded-2xl p-8 h-full hover:border-white/20 transition-colors">
                {/* Hover glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    filter: "blur(30px)",
                  }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Spotlight effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle 200px at var(--mouse-x) var(--mouse-y), rgba(37, 99, 235, 0.15), transparent)",
                  }}
                />
              </div>

              {/* Floating animation */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 3 + index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
