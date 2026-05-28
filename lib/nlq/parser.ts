export type ParsedQuery = {
  intent: "USER_RISK_LIST" | "RISK_EVENT_LIST" | "UNKNOWN";
  filters: Record<string, string | number>;
};

export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  if (query.includes("高风险")) {
    return { intent: "USER_RISK_LIST", filters: { riskLevel: "HIGH" } };
  }

  if (query.includes("最近7天") && query.includes("异常")) {
    return { intent: "RISK_EVENT_LIST", filters: { days: 7 } };
  }

  if (query.includes("24小时") && query.includes("超过5次")) {
    return {
      intent: "USER_RISK_LIST",
      filters: { recent24hBorrowCountGte: 5 },
    };
  }

  if (query.includes("逾期超过30天")) {
    return {
      intent: "USER_RISK_LIST",
      filters: { maxOverdueDaysGte: 30 },
    };
  }

  if (query.includes("未归还") && query.includes("超过8本")) {
    return {
      intent: "USER_RISK_LIST",
      filters: { activeBorrowCountGte: 8 },
    };
  }

  return { intent: "UNKNOWN", filters: {} };
}
