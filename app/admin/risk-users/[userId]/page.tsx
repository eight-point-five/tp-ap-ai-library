import dayjs from "dayjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/risk/RiskBadge";
import RiskReasonList from "@/components/risk/RiskReasonList";
import { getUserRiskDetail } from "@/lib/risk/service";

const Page = async ({
  params,
}: {
  params: Promise<{ userId: string }>;
}) => {
  const { userId } = await params;
  const detail = await getUserRiskDetail(userId);

  if (!detail.profile) {
    return (
      <section className="rounded-2xl bg-white p-7">
        <h2 className="text-xl font-semibold text-dark-400">
          No risk profile was found for this user.
        </h2>
      </section>
    );
  }

  const latestReasons = Array.isArray(detail.events[0]?.reasonCodes)
    ? detail.events[0].reasonCodes
    : [];

  return (
    <section className="space-y-7">
      <Button asChild className="back-btn">
        <Link href="/admin/risk-dashboard">Back to risk dashboard</Link>
      </Button>

      <div className="rounded-2xl bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-dark-400">
              {detail.profile.fullName}
            </h2>
            <p className="mt-2 text-sm text-light-500">{detail.profile.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold text-dark-400">
              {detail.profile.currentScore}
            </span>
            <RiskBadge level={detail.profile.currentLevel} />
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-light-600 p-4">
            <p className="text-sm text-light-500">Total Borrows</p>
            <p className="mt-2 text-2xl font-semibold text-dark-400">
              {detail.profile.totalBorrowCount}
            </p>
          </div>
          <div className="rounded-xl bg-light-600 p-4">
            <p className="text-sm text-light-500">Active Borrows</p>
            <p className="mt-2 text-2xl font-semibold text-dark-400">
              {detail.profile.activeBorrowCount}
            </p>
          </div>
          <div className="rounded-xl bg-light-600 p-4">
            <p className="text-sm text-light-500">Overdue Count</p>
            <p className="mt-2 text-2xl font-semibold text-dark-400">
              {detail.profile.overdueCount}
            </p>
          </div>
          <div className="rounded-xl bg-light-600 p-4">
            <p className="text-sm text-light-500">Recent 24h Borrows</p>
            <p className="mt-2 text-2xl font-semibold text-dark-400">
              {detail.profile.recent24hBorrowCount}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-7 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl bg-white p-7">
          <h3 className="text-lg font-semibold text-dark-400">Triggered Rules</h3>
          <div className="mt-5">
            <RiskReasonList reasons={latestReasons} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-7">
          <h3 className="text-lg font-semibold text-dark-400">System Suggestion</h3>
          <div className="mt-5 rounded-xl border border-light-400 bg-light-600 p-4">
            <p className="text-sm text-light-500">
              {detail.events[0]?.explanation ||
                "No recent risk events were found for this user."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7">
        <h3 className="text-lg font-semibold text-dark-400">Risk Event History</h3>
        <div className="mt-5 space-y-4">
          {detail.events.length === 0 ? (
            <p className="text-sm text-light-500">No risk events yet.</p>
          ) : (
            detail.events.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-light-400 bg-light-600 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-dark-400">{event.bookTitle}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-dark-400">
                      {event.riskScore}
                    </span>
                    <RiskBadge level={event.riskLevel} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-light-500">
                  {event.createdAt
                    ? dayjs(event.createdAt).format("YYYY-MM-DD HH:mm")
                    : "Unknown time"}
                </p>
                <p className="mt-3 text-sm text-light-500">{event.explanation}</p>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7">
        <h3 className="text-lg font-semibold text-dark-400">Borrow Timeline</h3>
        <div className="mt-5 space-y-4">
          {detail.borrowTimeline.length === 0 ? (
            <p className="text-sm text-light-500">No borrow records yet.</p>
          ) : (
            detail.borrowTimeline.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-light-400 bg-light-600 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-dark-400">{record.bookTitle}</p>
                  <p className="text-sm text-light-500">{record.status}</p>
                </div>
                <p className="mt-2 text-sm text-light-500">
                  Borrowed at:{" "}
                  {record.borrowDate
                    ? dayjs(record.borrowDate).format("YYYY-MM-DD HH:mm")
                    : "Unknown"}
                </p>
                <p className="mt-1 text-sm text-light-500">
                  Due date: {String(record.dueDate)}
                </p>
                <p className="mt-1 text-sm text-light-500">
                  Returned at: {record.returnDate ? String(record.returnDate) : "Not returned"}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Page;
