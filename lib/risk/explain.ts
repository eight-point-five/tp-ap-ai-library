import type { RiskReason } from "@/lib/risk/types";

export const buildRiskExplanation = (
  score: number,
  level: RiskLevel,
  reasons: RiskReason[],
) => {
  if (reasons.length === 0) {
    return `当前风险评分为 ${score}，未检测到重大异常借阅行为，用户风险等级为 ${level}。`;
  }

  const reasonText = reasons.map((reason) => reason.message).join("; ");

  return `当前风险评分为 ${score}，风险等级为 ${level}。主要原因为：${reasonText}。建议管理员进行人工审核。`;
};
