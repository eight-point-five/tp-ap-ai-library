import dayjs from "dayjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ControlStatusBadge from "@/components/risk/ControlStatusBadge";
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
              风险监控中心
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-dark-400">
              TP + AP + AI 风控分析与账号管控
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-light-500">
              这里集中展示风险评分、账号控制状态、风险事件趋势，以及可配置大模型驱动的自然语言查询。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-primary text-dark-400">
              <Link href="/">返回图书馆首页</Link>
            </Button>
            <Button asChild className="bg-primary-admin text-white">
              <Link href="/admin/books">返回图书管理</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <RiskScoreCard
          label="高风险用户"
          value={data.overview.highRiskUsers}
          hint="已达到高风险阈值的普通用户"
        />
        <RiskScoreCard
          label="中风险用户"
          value={data.overview.mediumRiskUsers}
          hint="需要重点关注借阅行为变化的用户"
        />
        <RiskScoreCard
          label="已封控用户"
          value={data.overview.blockedUsers}
          hint="借阅权限已临时冻结的账号"
        />
        <RiskScoreCard
          label="人工审核队列"
          value={data.overview.reviewUsers}
          hint="借阅前必须人工审核的账号"
        />
        <RiskScoreCard
          label="今日异常事件"
          value={data.overview.todayAbnormalEvents}
          hint="今天新生成的风险事件数量"
        />
      </div>

      <RiskTrendChart data={data.overview.recentTrend} />

      <RiskUserTable users={data.highRiskUsers} />

      <div className="grid gap-7 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-7">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-dark-400">近期风险事件</h3>
            <p className="text-sm text-light-500">
              每次借阅都可能更新风险评分、解释原因和账号控制状态。
            </p>
          </div>

          <div className="space-y-4">
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-light-500">暂无近期风险事件。</p>
            ) : (
              data.recentEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-light-400 bg-light-600 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-dark-400">
                        {event.fullName} 借阅了《{event.bookTitle}》
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
                      查看账号详情
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-7">
          <div className="rounded-2xl bg-white p-7">
            <h3 className="text-lg font-semibold text-dark-400">最新风险解读</h3>
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
                触发新的借阅风险事件后，这里会显示最新解释。
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-7">
            <h3 className="text-lg font-semibold text-dark-400">控制策略说明</h3>
            <div className="mt-4 space-y-3 text-sm text-light-500">
              <div className="flex items-center gap-3">
                <ControlStatusBadge status="NORMAL" />
                <span>正常使用，允许借阅。</span>
              </div>
              <div className="flex items-center gap-3">
                <ControlStatusBadge status="WATCH" />
                <span>允许借阅，但需持续观察行为变化。</span>
              </div>
              <div className="flex items-center gap-3">
                <ControlStatusBadge status="REVIEW" />
                <span>下一次借阅前需要管理员人工审核。</span>
              </div>
              <div className="flex items-center gap-3">
                <ControlStatusBadge status="BLOCKED" />
                <span>账号已进入临时封控状态，借阅权限暂停。</span>
              </div>
            </div>
          </div>

          <NaturalLanguageQueryBox />
        </div>
      </div>
    </section>
  );
};

export default Page;
