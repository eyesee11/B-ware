import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({ icon: Icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="group relative bg-[#1E293B] border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300"
      style={{
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-300" />
      
      <div className="relative">
        <div className="mb-4 inline-flex p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
          {title}
        </h3>
        
        <p className="text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
