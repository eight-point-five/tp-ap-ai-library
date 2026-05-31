import { cn } from "@/lib/utils";

const statusStyles: Record<ControlStatus, string> = {
  NORMAL: "bg-emerald-50 text-emerald-700",
  WATCH: "bg-amber-50 text-amber-700",
  REVIEW: "bg-orange-50 text-orange-700",
  BLOCKED: "bg-red-50 text-red-700",
};

const ControlStatusBadge = ({ status }: { status: ControlStatus }) => (
  <span
    className={cn(
      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
      statusStyles[status],
    )}
  >
    {status}
  </span>
);

export default ControlStatusBadge;
