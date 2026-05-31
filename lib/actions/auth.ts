"use server";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import ratelimit from "@/lib/ratelimit";
import { workflowClient } from "@/lib/workflow";
import config from "@/lib/config";

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">,
) => {
  const { email, password } = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false,
        error: "登录失败，请检查账号密码，或确认账号已通过管理员审核且未被封禁。",
      };
    }

    return { success: true };
  } catch (error) {
    console.log(error, "login failed");
    return { success: false, error: "登录失败" };
  }
};

export const signUp = async (params: AuthCredentials) => {
  const {
    fullName,
    email,
    universityId,
    password,
    universityCard,
    role,
  } = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: "该用户已存在" };
  }

  const hashedPassword = await hash(password, 10);

  try {
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      password: hashedPassword,
      universityCard,
      role,
      status: "PENDING",
    });

    await workflowClient.trigger({
      url: `${config.env.prodApiEndpoint}/api/workflows/onboarding`,
      body: {
        email,
        fullName,
      },
    });

    return {
      success: true,
      message:
        role === "ADMIN"
          ? "管理员账号申请已提交，请等待已有管理员审批。"
          : "注册成功，账号已提交审核，请等待管理员批准。",
    };
  } catch (error) {
    console.log(error, "signup failed");
    return { success: false, error: "注册失败" };
  }
};
