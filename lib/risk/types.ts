export type RiskFeatures = {
  totalBorrowCount: number;
  activeBorrowCount: number;
  overdueCount: number;
  maxOverdueDays: number;
  recent7dBorrowCount: number;
  recent24hBorrowCount: number;
  sameCategoryRecentBorrowCount: number;
  avgReturnDelayDays: number;
  hasUnreturnedOverdueBooks: boolean;
  accountAgeDays: number;
};

export type RiskReason = {
  code: string;
  message: string;
  weight: number;
};

export type RiskResult = {
  score: number;
  level: RiskLevel;
  decision: RiskDecision;
  reasons: RiskReason[];
  explanation: string;
};

export type UserRiskProfileSnapshot = {
  currentScore: number;
  currentLevel: RiskLevel;
  totalBorrowCount: number;
  activeBorrowCount: number;
  overdueCount: number;
  maxOverdueDays: number;
  recent7dBorrowCount: number;
  recent24hBorrowCount: number;
  abnormalEventCount: number;
};
