import { NextResponse } from "next/server";
import { getUserRiskDetail } from "@/lib/risk/service";

export async function GET(
  _: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  const data = await getUserRiskDetail(userId);

  return NextResponse.json(data);
}
