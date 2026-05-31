import { ReactNode } from "react";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/database/drizzle";
import { users, userRiskProfiles, borrowRecords } from "@/database/schema";
import { and, eq } from "drizzle-orm";

const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  after(async () => {
    if (!session?.user?.id) return;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session?.user?.id))
      .limit(1);

    if (!user[0]) return;

    if (user[0].lastActivityDate === new Date().toISOString().slice(0, 10))
      return;

    await db
      .update(users)
      .set({ lastActivityDate: new Date().toISOString().slice(0, 10) })
      .where(eq(users.id, session?.user?.id));
  });

  let warningScore = 0;
  let warningOverdueCount = 0;
  let warningControlStatus: ControlStatus = "NORMAL";
  let warningRestrictionReason: string | null = null;

  if (session?.user?.id) {
    const [profile] = await db
      .select({
        currentScore: userRiskProfiles.currentScore,
        controlStatus: userRiskProfiles.controlStatus,
        restrictionReason: userRiskProfiles.restrictionReason,
      })
      .from(userRiskProfiles)
      .where(eq(userRiskProfiles.userId, session.user.id))
      .limit(1);

    warningScore = profile?.currentScore ?? 0;
    warningControlStatus = profile?.controlStatus ?? "NORMAL";
    warningRestrictionReason = profile?.restrictionReason ?? null;

    const today = new Date().toISOString().slice(0, 10);
    const overdueRecords = await db
      .select()
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.userId, session.user.id),
          eq(borrowRecords.status, "BORROWED"),
        ),
      );

    warningOverdueCount = overdueRecords.filter(
      (r) => r.dueDate < today,
    ).length;
  }

  return (
    <main className="root-container">
      <div className="mx-auto max-w-7xl">
        <WarningBanner
          score={warningScore}
          overdueCount={warningOverdueCount}
          controlStatus={warningControlStatus}
          restrictionReason={warningRestrictionReason}
        />

        <Header session={session} />

        <div className="mt-20 pb-20">{children}</div>
      </div>
    </main>
  );
};

export default Layout;
