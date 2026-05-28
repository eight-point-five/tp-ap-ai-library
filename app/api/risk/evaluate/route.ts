import { NextRequest, NextResponse } from "next/server";
import { buildRiskFeatures } from "@/lib/risk/features";
import { evaluateRiskByRules } from "@/lib/risk/rule-model";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, bookId } = body as {
    userId?: string;
    bookId?: string;
    eventType?: RiskEventType;
  };

  if (!userId || !bookId) {
    return NextResponse.json(
      { error: "userId and bookId are required" },
      { status: 400 },
    );
  }

  const features = await buildRiskFeatures(userId, bookId);
  const risk = evaluateRiskByRules(features);

  return NextResponse.json({
    riskScore: risk.score,
    riskLevel: risk.level,
    decision: risk.decision,
    reasons: risk.reasons,
    explanation: risk.explanation,
    features,
  });
}
