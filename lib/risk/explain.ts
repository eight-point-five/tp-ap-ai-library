import type { RiskReason } from "@/lib/risk/types";

export const buildRiskExplanation = (
  score: number,
  level: RiskLevel,
  reasons: RiskReason[],
) => {
  if (reasons.length === 0) {
    return `Current risk score is ${score}. No major abnormal borrowing behavior was detected, so the user is classified as ${level}.`;
  }

  const reasonText = reasons.map((reason) => reason.message).join("; ");

  return `Current risk score is ${score} and the risk level is ${level}. Key reasons: ${reasonText} Manual admin review is recommended.`;
};
