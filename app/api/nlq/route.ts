import { NextRequest, NextResponse } from "next/server";
import { parseNaturalLanguageQuery } from "@/lib/nlq/parser";
import { runParsedNaturalLanguageQuery } from "@/lib/nlq/query-builder";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const queryText = String(body?.query || "").trim();

  if (!queryText) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const parsed = parseNaturalLanguageQuery(queryText);
  const { results, generatedQuerySummary } =
    await runParsedNaturalLanguageQuery(parsed, queryText);

  return NextResponse.json({
    queryText,
    parsedIntent: parsed.intent,
    parsedFilters: parsed.filters,
    results,
    explanation: generatedQuerySummary,
  });
}
