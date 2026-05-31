import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books, llmProviderConfigs, users } from "@/database/schema";
import type {
  BookSearchInput,
  BookSearchResultItem,
  LlmConfigSummary,
} from "@/lib/ai-search/types";

const DEFAULT_SYSTEM_PROMPT =
  "You are a library discovery assistant. Match books from the provided catalog using exact fields, semantic clues, and visual hints if present. Return strict JSON only.";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const tokenize = (value?: string) =>
  (value || "")
    .toLowerCase()
    .split(/[\s,.;:!?\u3002\uff0c\u3001\uff1a\uff1b]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const maskJson = (raw: string) => {
  const cleaned = raw.replace(/^```json|```$/gim, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
};

const localScoreBook = (
  book: Omit<BookSearchResultItem, "score" | "matchReason">,
  input: BookSearchInput,
) => {
  let score = 0;
  const reasons: string[] = [];
  const haystack = `${book.title} ${book.author} ${book.genre} ${book.description} ${book.summary} ${book.isbn ?? ""}`.toLowerCase();

  if (input.title) {
    const query = input.title.toLowerCase();
    if (book.title.toLowerCase().includes(query)) {
      score += 55;
      reasons.push("title match");
    }
  }

  if (input.author) {
    const query = input.author.toLowerCase();
    if (book.author.toLowerCase().includes(query)) {
      score += 40;
      reasons.push("author match");
    }
  }

  if (input.isbn) {
    const query = input.isbn.toLowerCase();
    if ((book.isbn || "").toLowerCase().includes(query)) {
      score += 70;
      reasons.push("ISBN match");
    }
  }

  if (input.description) {
    const tokens = tokenize(input.description);
    const matchedTokens = tokens.filter((token) => haystack.includes(token));
    if (matchedTokens.length > 0) {
      score += clamp(matchedTokens.length * 8, 8, 40);
      reasons.push(`matched keywords: ${matchedTokens.slice(0, 5).join(", ")}`);
    }
  }

  if (input.imageBase64) {
    score += 5;
    reasons.push("image-assisted fallback ranking");
  }

  if (book.availableCopies > 0) {
    score += 4;
  }

  score += Math.round(book.rating * 2);

  return {
    score,
    matchReason: reasons.length > 0 ? reasons.join("; ") : "catalog similarity",
  };
};

const parseAiResponse = (raw: string) => {
  const cleaned = maskJson(raw);
  const parsed = JSON.parse(cleaned) as {
    matches?: Array<{
      id?: string;
      title?: string;
      isbn?: string;
      score?: number;
      reason?: string;
    }>;
  };

  return parsed.matches || [];
};

const buildUserMessage = (
  input: BookSearchInput,
  catalog: Array<{
    id: string;
    title: string;
    author: string;
    isbn: string | null;
    genre: string;
    description: string;
    summary: string;
  }>,
) => {
  const prompt = [
    "Find the best matching books from this catalog.",
    `Structured filters: title=${input.title || ""}; author=${input.author || ""}; isbn=${input.isbn || ""}.`,
    `Natural language request: ${input.description || "N/A"}.`,
    "Return JSON in the form: {\"matches\":[{\"id\":\"...\",\"score\":0-100,\"reason\":\"...\"}]}",
    "Catalog:",
    JSON.stringify(catalog),
  ].join("\n");

  if (!input.imageBase64) {
    return prompt;
  }

  return [
    {
      type: "text",
      text: prompt,
    },
    {
      type: "image_url",
      image_url: {
        url: `data:${input.imageMimeType || "image/png"};base64,${input.imageBase64}`,
      },
    },
  ];
};

export async function listLlmConfigs(scope?: LlmScope): Promise<LlmConfigSummary[]> {
  const filters = scope ? eq(llmProviderConfigs.scope, scope) : undefined;
  const rows = await db
    .select({
      id: llmProviderConfigs.id,
      scope: llmProviderConfigs.scope,
      provider: llmProviderConfigs.provider,
      model: llmProviderConfigs.model,
      apiBaseUrl: llmProviderConfigs.apiBaseUrl,
      enabled: llmProviderConfigs.enabled,
      supportsVision: llmProviderConfigs.supportsVision,
      systemPrompt: llmProviderConfigs.systemPrompt,
      apiKey: llmProviderConfigs.apiKey,
      updatedAt: llmProviderConfigs.updatedAt,
    })
    .from(llmProviderConfigs)
    .where(filters)
    .orderBy(asc(llmProviderConfigs.scope), asc(llmProviderConfigs.provider));

  return rows.map((row) => ({
    id: row.id,
    scope: row.scope,
    provider: row.provider,
    model: row.model,
    apiBaseUrl: row.apiBaseUrl,
    enabled: row.enabled,
    supportsVision: row.supportsVision,
    systemPrompt: row.systemPrompt,
    hasApiKey: Boolean(row.apiKey),
    updatedAt: row.updatedAt,
  }));
}

export async function upsertLlmConfig(input: {
  scope: LlmScope;
  provider: LlmProvider;
  model: string;
  apiBaseUrl: string;
  apiKey?: string;
  enabled: boolean;
  supportsVision: boolean;
  systemPrompt?: string;
}) {
  const [existing] = await db
    .select({
      id: llmProviderConfigs.id,
      apiKey: llmProviderConfigs.apiKey,
    })
    .from(llmProviderConfigs)
    .where(
      and(
        eq(llmProviderConfigs.scope, input.scope),
        eq(llmProviderConfigs.provider, input.provider),
      ),
    )
    .limit(1);

  if (input.enabled) {
    await db
      .update(llmProviderConfigs)
      .set({
        enabled: false,
        updatedAt: new Date(),
      })
      .where(eq(llmProviderConfigs.scope, input.scope));
  }

  const nextValues = {
    scope: input.scope,
    provider: input.provider,
    model: input.model.trim(),
    apiBaseUrl: input.apiBaseUrl.trim(),
    apiKey: input.apiKey?.trim() || existing?.apiKey || "",
    enabled: input.enabled,
    supportsVision: input.supportsVision,
    systemPrompt: input.systemPrompt?.trim() || null,
    updatedAt: new Date(),
  };

  if (!existing) {
    await db.insert(llmProviderConfigs).values(nextValues);
  } else {
    await db
      .update(llmProviderConfigs)
      .set(nextValues)
      .where(eq(llmProviderConfigs.id, existing.id));
  }
}

export async function resolveUserScope(userId: string): Promise<LlmScope> {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.role === "ADMIN" ? "ADMIN" : "USER";
}

async function getEnabledConfig(scope: LlmScope, provider?: LlmProvider) {
  const predicates = [eq(llmProviderConfigs.scope, scope), eq(llmProviderConfigs.enabled, true)];
  if (provider) {
    predicates.push(eq(llmProviderConfigs.provider, provider));
  }

  const [config] = await db
    .select()
    .from(llmProviderConfigs)
    .where(and(...predicates))
    .orderBy(desc(llmProviderConfigs.updatedAt))
    .limit(1);

  return config;
}

async function fetchCatalog(input: BookSearchInput) {
  const predicates = [];

  if (input.title) {
    predicates.push(ilike(books.title, `%${input.title}%`));
  }

  if (input.author) {
    predicates.push(ilike(books.author, `%${input.author}%`));
  }

  if (input.isbn) {
    predicates.push(ilike(books.isbn, `%${input.isbn}%`));
  }

  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      isbn: books.isbn,
      genre: books.genre,
      description: books.description,
      summary: books.summary,
      coverUrl: books.coverUrl,
      coverColor: books.coverColor,
      availableCopies: books.availableCopies,
      rating: books.rating,
    })
    .from(books)
    .where(predicates.length > 0 ? or(...predicates) : undefined)
    .orderBy(desc(books.createdAt))
    .limit(predicates.length > 0 ? 40 : 120);

  return rows;
}

async function searchWithAi(
  input: BookSearchInput,
  catalog: Awaited<ReturnType<typeof fetchCatalog>>,
) {
  const config = await getEnabledConfig(input.scope, input.provider);
  if (!config) {
    return null;
  }

  if (input.imageBase64 && !config.supportsVision) {
    return null;
  }

  const body = {
    model: config.model,
    temperature: 0.2,
    max_tokens: 1200,
    messages: [
      {
        role: "system",
        content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildUserMessage(
          input,
          catalog.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            description: book.description,
            summary: book.summary,
          })),
        ),
      },
    ],
  };

  const response = await fetch(config.apiBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`LLM search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM search returned empty content");
  }

  return parseAiResponse(content);
}

export async function searchBooks(input: BookSearchInput) {
  const catalog = await fetchCatalog(input);
  const fallback = catalog
    .map((book) => {
      const scored = localScoreBook(book, input);
      return { ...book, ...scored };
    })
    .filter((book) => book.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, input.limit || 12);

  if (!input.description && !input.imageBase64) {
    return {
      mode: "basic" as const,
      provider: null,
      results: fallback,
    };
  }

  try {
    const config = await getEnabledConfig(input.scope, input.provider);
    const aiMatches = config ? await searchWithAi(input, catalog) : null;
    if (!aiMatches || aiMatches.length === 0) {
      return {
        mode: "fallback" as const,
        provider: null,
        results: fallback,
      };
    }

    const byId = new Map(catalog.map((book) => [book.id, book]));
    const enriched: BookSearchResultItem[] = aiMatches
      .map((match) => {
        const book =
          (match.id ? byId.get(match.id) : undefined) ||
          catalog.find(
            (item) =>
              item.title === match.title ||
              (match.isbn && item.isbn === match.isbn),
          );

        if (!book) {
          return null;
        }

        return {
          ...book,
          score: clamp(Math.round(match.score ?? 80), 1, 100),
          matchReason: match.reason || "semantic multimodal match",
        };
      })
      .filter(Boolean) as BookSearchResultItem[];

    return {
      mode: "llm" as const,
      provider: config?.provider ?? null,
      results: enriched.length > 0 ? enriched : fallback,
    };
  } catch {
    return {
      mode: "fallback" as const,
      provider: null,
      results: fallback,
    };
  }
}
