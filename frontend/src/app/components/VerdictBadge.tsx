const variants: Record<string, string> = {
  accurate:     "bg-green-500/10  text-green-500  border-green-500/50",
  misleading:   "bg-amber-500/10  text-amber-500  border-amber-500/50",
  false:        "bg-red-500/10    text-red-500    border-red-500/50",
  unverifiable: "bg-slate-500/10  text-slate-400  border-slate-500/50",
  true:         "bg-green-500/10  text-green-500  border-green-500/50",
};

const labels: Record<string, string> = {
  accurate:     "Accurate",
  misleading:   "Misleading",
  false:        "False",
  unverifiable: "Unverifiable",
  true:         "Verified",
};

interface VerdictBadgeProps {
  status: "accurate" | "misleading" | "false" | "unverifiable" | "true";
  className?: string;
}

export function VerdictBadge({ status, className = "" }: VerdictBadgeProps) {
  const key = status.toLowerCase();
  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${
        variants[key] ?? variants.unverifiable
      } ${className}`}
    >
      {labels[key] ?? status}
    </span>
  );
}
