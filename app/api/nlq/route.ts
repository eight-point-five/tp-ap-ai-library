import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseNaturalLanguageQuery } from "@/lib/nlq/parser";
import { parseNaturalLanguageQueryWithLlm } from "@/lib/nlq/llm";
import { runParsedNaturalLanguageQuery } from "@/lib/nlq/query-builder";

export async function POST(request: NextRequest) {
  const session = await auth();
  const body = await request.json();
  const queryText = String(body?.query || "").trim();

  if (!queryText) {
    return NextResponse.json({ error: "请输入查询内容" }, { status: 400 });
  }

  let parsed = parseNaturalLanguageQuery(queryText);
  let mode: "rule" | "llm" = "rule";
  let provider: LlmProvider | null = null;

  try {
    const llmParsed = await parseNaturalLanguageQueryWithLlm(queryText);
    if (llmParsed) {
      parsed = llmParsed.parsed;
      provider = llmParsed.provider;
      mode = "llm";
    }
  } catch {
    mode = "rule";
  }

  const { results, generatedQuerySummary } =
    await runParsedNaturalLanguageQuery(parsed, queryText, session?.user?.id);

  return NextResponse.json({
    queryText,
    parsedIntent: parsed.intent,
    parsedFilters: parsed.filters,
    results,
    explanation: generatedQuerySummary,
    mode,
    provider,
  });
}
