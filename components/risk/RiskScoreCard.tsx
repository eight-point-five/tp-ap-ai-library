const RiskScoreCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) => {
  return (
    <article className="stat min-w-[220px]">
      <p className="stat-label">{label}</p>
      <div className="space-y-2">
        <p className="stat-count">{value}</p>
        <p className="text-sm text-light-500">{hint}</p>
      </div>
    </article>
  );
};

export default RiskScoreCard;
