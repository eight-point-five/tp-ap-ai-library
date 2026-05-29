import dayjs from "dayjs";
import Link from "next/link";
import NaturalLanguageQueryBox from "@/components/risk/NaturalLanguageQueryBox";
import RiskBadge from "@/components/risk/RiskBadge";
import RiskReasonList from "@/components/risk/RiskReasonList";
import RiskScoreCard from "@/components/risk/RiskScoreCard";
import RiskTrendChart from "@/components/risk/RiskTrendChart";
import RiskUserTable from "@/components/risk/RiskUserTable";
import { getRiskDashboardData } from "@/lib/risk/service";

const Page = async () => {
  const data = await getRiskDashboardData();
  const highlightedEvent = data.recentEvents[0];
  const highlightedReasons = Array.isArray(highlightedEvent?.reasonCodes)
    ? highlightedEvent.reasonCodes
    : [];

  return (
    <section className="space-y-7">
      <div className="rounded-2xl bg-white p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
          图书馆风险智能系统
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-dark-400">
          自然语言驱动的 TP + AP + AI 数据库演示
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-light-500">
          本页面为事务处理、分析处理与规则式 AI 风险评估的浏览器演示入口。
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <RiskScoreCard
          label="高风险用户"
          value={data.overview.highRiskUsers}
          hint="需要优先人工审核的用户"
        />
        <RiskScoreCard
          label="中风险用户"
          value={data.overview.mediumRiskUsers}
          hint="需要持续观察的用户"
        />
        <RiskScoreCard
          label="今日异常事件"
          value={data.overview.todayAbnormalEvents}
          hint="今日创建的风险快照"
        />
        <RiskScoreCard
          label="近期事件"
          value={data.recentEvents.length}
          hint="此仪表盘展示的最新事件"
        />
      </div>

      <RiskTrendChart data={data.overview.recentTrend} />

      <RiskUserTable users={data.highRiskUsers} />

      <div className="grid gap-7 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-7">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-dark-400">风险事件</h3>
            <p className="text-sm text-light-500">
              每次借阅操作可生成一条风险快照事件。
            </p>
          </div>

          <div className="space-y-4">
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-light-500">暂无风险事件。</p>
            ) : (
              data.recentEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-light-400 bg-light-600 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-dark-400">
                        {event.fullName} borrowed {event.bookTitle}
                      </p>
                      <p className="mt-1 text-sm text-light-500">
                        {event.createdAt
                          ? dayjs(event.createdAt).format("YYYY-MM-DD HH:mm")
                          : "未知时间"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-dark-400">
                        评分 {event.riskScore}
                      </span>
                      <RiskBadge level={event.riskLevel} />
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-light-500">{event.explanation}</p>
                  <div className="mt-3">
                    <Link
                      href={`/admin/risk-users/${event.userId}`}
                      className="text-sm font-semibold text-primary-admin"
                    >
                      查看用户详情
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-7">
          <div className="rounded-2xl bg-white p-7">
            <h3 className="text-lg font-semibold text-dark-400">风险解读</h3>
            {highlightedEvent ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-light-400 bg-light-600 p-4">
                  <p className="font-semibold text-dark-400">
                    {highlightedEvent.fullName}
                  </p>
                  <p className="mt-2 text-sm text-light-500">
                    {highlightedEvent.explanation}
                  </p>
                </div>
                <RiskReasonList reasons={highlightedReasons} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-light-500">
                创建风险事件后，相关解读将在此展示。
              </p>
            )}
          </div>

          <NaturalLanguageQueryBox />
        </div>
      </div>
    </section>
  );
};

export default Page;
