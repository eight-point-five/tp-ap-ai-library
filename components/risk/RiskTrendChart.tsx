const RiskTrendChart = ({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) => {
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="rounded-2xl bg-white p-7">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-dark-400">Risk Events in Last 7 Days</h3>
        <p className="text-sm text-light-500">
          A simple AP-focused trend view for the local demo.
        </p>
      </div>

      <div className="flex items-end gap-4">
        {data.map((item) => (
          <div key={item.date} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-44 w-full items-end rounded-2xl bg-light-600 p-3">
              <div
                className="w-full rounded-xl bg-primary-admin transition-all"
                style={{
                  height: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 12 : 0)}%`,
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-dark-400">{item.count}</p>
              <p className="text-xs text-light-500">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskTrendChart;
