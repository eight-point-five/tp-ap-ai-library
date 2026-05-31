import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveUserScope, searchBooks } from "@/lib/ai-search/service";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    scope?: LlmScope;
    provider?: LlmProvider;
    title?: string;
    author?: string;
    isbn?: string;
    description?: string;
    imageBase64?: string;
    imageMimeType?: string;
    limit?: number;
  };

  const resolvedScope =
    body.scope || (await resolveUserScope(session.user.id));

  const result = await searchBooks({
    scope: resolvedScope,
    provider: body.provider,
    title: body.title,
    author: body.author,
    isbn: body.isbn,
    description: body.description,
    imageBase64: body.imageBase64,
    imageMimeType: body.imageMimeType,
    limit: body.limit,
  });

  return NextResponse.json(result);
}
