import { motion } from "motion/react";
import { BarChart3, TrendingUp, PieChart, Activity, Award, Sparkles } from "lucide-react";

const infographics = [
  {
    icon: BarChart3,
    title: "Claim vs Official Bar Comparison",
    description: "Side-by-side visual accuracy assessment",
  },
  {
    icon: TrendingUp,
    title: "Historical Trend Line Graphs",
    description: "Multi-year economic indicator tracking",
  },
  {
    icon: PieChart,
    title: "Verdict Distribution Pie Charts",
    description: "Aggregate accuracy breakdown by category",
  },
  {
    icon: Activity,
    title: "Danger Score Timeline",
    description: "Real-time rumor threat level monitoring",
  },
  {
    icon: Award,
    title: "Source Credibility Leaderboard",
    description: "Ranked verification accuracy by outlet",
  },
  {
    icon: Sparkles,
    title: "Claim Probability Scatter Plots",
    description: "Statistical confidence distribution analysis",
  },
];

export function InfographicsCapabilities() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2
            className="text-6xl font-serif font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Visualize the Truth.
          </h2>
          <p className="text-[17px] text-slate-400 max-w-2xl mx-auto">
            Export-ready visual insights. Research-grade analytics. Interactive
            filtering by metric, year, source.
          </p>
        </motion.div>

        {/* Interactive card grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {infographics.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="group relative"
            >
              {/* Animated gradient border */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(135deg, #2563EB, #22C55E, #8B5CF6, #2563EB)",
                  backgroundSize: "300% 300%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Card content */}
              <div className="relative bg-black border border-white/10 rounded-2xl p-6 h-full hover:border-transparent transition-colors">
                {/* Mini animated chart area */}
                <motion.div
                  className="w-full h-24 mb-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-white/5 flex items-center justify-center overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Animated icon */}
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                      rotate: [0, 5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <item.icon className="w-12 h-12 text-blue-400/50" />
                  </motion.div>

                  {/* Animated lines */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-20"
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      d={`M 0 ${60 + index * 3} Q 50 ${50 + index * 2} 100 ${55 + index * 3} T 200 ${50 + index * 2}`}
                      stroke="#2563EB"
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, delay: index * 0.1 }}
                    />
                  </svg>
                </motion.div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
