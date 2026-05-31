export type ParsedQuery = {
  intent:
    | "USER_RISK_LIST"
    | "RISK_EVENT_LIST"
    | "BLOCKED_USER_LIST"
    | "REVIEW_USER_LIST"
    | "UNKNOWN";
  filters: Record<string, string | number>;
};

export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const normalized = query.toLowerCase();

  if (normalized.includes("高风险")) {
    return { intent: "USER_RISK_LIST", filters: { riskLevel: "HIGH" } };
  }

  if (normalized.includes("被封") || normalized.includes("封禁") || normalized.includes("blocked")) {
    return { intent: "BLOCKED_USER_LIST", filters: { controlStatus: "BLOCKED" } };
  }

  if (normalized.includes("人工审核") || normalized.includes("review")) {
    return { intent: "REVIEW_USER_LIST", filters: { controlStatus: "REVIEW" } };
  }

  if (
    (normalized.includes("最近7天") || normalized.includes("近7天")) &&
    (normalized.includes("异常") || normalized.includes("风险事件"))
  ) {
    return { intent: "RISK_EVENT_LIST", filters: { days: 7 } };
  }

  if (normalized.includes("24小时") && (normalized.includes("超过5次") || normalized.includes("大于5次"))) {
    return {
      intent: "USER_RISK_LIST",
      filters: { recent24hBorrowCountGte: 5 },
    };
  }

  if (normalized.includes("逾期超过30天") || normalized.includes("最长逾期")) {
    return {
      intent: "USER_RISK_LIST",
      filters: { maxOverdueDaysGte: 30 },
    };
  }

  if (
    (normalized.includes("未归还") || normalized.includes("在借")) &&
    (normalized.includes("超过8本") || normalized.includes("大于8本"))
  ) {
    return {
      intent: "USER_RISK_LIST",
      filters: { activeBorrowCountGte: 8 },
    };
  }

  return { intent: "UNKNOWN", filters: {} };
}
