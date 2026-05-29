export type RiskReasonListItem = {
  code?: string;
  message?: string;
  weight?: number;
};

const RiskReasonList = ({
  reasons,
}: {
  reasons: Array<RiskReasonListItem | Record<string, unknown>>;
}) => {
  if (!reasons.length) {
    return <p className="text-sm text-light-500">暂无风险原因数据。</p>;
  }

  return (
    <ul className="space-y-3">
      {reasons.map((reason, index) => (
        <li
          key={`${reason.code}-${index}`}
          className="rounded-xl border border-light-400 bg-light-600 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-dark-400">
              {"code" in reason ? String(reason.code || "") : ""}
            </p>
            <span className="text-sm text-light-500">
              +{"weight" in reason ? Number(reason.weight || 0) : 0}
            </span>
          </div>
          <p className="mt-2 text-sm text-light-500">
            {"message" in reason ? String(reason.message || "") : ""}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default RiskReasonList;
