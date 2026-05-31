import config from "@/lib/config";
import { buildRiskExplanation } from "@/lib/risk/explain";
import type { RiskFeatures, RiskReason, RiskResult } from "@/lib/risk/types";

export function evaluateRiskByRules(features: RiskFeatures): RiskResult {
  let score = 0;
  const reasons: RiskReason[] = [];

  if (features.recent24hBorrowCount >= 5) {
    score += 30;
    reasons.push({
      code: "SHORT_TIME_FREQUENT_BORROW",
      message: "用户在24小时内借阅图书数量过多。",
      weight: 30,
    });
  }

  if (features.overdueCount >= 3) {
    score += 25;
    reasons.push({
      code: "MULTIPLE_OVERDUE_HISTORY",
      message: "用户历史中存在多条逾期记录。",
      weight: 25,
    });
  }

  if (features.activeBorrowCount >= 8) {
    score += 20;
    reasons.push({
      code: "TOO_MANY_ACTIVE_BORROWS",
      message: "用户当前在借图书数量过多。",
      weight: 20,
    });
  }

  if (features.maxOverdueDays >= 30) {
    score += 25;
    reasons.push({
      code: "LONG_TERM_OVERDUE",
      message: "用户存在长期逾期未还记录。",
      weight: 25,
    });
  }

  if (features.hasUnreturnedOverdueBooks) {
    score += 10;
    reasons.push({
      code: "UNRETURNED_OVERDUE_BOOK",
      message: "用户仍有逾期图书未归还。",
      weight: 10,
    });
  }

  if (features.accountAgeDays <= 14 && features.recent7dBorrowCount >= 4) {
    score += 10;
    reasons.push({
      code: "NEW_ACCOUNT_HIGH_ACTIVITY",
      message: "新注册账号在短时间内频繁借阅。",
      weight: 10,
    });
  }

  score = Math.min(score, 100);

  const level =
    score >= config.env.riskHighThreshold
      ? "HIGH"
      : score >= config.env.riskMediumThreshold
        ? "MEDIUM"
        : "LOW";

  const decision: RiskDecision = score >= config.env.riskHighThreshold
    ? "REVIEW"
    : "ALLOW";

  return {
    score,
    level,
    decision,
    reasons,
    explanation: buildRiskExplanation(score, level, reasons),
  };
}
