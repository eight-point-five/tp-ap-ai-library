import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { userRiskProfiles, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import RiskBadge from "@/components/risk/RiskBadge";

const Page = async () => {
  const allUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      universityId: users.universityId,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      currentLevel: userRiskProfiles.currentLevel,
      currentScore: userRiskProfiles.currentScore,
    })
    .from(users)
    .leftJoin(userRiskProfiles, eq(userRiskProfiles.userId, users.id))
    .orderBy(desc(users.createdAt));

  return (
    <section className="rounded-2xl bg-white p-7">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
          Admin Users
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-dark-400">All Users</h2>
        <p className="mt-2 text-sm text-light-500">
          This page now reads real users from the database. Admin accounts can jump
          from here into the risk detail page.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-light-400 text-sm text-light-500">
              <th className="py-3 pr-4">User</th>
              <th className="py-3 pr-4">University ID</th>
              <th className="py-3 pr-4">Role</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Risk</th>
              <th className="py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-b border-light-400/70 text-sm">
                <td className="py-4 pr-4">
                  <p className="font-semibold text-dark-400">{user.fullName}</p>
                  <p className="mt-1 text-light-500">{user.email}</p>
                </td>
                <td className="py-4 pr-4 text-dark-400">{user.universityId}</td>
                <td className="py-4 pr-4 text-dark-400">{user.role}</td>
                <td className="py-4 pr-4 text-dark-400">{user.status}</td>
                <td className="py-4 pr-4">
                  {user.currentLevel ? (
                    <div className="flex items-center gap-3">
                      <RiskBadge level={user.currentLevel} />
                      <span className="text-dark-400">{user.currentScore ?? 0}</span>
                    </div>
                  ) : (
                    <span className="text-light-500">No profile yet</span>
                  )}
                </td>
                <td className="py-4">
                  <Link
                    href={`/admin/risk-users/${user.id}`}
                    className="font-semibold text-primary-admin"
                  >
                    View risk detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Page;
