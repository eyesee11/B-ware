import { motion } from "motion/react";
import { CredibilityMeter } from "./CredibilityMeter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const comparisonData = [
  {
    category: "Claimed",
    value: 20,
  },
  {
    category: "Official",
    value: 7,
  },
];

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative"
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative bg-[#1E293B]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              Live Analysis
            </div>
            <div className="text-sm text-slate-300">
              Claim: "Unemployment is 20% in 2022"
            </div>
          </div>
          <motion.div
            className="w-2 h-2 bg-red-500 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        <div className="flex flex-col items-center justify-center mb-6">
          <CredibilityMeter score={32} size={160} strokeWidth={10} />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
            Comparison
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="category" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#E2E8F0",
                }}
              />
              <Bar dataKey="value" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-[#0F172A]/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-xs text-slate-400 mb-1">Claimed</div>
            <div className="text-xl font-mono font-bold text-red-400">20%</div>
          </div>
          <div className="bg-[#0F172A]/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-xs text-slate-400 mb-1">Official</div>
            <div className="text-xl font-mono font-bold text-green-400">7%</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
