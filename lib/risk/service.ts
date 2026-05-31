import dayjs from "dayjs";
import { and, desc, eq } from "drizzle-orm";
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
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.role === "ADMIN") {
    return { features: null, risk: null };
  }

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
      controlStatus: userRiskProfiles.controlStatus,
      restrictionReason: userRiskProfiles.restrictionReason,
      activeBorrowCount: userRiskProfiles.activeBorrowCount,
      overdueCount: userRiskProfiles.overdueCount,
      recent24hBorrowCount: userRiskProfiles.recent24hBorrowCount,
      updatedAt: userRiskProfiles.updatedAt,
    })
    .from(userRiskProfiles)
    .innerJoin(users, eq(userRiskProfiles.userId, users.id))
    .where(eq(users.role, "USER"))
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
    .where(eq(users.role, "USER"))
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
      blockedUsers: profiles.filter((profile) => profile.controlStatus === "BLOCKED").length,
      reviewUsers: profiles.filter((profile) => profile.controlStatus === "REVIEW").length,
      todayAbnormalEvents: recentEvents.filter(
        (event) => event.createdAt && dayjs(event.createdAt).isAfter(today),
      ).length,
      recentTrend: Array.from(trendMap.entries()).map(([date, count]) => ({
        date,
        count,
      })),
    },
    highRiskUsers: profiles.filter(
      (profile) => profile.currentLevel === "HIGH" || profile.controlStatus !== "NORMAL",
    ),
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
      controlStatus: userRiskProfiles.controlStatus,
      restrictionReason: userRiskProfiles.restrictionReason,
      restrictedUntil: userRiskProfiles.restrictedUntil,
      requiresManualReview: userRiskProfiles.requiresManualReview,
      totalBorrowCount: userRiskProfiles.totalBorrowCount,
      activeBorrowCount: userRiskProfiles.activeBorrowCount,
      overdueCount: userRiskProfiles.overdueCount,
      maxOverdueDays: userRiskProfiles.maxOverdueDays,
      recent7dBorrowCount: userRiskProfiles.recent7dBorrowCount,
      recent24hBorrowCount: userRiskProfiles.recent24hBorrowCount,
      abnormalEventCount: userRiskProfiles.abnormalEventCount,
      updatedAt: userRiskProfiles.updatedAt,
      role: users.role,
    })
    .from(userRiskProfiles)
    .innerJoin(users, eq(userRiskProfiles.userId, users.id))
    .where(and(eq(users.id, userId), eq(users.role, "USER")))
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
    .innerJoin(users, eq(borrowRiskEvents.userId, users.id))
    .where(and(eq(borrowRiskEvents.userId, userId), eq(users.role, "USER")))
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
  const [user] = await db
    .select({
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { isEligible: false, message: "User not found." };
  }

  if (user.role === "ADMIN") {
    return { isEligible: true, message: "Admin accounts are exempt from risk control." };
  }

  if (user.status === "REJECTED") {
    return {
      isEligible: false,
      message: "This account has been blocked by an administrator.",
    };
  }

  if (user.status !== "APPROVED") {
    return {
      isEligible: false,
      message: "This account has not been approved for borrowing yet.",
    };
  }

  const [profile] = await db
    .select({
      currentLevel: userRiskProfiles.currentLevel,
      activeBorrowCount: userRiskProfiles.activeBorrowCount,
      controlStatus: userRiskProfiles.controlStatus,
      restrictionReason: userRiskProfiles.restrictionReason,
      restrictedUntil: userRiskProfiles.restrictedUntil,
      requiresManualReview: userRiskProfiles.requiresManualReview,
    })
    .from(userRiskProfiles)
    .where(eq(userRiskProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return { isEligible: true, message: "Eligible for borrowing." };
  }

  if (profile.controlStatus === "BLOCKED") {
    return {
      isEligible: false,
      message:
        profile.restrictionReason ||
        `Borrowing is temporarily blocked until ${
          profile.restrictedUntil
            ? dayjs(profile.restrictedUntil).format("YYYY-MM-DD HH:mm")
            : "further notice"
        }.`,
    };
  }

  if (profile.controlStatus === "REVIEW" || profile.requiresManualReview) {
    return {
      isEligible: false,
      message:
        profile.restrictionReason ||
        "This account requires manual review before further borrowing.",
    };
  }

  if (profile.currentLevel === "HIGH" && profile.activeBorrowCount >= 10) {
    return {
      isEligible: false,
      message:
        "High-risk account with too many active borrows. Manual approval is required.",
    };
  }

  if (profile.controlStatus === "WATCH") {
    return {
      isEligible: true,
      message:
        profile.restrictionReason ||
        "Borrowing is allowed, but the account is under elevated monitoring.",
    };
  }

  return { isEligible: true, message: "Eligible for borrowing." };
}
