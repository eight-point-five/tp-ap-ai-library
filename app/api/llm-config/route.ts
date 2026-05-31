import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { llmProviderConfigs, users } from "@/database/schema";
import { and, eq } from "drizzle-orm";
import {
  listLlmConfigs,
  resolveUserScope,
  upsertLlmConfig,
} from "@/lib/ai-search/service";

const isAdminUser = async (userId: string) => {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.role === "ADMIN";
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedScope = request.nextUrl.searchParams.get("scope") as
    | LlmScope
    | null;
  const userScope = await resolveUserScope(session.user.id);

  if (requestedScope === "ADMIN" && !(await isAdminUser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scope = requestedScope || userScope;
  const configs = await listLlmConfigs(scope);

  return NextResponse.json({ scope, configs });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    scope: LlmScope;
    provider: LlmProvider;
    model: string;
    apiBaseUrl: string;
    apiKey?: string;
    enabled?: boolean;
    supportsVision?: boolean;
    systemPrompt?: string;
  };

  if (
    !body.scope ||
    !body.provider ||
    !body.model?.trim() ||
    !body.apiBaseUrl?.trim()
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userScope = await resolveUserScope(session.user.id);
  if (body.scope === "ADMIN" && !(await isAdminUser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.scope !== userScope && userScope !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await upsertLlmConfig({
    scope: body.scope,
    provider: body.provider,
    model: body.model,
    apiBaseUrl: body.apiBaseUrl,
    apiKey: body.apiKey,
    enabled: body.enabled ?? false,
    supportsVision: body.supportsVision ?? true,
    systemPrompt: body.systemPrompt,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get("scope") as LlmScope | null;
  const provider = request.nextUrl.searchParams.get("provider") as
    | LlmProvider
    | null;

  if (!scope || !provider) {
    return NextResponse.json({ error: "Missing scope or provider" }, { status: 400 });
  }

  const userScope = await resolveUserScope(session.user.id);
  if (scope === "ADMIN" && !(await isAdminUser(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (scope !== userScope && userScope !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .delete(llmProviderConfigs)
    .where(
      and(
        eq(llmProviderConfigs.scope, scope),
        eq(llmProviderConfigs.provider, provider),
      ),
    );

  return NextResponse.json({ success: true });
}
