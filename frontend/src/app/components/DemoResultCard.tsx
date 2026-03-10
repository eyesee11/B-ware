import { motion } from "motion/react";
import { ResultBadge } from "./ResultBadge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";

const trendData = [
  { year: "2018", unemployment: 5.3 },
  { year: "2019", unemployment: 5.8 },
  { year: "2020", unemployment: 7.9 },
  { year: "2021", unemployment: 7.7 },
  { year: "2022", unemployment: 7.0 },
];

const comparisonData = [
  { category: "Claimed", value: 20 },
  { category: "Official", value: 7 },
];

export function DemoResultCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-700/50">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-sm text-slate-400 uppercase tracking-wider">
              Analyzed Claim
            </div>
            <ResultBadge status="false" />
          </div>
          <div className="text-2xl text-white font-semibold mb-3">
            "Unemployment is 20% in 2022"
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-slate-400">Official Data:</span>
              <span className="ml-2 font-mono font-bold text-green-400">7.0%</span>
            </div>
            <div>
              <span className="text-slate-400">Deviation:</span>
              <span className="ml-2 font-mono font-bold text-red-400">+185%</span>
            </div>
            <div>
              <span className="text-slate-400">Credibility:</span>
              <span className="ml-2 font-mono font-bold text-red-400">12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-8 mb-6">
        {/* Trend Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold tracking-tight">
              Historical Trend
            </h4>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#0F172A] border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Source: World Bank API
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#E2E8F0",
                }}
              />
              <Line
                type="monotone"
                dataKey="unemployment"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold tracking-tight">
              Claimed vs Official
            </h4>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#0F172A] border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Source: World Bank, 2022
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
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
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Data verified from official sources</span>
          </div>
          <div className="text-xs text-slate-500">
            Last updated: March 2, 2026
          </div>
        </div>
      </div>
    </motion.div>
  );
}
