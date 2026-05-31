import { NextResponse } from "next/server";
import { getRiskDashboardData } from "@/lib/risk/service";

export async function GET() {
  const data = await getRiskDashboardData();
  return NextResponse.json(data);
}
