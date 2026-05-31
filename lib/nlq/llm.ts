import { and, desc, eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { llmProviderConfigs } from "@/database/schema";
import type { ParsedQuery } from "@/lib/nlq/parser";

const normalizeJson = (raw: string) => {
  const cleaned = raw.replace(/^```json|```$/gim, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
};

export async function parseNaturalLanguageQueryWithLlm(query: string) {
  const [config] = await db
    .select()
    .from(llmProviderConfigs)
    .where(
      and(
        eq(llmProviderConfigs.scope, "ADMIN"),
        eq(llmProviderConfigs.enabled, true),
      ),
    )
    .orderBy(desc(llmProviderConfigs.updatedAt))
    .limit(1);

  if (!config) {
    return null;
  }

  const response = await fetch(config.apiBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            config.systemPrompt ||
            [
              "你是图书馆风控系统的自然语言查询解析器。",
              "请把用户输入解析为严格 JSON。",
              '仅允许这些 intent: USER_RISK_LIST, RISK_EVENT_LIST, BLOCKED_USER_LIST, REVIEW_USER_LIST, UNKNOWN。',
              'filters 只允许这些键：riskLevel, controlStatus, recent24hBorrowCountGte, maxOverdueDaysGte, activeBorrowCountGte, days。',
              '示例输出：{"intent":"USER_RISK_LIST","filters":{"riskLevel":"HIGH"}}',
            ].join("\n"),
        },
        {
          role: "user",
          content: query,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`NLQ LLM failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("NLQ LLM returned empty content");
  }

  const parsed = JSON.parse(normalizeJson(content)) as ParsedQuery;
  return {
    parsed,
    provider: config.provider as LlmProvider,
  };
}
