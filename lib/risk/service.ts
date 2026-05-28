import dayjs from "dayjs";
import { desc, eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  books,
  borrowRecords,
  borrowRiskEvents,
  userRiskProfiles,
  users,
} from "@/database/schema";
import { buildRiskFeatures, upsertUserRiskProfile } from "@/lib/risk/features";
import { evaluateRiskByRules } from "@/lib/risk/rule-model";

type StoredRiskReason = {
  code?: string;
};

export async function evaluateBorrowRisk({
  userId,
  bookId,
  borrowRecordId,
  eventType = "BORROW",
}: {
  userId: string;
  bookId: string;
  borrowRecordId: string;
  eventType?: RiskEventType;
}) {
  const features = await buildRiskFeatures(userId, bookId);
  const risk = evaluateRiskByRules(features);

  await db.insert(borrowRiskEvents).values({
    borrowRecordId,
    userId,
    bookId,
    eventType,
    riskScore: risk.score,
    riskLevel: risk.level,
    featureSnapshot: features,
    reasonCodes: risk.reasons,
    aiExplanation: risk.explanation,
    decision: risk.decision,
  });

  await upsertUserRiskProfile(userId, features, risk);

  return { features, risk };
}

export async function getRiskDashboardData() {
  const profiles = await db
    .select({
      userId: userRiskProfiles.userId,
      fullName: users.fullName,
      email: users.email,
      currentScore: userRiskProfiles.currentScore,
      currentLevel: userRiskProfiles.currentLevel,
      activeBorrowCount: userRiskProfiles.activeBorrowCount,
      overdueCount: userRiskProfiles.overdueCount,
      recent24hBorrowCount: userRiskProfiles.recent24hBorrowCount,
      updatedAt: userRiskProfiles.updatedAt,
    })
    .from(userRiskProfiles)
    .innerJoin(users, eq(userRiskProfiles.userId, users.id))
    .orderBy(desc(userRiskProfiles.currentScore));

  const recentEvents = await db
    .select({
      id: borrowRiskEvents.id,
      createdAt: borrowRiskEvents.createdAt,
      riskScore: borrowRiskEvents.riskScore,
      riskLevel: borrowRiskEvents.riskLevel,
      decision: borrowRiskEvents.decision,
      explanation: borrowRiskEvents.aiExplanation,
      reasonCodes: borrowRiskEvents.reasonCodes,
      fullName: users.fullName,
      bookTitle: books.title,
      userId: users.id,
    })
    .from(borrowRiskEvents)
    .innerJoin(users, eq(borrowRiskEvents.userId, users.id))
    .innerJoin(books, eq(borrowRiskEvents.bookId, books.id))
    .orderBy(desc(borrowRiskEvents.createdAt))
    .limit(20);

  const today = dayjs().startOf("day");
  const trendWindowStart = dayjs().subtract(6, "day").startOf("day");
  const recentTrendEvents = recentEvents.filter((event) =>
    event.createdAt && dayjs(event.createdAt).isAfter(trendWindowStart),
  );

  const trendMap = new Map<string, number>();
  for (let index = 0; index < 7; index += 1) {
    const key = dayjs().subtract(6 - index, "day").format("MM-DD");
    trendMap.set(key, 0);
  }
  for (const event of recentTrendEvents) {
    const key = dayjs(event.createdAt).format("MM-DD");
    trendMap.set(key, (trendMap.get(key) || 0) + 1);
  }

  return {
    overview: {
      highRiskUsers: profiles.filter((profile) => profile.currentLevel === "HIGH").length,
      mediumRiskUsers: profiles.filter((profile) => profile.currentLevel === "MEDIUM").length,
      todayAbnormalEvents: recentEvents.filter(
        (event) => event.createdAt && dayjs(event.createdAt).isAfter(today),
      ).length,
      recentTrend: Array.from(trendMap.entries()).map(([date, count]) => ({
        date,
        count,
      })),
    },
    highRiskUsers: profiles.filter((profile) => profile.currentLevel === "HIGH"),
    recentEvents,
  };
}

export async function getUserRiskDetail(userId: string) {
  const [profile] = await db
    .select({
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      createdAt: users.createdAt,
      currentScore: userRiskProfiles.currentScore,
      currentLevel: userRiskProfiles.currentLevel,
      totalBorrowCount: userRiskProfiles.totalBorrowCount,
      activeBorrowCount: userRiskProfiles.activeBorrowCount,
      overdueCount: userRiskProfiles.overdueCount,
      maxOverdueDays: userRiskProfiles.maxOverdueDays,
      recent7dBorrowCount: userRiskProfiles.recent7dBorrowCount,
      recent24hBorrowCount: userRiskProfiles.recent24hBorrowCount,
      abnormalEventCount: userRiskProfiles.abnormalEventCount,
      updatedAt: userRiskProfiles.updatedAt,
    })
    .from(userRiskProfiles)
    .innerJoin(users, eq(userRiskProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  const events = await db
    .select({
      id: borrowRiskEvents.id,
      createdAt: borrowRiskEvents.createdAt,
      riskScore: borrowRiskEvents.riskScore,
      riskLevel: borrowRiskEvents.riskLevel,
      decision: borrowRiskEvents.decision,
      explanation: borrowRiskEvents.aiExplanation,
      reasonCodes: borrowRiskEvents.reasonCodes,
      bookTitle: books.title,
    })
    .from(borrowRiskEvents)
    .innerJoin(books, eq(borrowRiskEvents.bookId, books.id))
    .where(eq(borrowRiskEvents.userId, userId))
    .orderBy(desc(borrowRiskEvents.createdAt))
    .limit(30);

  const borrowTimeline = await db
    .select({
      id: borrowRecords.id,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      status: borrowRecords.status,
      bookTitle: books.title,
    })
    .from(borrowRecords)
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(eq(borrowRecords.userId, userId))
    .orderBy(desc(borrowRecords.borrowDate))
    .limit(30);

  const triggeredRuleCodes = Array.from(
    new Set(
      events.flatMap((event) =>
        Array.isArray(event.reasonCodes)
          ? (event.reasonCodes as StoredRiskReason[])
              .map((reason) => reason?.code)
              .filter(Boolean)
          : [],
      ),
    ),
  );

  return {
    profile,
    events,
    borrowTimeline,
    triggeredRuleCodes,
  };
}

export async function getBorrowingEligibility(userId: string) {
  const [profile] = await db
    .select({
      currentLevel: userRiskProfiles.currentLevel,
      activeBorrowCount: userRiskProfiles.activeBorrowCount,
    })
    .from(userRiskProfiles)
    .where(eq(userRiskProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return { isEligible: true, message: "Eligible to borrow" };
  }

  if (profile.currentLevel === "HIGH" && profile.activeBorrowCount >= 10) {
    return {
      isEligible: false,
      message: "High risk users with too many active borrows require admin review.",
    };
  }

  return { isEligible: true, message: "Eligible to borrow" };
}
