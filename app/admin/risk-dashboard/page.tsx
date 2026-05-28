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
          Library Risk Intelligence System
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-dark-400">
          Natural Language Driven TP + AP + AI Database Demo
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-light-500">
          This page is the browser demo entry for transaction processing,
          analytical processing, and rule-based AI risk evaluation.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <RiskScoreCard
          label="High Risk Users"
          value={data.overview.highRiskUsers}
          hint="Users that need manual review first"
        />
        <RiskScoreCard
          label="Medium Risk Users"
          value={data.overview.mediumRiskUsers}
          hint="Users that should stay under observation"
        />
        <RiskScoreCard
          label="Today Abnormal Events"
          value={data.overview.todayAbnormalEvents}
          hint="Risk snapshots created today"
        />
        <RiskScoreCard
          label="Recent Events"
          value={data.recentEvents.length}
          hint="Latest events shown on this dashboard"
        />
      </div>

      <RiskTrendChart data={data.overview.recentTrend} />

      <RiskUserTable users={data.highRiskUsers} />

      <div className="grid gap-7 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-7">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-dark-400">Risk Events</h3>
            <p className="text-sm text-light-500">
              Each borrow operation can create one risk snapshot event.
            </p>
          </div>

          <div className="space-y-4">
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-light-500">No risk events yet.</p>
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
                          : "Unknown time"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-dark-400">
                        Score {event.riskScore}
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
                      View user details
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-7">
          <div className="rounded-2xl bg-white p-7">
            <h3 className="text-lg font-semibold text-dark-400">Risk Explanation</h3>
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
                Once a risk event is created, the explanation will appear here.
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
