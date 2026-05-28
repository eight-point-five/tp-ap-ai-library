import Link from "next/link";
import RiskBadge from "@/components/risk/RiskBadge";

type RiskUserRow = {
  userId: string;
  fullName: string;
  email: string;
  currentScore: number;
  currentLevel: RiskLevel;
  activeBorrowCount: number;
  overdueCount: number;
  recent24hBorrowCount: number;
};

const RiskUserTable = ({ users }: { users: RiskUserRow[] }) => {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white p-7">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-dark-400">High Risk Users</h3>
        <p className="text-sm text-light-500">
          These users should be reviewed by an admin first.
        </p>
      </div>

      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b border-light-400 text-sm text-light-500">
            <th className="py-3 pr-4">User</th>
            <th className="py-3 pr-4">Score</th>
            <th className="py-3 pr-4">Level</th>
            <th className="py-3 pr-4">Active</th>
            <th className="py-3 pr-4">Overdue</th>
            <th className="py-3 pr-4">24h Borrows</th>
            <th className="py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td className="py-6 text-sm text-light-500" colSpan={7}>
                No high risk users yet.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.userId} className="border-b border-light-400/70 text-sm">
                <td className="py-4 pr-4">
                  <p className="font-semibold text-dark-400">{user.fullName}</p>
                  <p className="mt-1 text-light-500">{user.email}</p>
                </td>
                <td className="py-4 pr-4 font-semibold text-dark-400">
                  {user.currentScore}
                </td>
                <td className="py-4 pr-4">
                  <RiskBadge level={user.currentLevel} />
                </td>
                <td className="py-4 pr-4 text-dark-400">{user.activeBorrowCount}</td>
                <td className="py-4 pr-4 text-dark-400">{user.overdueCount}</td>
                <td className="py-4 pr-4 text-dark-400">{user.recent24hBorrowCount}</td>
                <td className="py-4">
                  <Link
                    href={`/admin/risk-users/${user.userId}`}
                    className="font-semibold text-primary-admin"
                  >
                    View details
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RiskUserTable;
