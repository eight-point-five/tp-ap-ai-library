import dayjs from "dayjs";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import UserStatusControls from "@/components/admin/UserStatusControls";
import ControlStatusBadge from "@/components/risk/ControlStatusBadge";
import RiskBadge from "@/components/risk/RiskBadge";
import { db } from "@/database/drizzle";
import { userRiskProfiles, users } from "@/database/schema";
import { isInitialAdminEmail } from "@/lib/admin/permissions";

const RoleLabel = ({ role }: { role: string | null }) => (
  <span className="font-semibold text-dark-400">
    {role === "ADMIN" ? "管理员" : "普通用户"}
  </span>
);

const StatusLabel = ({ status }: { status: string | null }) => {
  const label =
    status === "APPROVED" ? "已批准" : status === "REJECTED" ? "已拒绝 / 已封禁" : "待审核";

  return <span className="text-dark-400">{label}</span>;
};

const CardLink = ({ href }: { href: string }) => (
  <Link
    href={href}
    target="_blank"
    className="font-semibold text-primary-admin"
  >
    查看材料
  </Link>
);

const Page = async () => {
  const session = await auth();

  const allUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      universityId: users.universityId,
      universityCard: users.universityCard,
      status: users.status,
      role: users.role,
      createdAt: users.createdAt,
      currentLevel: userRiskProfiles.currentLevel,
      currentScore: userRiskProfiles.currentScore,
      controlStatus: userRiskProfiles.controlStatus,
    })
    .from(users)
    .leftJoin(userRiskProfiles, eq(userRiskProfiles.userId, users.id))
    .orderBy(desc(users.createdAt));

  const pendingUsers = allUsers.filter((user) => user.status === "PENDING");

  return (
    <section className="space-y-7 rounded-2xl bg-white p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
          账号申请
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-dark-400">账号审核与历史记录</h2>
        <p className="mt-2 text-sm text-light-500">
          新账号可以申请普通用户或管理员角色，均需现有管理员审批。校园卡支持图片或 PDF，
          审核人员可以直接打开材料查看。
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <p className="text-sm text-light-500">待审核账号</p>
          <p className="mt-2 text-3xl font-semibold text-dark-400">{pendingUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <p className="text-sm text-light-500">待审核管理员申请</p>
          <p className="mt-2 text-3xl font-semibold text-dark-400">
            {pendingUsers.filter((user) => user.role === "ADMIN").length}
          </p>
        </div>
        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <p className="text-sm text-light-500">已批准账号</p>
          <p className="mt-2 text-3xl font-semibold text-dark-400">
            {allUsers.filter((user) => user.status === "APPROVED").length}
          </p>
        </div>
        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <p className="text-sm text-light-500">已拒绝 / 已封禁</p>
          <p className="mt-2 text-3xl font-semibold text-dark-400">
            {allUsers.filter((user) => user.status === "REJECTED").length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
        <h3 className="text-lg font-semibold text-dark-400">待审核账号</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-light-400 text-sm text-light-500">
                <th className="py-3 pr-4">用户</th>
                <th className="py-3 pr-4">申请角色</th>
                <th className="py-3 pr-4">学号</th>
                <th className="py-3 pr-4">校园卡材料</th>
                <th className="py-3 pr-4">提交时间</th>
                <th className="py-3 pr-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-5 text-sm text-light-500">
                    当前没有待审核账号。
                  </td>
                </tr>
              ) : (
                pendingUsers.map((user) => (
                  <tr key={user.id} className="border-b border-light-400/70 text-sm">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-dark-400">{user.fullName}</p>
                      <p className="mt-1 text-light-500">{user.email}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <RoleLabel role={user.role} />
                    </td>
                    <td className="py-4 pr-4 text-dark-400">{user.universityId}</td>
                    <td className="py-4 pr-4">
                      {user.universityCard ? (
                        <CardLink href={user.universityCard} />
                      ) : (
                        <span className="text-light-500">未上传</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-dark-400">
                      {user.createdAt
                        ? dayjs(user.createdAt).format("YYYY-MM-DD HH:mm")
                        : "-"}
                    </td>
                    <td className="py-4 pr-4">
                      <UserStatusControls
                        userId={user.id}
                        currentStatus={user.status}
                        isSelf={user.id === session?.user?.id}
                        isProtected={
                          user.role === "ADMIN" && isInitialAdminEmail(user.email)
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
        <h3 className="text-lg font-semibold text-dark-400">账号申请历史</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-light-400 text-sm text-light-500">
                <th className="py-3 pr-4">用户</th>
                <th className="py-3 pr-4">角色</th>
                <th className="py-3 pr-4">账号状态</th>
                <th className="py-3 pr-4">校园卡材料</th>
                <th className="py-3 pr-4">风控状态</th>
                <th className="py-3 pr-4">风险分数</th>
                <th className="py-3 pr-4">管理操作</th>
                <th className="py-3 pr-4">提交时间</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id} className="border-b border-light-400/70 text-sm">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-dark-400">{user.fullName}</p>
                    <p className="mt-1 text-light-500">{user.email}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <RoleLabel role={user.role} />
                  </td>
                  <td className="py-4 pr-4">
                    <StatusLabel status={user.status} />
                  </td>
                  <td className="py-4 pr-4">
                    {user.universityCard ? (
                      <CardLink href={user.universityCard} />
                    ) : (
                      <span className="text-light-500">未上传</span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    {user.currentLevel ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskBadge level={user.currentLevel} />
                        {user.controlStatus ? (
                          <ControlStatusBadge status={user.controlStatus} />
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-light-500">暂无风控档案</span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-dark-400">{user.currentScore ?? "-"}</td>
                  <td className="py-4 pr-4">
                    <UserStatusControls
                      userId={user.id}
                      currentStatus={user.status}
                      isSelf={user.id === session?.user?.id}
                      isProtected={
                        user.role === "ADMIN" && isInitialAdminEmail(user.email)
                      }
                    />
                  </td>
                  <td className="py-4 pr-4 text-dark-400">
                    {user.createdAt
                      ? dayjs(user.createdAt).format("YYYY-MM-DD HH:mm")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Page;
