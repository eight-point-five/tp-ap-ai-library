import config from "@/lib/config";
import { buildRiskExplanation } from "@/lib/risk/explain";
import type { RiskFeatures, RiskReason, RiskResult } from "@/lib/risk/types";

const addReason = (
  reasons: RiskReason[],
  scoreRef: { value: number },
  reason: RiskReason,
) => {
  reasons.push(reason);
  scoreRef.value += reason.weight;
};

export function evaluateRiskByRules(features: RiskFeatures): RiskResult {
  const reasons: RiskReason[] = [];
  const scoreRef = { value: 0 };

  if (features.recent24hBorrowCount >= 5) {
    addReason(reasons, scoreRef, {
      code: "SHORT_TIME_FREQUENT_BORROW",
      message: `Borrowed ${features.recent24hBorrowCount} books within the last 24 hours.`,
      weight: 30,
    });
  }

  if (features.recent3dBorrowCount >= 8) {
    addReason(reasons, scoreRef, {
      code: "RECENT_BORROWING_SPIKE",
      message: `Borrowed ${features.recent3dBorrowCount} books within 3 days.`,
      weight: 16,
    });
  }

  if (features.overdueCount >= 3) {
    addReason(reasons, scoreRef, {
      code: "MULTIPLE_OVERDUE_HISTORY",
      message: `Historical overdue count reached ${features.overdueCount}.`,
      weight: 24,
    });
  }

  if (features.currentOverdueBorrowCount >= 2) {
    addReason(reasons, scoreRef, {
      code: "MULTIPLE_CURRENT_OVERDUE",
      message: `There are ${features.currentOverdueBorrowCount} currently overdue unreturned books.`,
      weight: 30,
    });
  }

  if (features.maxOverdueDays >= 30) {
    addReason(reasons, scoreRef, {
      code: "LONG_TERM_OVERDUE",
      message: `The longest overdue duration is ${features.maxOverdueDays} days.`,
      weight: 30,
    });
  } else if (features.maxOverdueDays >= 14) {
    addReason(reasons, scoreRef, {
      code: "MEDIUM_OVERDUE",
      message: `The longest overdue duration is ${features.maxOverdueDays} days.`,
      weight: 16,
    });
  }

  if (features.activeBorrowCount >= 8) {
    addReason(reasons, scoreRef, {
      code: "TOO_MANY_ACTIVE_BORROWS",
      message: `The user currently has ${features.activeBorrowCount} active borrowed books.`,
      weight: 18,
    });
  }

  if (features.sameCategoryRecentBorrowCount >= 6) {
    addReason(reasons, scoreRef, {
      code: "CATEGORY_CONCENTRATION",
      message: `The user recently borrowed ${features.sameCategoryRecentBorrowCount} books from the same category.`,
      weight: 10,
    });
  }

  if (features.uniqueGenres7dCount >= 5 && features.recent7dBorrowCount >= 6) {
    addReason(reasons, scoreRef, {
      code: "BROAD_SCRAPING_PATTERN",
      message: "Recent borrowing spans many genres with unusually high activity.",
      weight: 10,
    });
  }

  if (features.hasUnreturnedOverdueBooks) {
    addReason(reasons, scoreRef, {
      code: "UNRETURNED_OVERDUE_BOOK",
      message: "The account still has overdue books that have not been returned.",
      weight: 12,
    });
  }

  if (features.accountAgeDays <= 14 && features.recent7dBorrowCount >= 4) {
    addReason(reasons, scoreRef, {
      code: "NEW_ACCOUNT_HIGH_ACTIVITY",
      message: "A newly created account reached high borrowing activity in a short time.",
      weight: 12,
    });
  }

  if (features.recent30dRiskEventCount >= 4) {
    addReason(reasons, scoreRef, {
      code: "REPEAT_RISK_ALERTS",
      message: `Triggered ${features.recent30dRiskEventCount} risk events in the past 30 days.`,
      weight: 18,
    });
  }

  const score = Math.min(scoreRef.value, 100);

  const level =
    score >= config.env.riskHighThreshold
      ? "HIGH"
      : score >= config.env.riskMediumThreshold
        ? "MEDIUM"
        : "LOW";

  let controlStatus: ControlStatus = "NORMAL";
  let decision: RiskDecision = "ALLOW";
  let restrictionReason: string | null = null;
  let restrictedUntil: Date | null = null;

  const shouldBlock =
    features.maxOverdueDays >= 45 ||
    features.currentOverdueBorrowCount >= 3 ||
    (features.recent24hBorrowCount >= 6 && features.hasUnreturnedOverdueBooks) ||
    score >= 90;

  if (shouldBlock) {
    controlStatus = "BLOCKED";
    decision = "BLOCK";
    restrictionReason =
      "Severe overdue or repeated high-risk borrowing activity requires a temporary block.";
    restrictedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else if (score >= config.env.riskHighThreshold) {
    controlStatus = "REVIEW";
    decision = "REVIEW";
    restrictionReason =
      "High-risk account. Manual review is required before further borrowing.";
  } else if (score >= config.env.riskMediumThreshold || features.recent30dRiskEventCount >= 2) {
    controlStatus = "WATCH";
    restrictionReason =
      "The account should be watched closely because risk indicators are rising.";
  }

  return {
    score,
    level,
    decision,
    reasons,
    controlStatus,
    restrictionReason,
    restrictedUntil,
    explanation: buildRiskExplanation(score, level, reasons, controlStatus),
  };
}
