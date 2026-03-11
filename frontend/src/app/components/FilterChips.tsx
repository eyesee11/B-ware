const VERDICTS = ["all", "false", "misleading", "accurate", "unverifiable"] as const;

const chipColors: Record<string, string> = {
  all:           "bg-white/10 text-white",
  false:         "bg-red-500/20 text-red-400 border-red-500/30",
  misleading:    "bg-amber-500/20 text-amber-400 border-amber-500/30",
  accurate:      "bg-green-500/20 text-green-400 border-green-500/30",
  unverifiable:  "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

interface FilterChipsProps {
  active: string;
  onChange: (verdict: string) => void;
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {VERDICTS.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border transition-colors ${
            active === v
              ? chipColors[v] + " border-current"
              : "border-white/10 text-white/40 hover:text-white/70"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
