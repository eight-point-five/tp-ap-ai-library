import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  books,
  borrowRecords,
  borrowRiskEvents,
  riskRules,
  userRiskProfiles,
  users,
} from "@/database/schema";
import type { RiskFeatures, RiskResult } from "@/lib/risk/types";

const diffInDays = (endDate: Date | string, startDate: Date | string) =>
  Math.max(dayjs(endDate).diff(dayjs(startDate), "day"), 0);

export async function buildRiskFeatures(
  userId: string,
  bookId: string,
  database = db,
): Promise<RiskFeatures> {
  const [user] = await database
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [currentBook] = await database
    .select({ genre: books.genre })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  const records = await database
    .select({
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      status: borrowRecords.status,
      genre: books.genre,
    })
    .from(borrowRecords)
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(eq(borrowRecords.userId, userId));

  const riskEvents = await database
    .select({ createdAt: borrowRiskEvents.createdAt })
    .from(borrowRiskEvents)
    .where(eq(borrowRiskEvents.userId, userId));

  const now = dayjs();
  const recent7dBorrowCount = records.filter((record) =>
    dayjs(record.borrowDate).isAfter(now.subtract(7, "day")),
  ).length;
  const recent3dBorrowCount = records.filter((record) =>
    dayjs(record.borrowDate).isAfter(now.subtract(3, "day")),
  ).length;
  const recent24hBorrowCount = records.filter((record) =>
    dayjs(record.borrowDate).isAfter(now.subtract(24, "hour")),
  ).length;
  const activeBorrowCount = records.filter(
    (record) => record.status === "BORROWED" && !record.returnDate,
  ).length;
  const sameCategoryRecentBorrowCount = records.filter(
    (record) =>
      record.genre === currentBook?.genre &&
      dayjs(record.borrowDate).isAfter(now.subtract(30, "day")),
  ).length;
  const uniqueGenres7dCount = new Set(
    records
      .filter((record) => dayjs(record.borrowDate).isAfter(now.subtract(7, "day")))
      .map((record) => record.genre),
  ).size;

  let overdueCount = 0;
  let currentOverdueBorrowCount = 0;
  let maxOverdueDays = 0;
  let totalReturnDelayDays = 0;
  let returnedCount = 0;
  let hasUnreturnedOverdueBooks = false;

  for (const record of records) {
    const dueDate = dayjs(record.dueDate);
    const effectiveReturn = record.returnDate ? dayjs(record.returnDate) : now;
    const overdueDays = Math.max(effectiveReturn.diff(dueDate, "day"), 0);

    if (overdueDays > 0) {
      overdueCount += 1;
      maxOverdueDays = Math.max(maxOverdueDays, overdueDays);
    }

    if (!record.returnDate && overdueDays > 0) {
      hasUnreturnedOverdueBooks = true;
      currentOverdueBorrowCount += 1;
    }

    if (record.returnDate) {
      totalReturnDelayDays += diffInDays(record.returnDate, record.dueDate);
      returnedCount += 1;
    }
  }

  return {
    totalBorrowCount: records.length,
    activeBorrowCount,
    overdueCount,
    currentOverdueBorrowCount,
    maxOverdueDays,
    recent7dBorrowCount,
    recent24hBorrowCount,
    recent3dBorrowCount,
    sameCategoryRecentBorrowCount,
    uniqueGenres7dCount,
    avgReturnDelayDays:
      returnedCount > 0
        ? Number((totalReturnDelayDays / returnedCount).toFixed(2))
        : 0,
    hasUnreturnedOverdueBooks,
    accountAgeDays: user?.createdAt ? diffInDays(now.toDate(), user.createdAt) : 0,
    recent30dRiskEventCount: riskEvents.filter((event) =>
      event.createdAt && dayjs(event.createdAt).isAfter(now.subtract(30, "day")),
    ).length,
  };
}

export async function upsertUserRiskProfile(
  userId: string,
  features: RiskFeatures,
  risk: RiskResult,
  database = db,
) {
  const [existingProfile] = await database
    .select({
      id: userRiskProfiles.id,
      abnormalEventCount: userRiskProfiles.abnormalEventCount,
    })
    .from(userRiskProfiles)
    .where(eq(userRiskProfiles.userId, userId))
    .limit(1);

  const nextValues = {
    userId,
    currentScore: risk.score,
    currentLevel: risk.level,
    controlStatus: risk.controlStatus,
    restrictionReason: risk.restrictionReason,
    restrictedUntil: risk.restrictedUntil,
    requiresManualReview: risk.controlStatus === "REVIEW",
    totalBorrowCount: features.totalBorrowCount,
    activeBorrowCount: features.activeBorrowCount,
    overdueCount: features.overdueCount,
    maxOverdueDays: features.maxOverdueDays,
    recent7dBorrowCount: features.recent7dBorrowCount,
    recent24hBorrowCount: features.recent24hBorrowCount,
    abnormalEventCount:
      (existingProfile?.abnormalEventCount ?? 0) + (risk.level === "LOW" ? 0 : 1),
    lastEvaluatedAt: new Date(),
    updatedAt: new Date(),
  };

  if (!existingProfile?.id) {
    await database.insert(userRiskProfiles).values(nextValues);
    return;
  }

  await database
    .update(userRiskProfiles)
    .set(nextValues)
    .where(eq(userRiskProfiles.userId, userId));
}

export async function seedRiskRules(database = db) {
  const existingRules = await database.select().from(riskRules).limit(1);

  if (existingRules.length > 0) return;

  await database.insert(riskRules).values([
    {
      code: "SHORT_TIME_FREQUENT_BORROW",
      name: "High frequency borrowing",
      description: "Borrowing too many books within 24 hours.",
      weight: 30,
      enabled: true,
      thresholdConfig: { recent24hBorrowCount: 5 },
    },
    {
      code: "MULTIPLE_OVERDUE_HISTORY",
      name: "Multiple overdue records",
      description: "User has multiple overdue records in history.",
      weight: 25,
      enabled: true,
      thresholdConfig: { overdueCount: 3 },
    },
    {
      code: "TOO_MANY_ACTIVE_BORROWS",
      name: "Too many active borrows",
      description: "User currently keeps too many active borrowed books.",
      weight: 20,
      enabled: true,
      thresholdConfig: { activeBorrowCount: 8 },
    },
    {
      code: "LONG_TERM_OVERDUE",
      name: "Long-term overdue",
      description: "A book has remained overdue for more than 30 days.",
      weight: 25,
      enabled: true,
      thresholdConfig: { maxOverdueDays: 30 },
    },
    {
      code: "REPEAT_RISK_ALERTS",
      name: "Repeated risk alerts",
      description: "The account triggered multiple risk events in the last 30 days.",
      weight: 20,
      enabled: true,
      thresholdConfig: { recent30dRiskEventCount: 4 },
    },
  ]);
}
