import dayjs from "dayjs";
import { and, desc, eq, gte, type SQL } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  books,
  borrowRiskEvents,
  nlqLogs,
  userRiskProfiles,
  users,
} from "@/database/schema";
import type { ParsedQuery } from "@/lib/nlq/parser";

export async function runParsedNaturalLanguageQuery(
  parsed: ParsedQuery,
  queryText: string,
  userId?: string,
) {
  let results: unknown[] = [];
  let generatedQuerySummary = "未匹配到可执行的自然语言规则。";

  if (parsed.intent === "USER_RISK_LIST") {
    const filters: SQL[] = [];

    if (parsed.filters.riskLevel) {
      filters.push(
        eq(userRiskProfiles.currentLevel, parsed.filters.riskLevel as RiskLevel),
      );
    }

    if (parsed.filters.recent24hBorrowCountGte) {
      filters.push(
        gte(
          userRiskProfiles.recent24hBorrowCount,
          Number(parsed.filters.recent24hBorrowCountGte),
        ),
      );
    }

    if (parsed.filters.maxOverdueDaysGte) {
      filters.push(
        gte(
          userRiskProfiles.maxOverdueDays,
          Number(parsed.filters.maxOverdueDaysGte),
        ),
      );
    }

    if (parsed.filters.activeBorrowCountGte) {
      filters.push(
        gte(
          userRiskProfiles.activeBorrowCount,
          Number(parsed.filters.activeBorrowCountGte),
        ),
      );
    }

    results = await db
      .select({
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        currentScore: userRiskProfiles.currentScore,
        currentLevel: userRiskProfiles.currentLevel,
        activeBorrowCount: userRiskProfiles.activeBorrowCount,
        overdueCount: userRiskProfiles.overdueCount,
        recent24hBorrowCount: userRiskProfiles.recent24hBorrowCount,
      })
      .from(userRiskProfiles)
      .innerJoin(users, eq(userRiskProfiles.userId, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(userRiskProfiles.currentScore))
      .limit(20);

    generatedQuerySummary = "根据解析的风险条件筛选用户风险档案。";
  }

  if (parsed.intent === "RISK_EVENT_LIST") {
    const days = Number(parsed.filters.days || 7);
    const since = dayjs().subtract(days, "day").toDate();

    results = await db
      .select({
        id: borrowRiskEvents.id,
        createdAt: borrowRiskEvents.createdAt,
        riskScore: borrowRiskEvents.riskScore,
        riskLevel: borrowRiskEvents.riskLevel,
        decision: borrowRiskEvents.decision,
        explanation: borrowRiskEvents.aiExplanation,
        fullName: users.fullName,
        bookTitle: books.title,
      })
      .from(borrowRiskEvents)
      .innerJoin(users, eq(borrowRiskEvents.userId, users.id))
      .innerJoin(books, eq(borrowRiskEvents.bookId, books.id))
      .where(gte(borrowRiskEvents.createdAt, since))
      .orderBy(desc(borrowRiskEvents.createdAt))
      .limit(20);

    generatedQuerySummary = `获取了最近 ${days} 天内生成的风险事件。`;
  }

  await db.insert(nlqLogs).values({
    userId: userId || null,
    queryText,
    parsedIntent: parsed.intent,
    parsedFilters: parsed.filters,
    generatedQuerySummary,
    resultCount: results.length,
  });

  return {
    results,
    generatedQuerySummary,
  };
}
