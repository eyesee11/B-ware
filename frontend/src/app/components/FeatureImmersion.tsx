import { motion } from "motion/react";
import { Brain, Database, Scale, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Claim Extraction",
    description: "Neural networks parse political statements and extract verifiable metrics.",
  },
  {
    icon: Database,
    title: "Official Data APIs",
    description: "Direct integration with World Bank, IMF, RBI, and data.gov datasets.",
  },
  {
    icon: Scale,
    title: "Credibility Scoring Engine",
    description: "Algorithmic scoring system measuring claim accuracy against verified data.",
  },
  {
    icon: TrendingUp,
    title: "Historical Misinformation Tracking",
    description: "Pattern recognition identifying recurring false claims over time.",
  },
];

export function FeatureImmersion() {
  return (
    <section className="py-32">
      <div className="max-w-5xl mx-auto px-4 space-y-32">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="relative"
          >
            {/* Gradient divider above */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.1 }}
              className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-12 origin-left"
            />

            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center backdrop-blur-xl"
                style={{
                  boxShadow: "0 0 40px rgba(37, 99, 235, 0.3)",
                }}
              >
                <feature.icon className="w-8 h-8 text-blue-400" />
              </motion.div>

              {/* Content */}
              <div className="flex-1">
                <h3
                  className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
