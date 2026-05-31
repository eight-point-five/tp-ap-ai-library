import type { RiskReason } from "@/lib/risk/types";

export const buildRiskExplanation = (
  score: number,
  level: RiskLevel,
  reasons: RiskReason[],
  controlStatus: ControlStatus,
) => {
  if (reasons.length === 0) {
    return `Risk score ${score}. No major anomalies were detected, the current level is ${level}, and the account remains in ${controlStatus} state.`;
  }

  const reasonText = reasons.map((reason) => reason.message).join("; ");

  return `Risk score ${score}, current level ${level}, control status ${controlStatus}. Key reasons: ${reasonText}.`;
};
