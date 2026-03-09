import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface PipelineStepProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
  isLast: boolean;
}

export function PipelineStep({ icon: Icon, title, description, index, isLast }: PipelineStepProps) {
  return (
    <div className="flex items-center gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.15, duration: 0.5 }}
        className="flex-shrink-0"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-xl bg-[#1E293B] border-2 border-blue-500/50 flex items-center justify-center group hover:border-blue-500 transition-colors">
            <Icon className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
          >
            {index + 1}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.15 + 0.2, duration: 0.5 }}
        className="flex-1"
      >
        <h4 className="text-white font-semibold mb-1 tracking-tight">{title}</h4>
        <p className="text-sm text-slate-400">{description}</p>
      </motion.div>

      {!isLast && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.15 + 0.4, duration: 0.5 }}
          className="flex-shrink-0 hidden lg:block"
        >
          <ArrowRight className="w-6 h-6 text-slate-600" />
        </motion.div>
      )}
    </div>
  );
}
