export type RiskFeatures = {
  totalBorrowCount: number;
  activeBorrowCount: number;
  overdueCount: number;
  currentOverdueBorrowCount: number;
  maxOverdueDays: number;
  recent7dBorrowCount: number;
  recent24hBorrowCount: number;
  recent3dBorrowCount: number;
  sameCategoryRecentBorrowCount: number;
  uniqueGenres7dCount: number;
  avgReturnDelayDays: number;
  hasUnreturnedOverdueBooks: boolean;
  accountAgeDays: number;
  recent30dRiskEventCount: number;
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
  controlStatus: ControlStatus;
  restrictionReason: string | null;
  restrictedUntil: Date | null;
};

export type UserRiskProfileSnapshot = {
  currentScore: number;
  currentLevel: RiskLevel;
  controlStatus: ControlStatus;
  totalBorrowCount: number;
  activeBorrowCount: number;
  overdueCount: number;
  maxOverdueDays: number;
  recent7dBorrowCount: number;
  recent24hBorrowCount: number;
  abnormalEventCount: number;
};
