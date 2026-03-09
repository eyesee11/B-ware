import { cn } from "../components/ui/utils";

interface ResultBadgeProps {
  status: "true" | "false" | "misleading";
  className?: string;
}

export function ResultBadge({ status, className }: ResultBadgeProps) {
  const variants = {
    true: "bg-green-500/10 text-green-500 border-green-500/50",
    false: "bg-red-500/10 text-red-500 border-red-500/50",
    misleading: "bg-amber-500/10 text-amber-500 border-amber-500/50",
  };

  const labels = {
    true: "Verified",
    false: "False",
    misleading: "Misleading",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider uppercase border rounded-full",
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
