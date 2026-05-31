import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { isInitialAdminEmail } from "@/lib/admin/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (currentUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { status?: "APPROVED" | "REJECTED" };

  if (!body.status || !["APPROVED", "REJECTED"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot change the status of your own account" },
      { status: 400 },
    );
  }

  const [target] = await db
    .select({ id: users.id, role: users.role, email: users.email })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (
    body.status === "REJECTED" &&
    target.role === "ADMIN" &&
    isInitialAdminEmail(target.email)
  ) {
    return NextResponse.json(
      { error: "初始演示管理员账号受保护，不能被封禁。" },
      { status: 403 },
    );
  }

  await db
    .update(users)
    .set({ status: body.status })
    .where(eq(users.id, id));

  return NextResponse.json({ success: true });
}
