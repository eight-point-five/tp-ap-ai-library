import { cn } from "@/lib/utils";

const levelClassName: Record<RiskLevel, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-red-100 text-red-800",
};

const RiskBadge = ({ level }: { level: RiskLevel }) => {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        levelClassName[level],
      )}
    >
      {level}
    </span>
  );
};

export default RiskBadge;
