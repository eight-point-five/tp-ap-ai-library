import dayjs from "dayjs";
import { desc, eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books, borrowRecords, users } from "@/database/schema";

const Page = async () => {
  const records = await db
    .select({
      id: borrowRecords.id,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      status: borrowRecords.status,
      fullName: users.fullName,
      email: users.email,
      title: books.title,
      author: books.author,
    })
    .from(borrowRecords)
    .innerJoin(users, eq(borrowRecords.userId, users.id))
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .orderBy(desc(borrowRecords.borrowDate));

  const activeRecords = records.filter((record) => record.status === "BORROWED");
  const returnedRecords = records.filter((record) => record.status === "RETURNED");

  return (
    <section className="space-y-7 rounded-2xl bg-white p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
          借阅申请
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-dark-400">借阅记录与历史面板</h2>
        <p className="mt-2 text-sm text-light-500">
          当前系统采用直接借阅模式，因此这里展示所有借阅记录、当前在借情况以及历史归还记录，便于管理员回溯。
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <p className="text-sm text-light-500">总借阅记录</p>
          <p className="mt-2 text-3xl font-semibold text-dark-400">{records.length}</p>
        </div>
        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <p className="text-sm text-light-500">当前在借</p>
          <p className="mt-2 text-3xl font-semibold text-dark-400">{activeRecords.length}</p>
        </div>
        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <p className="text-sm text-light-500">已归还</p>
          <p className="mt-2 text-3xl font-semibold text-dark-400">{returnedRecords.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
        <h3 className="text-lg font-semibold text-dark-400">当前在借记录</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-light-400 text-sm text-light-500">
                <th className="py-3 pr-4">用户</th>
                <th className="py-3 pr-4">图书</th>
                <th className="py-3 pr-4">借阅时间</th>
                <th className="py-3 pr-4">应还时间</th>
                <th className="py-3 pr-4">状态</th>
              </tr>
            </thead>
            <tbody>
              {activeRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-5 text-sm text-light-500">
                    当前没有在借记录。
                  </td>
                </tr>
              ) : (
                activeRecords.map((record) => (
                  <tr key={record.id} className="border-b border-light-400/70 text-sm">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-dark-400">{record.fullName}</p>
                      <p className="mt-1 text-light-500">{record.email}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-dark-400">{record.title}</p>
                      <p className="mt-1 text-light-500">{record.author}</p>
                    </td>
                    <td className="py-4 pr-4 text-dark-400">
                      {record.borrowDate
                        ? dayjs(record.borrowDate).format("YYYY-MM-DD HH:mm")
                        : "-"}
                    </td>
                    <td className="py-4 pr-4 text-dark-400">{String(record.dueDate)}</td>
                    <td className="py-4 pr-4 text-dark-400">{record.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
        <h3 className="text-lg font-semibold text-dark-400">借阅历史记录</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-light-400 text-sm text-light-500">
                <th className="py-3 pr-4">用户</th>
                <th className="py-3 pr-4">图书</th>
                <th className="py-3 pr-4">借阅时间</th>
                <th className="py-3 pr-4">归还时间</th>
                <th className="py-3 pr-4">状态</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-light-400/70 text-sm">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-dark-400">{record.fullName}</p>
                    <p className="mt-1 text-light-500">{record.email}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-dark-400">{record.title}</p>
                    <p className="mt-1 text-light-500">{record.author}</p>
                  </td>
                  <td className="py-4 pr-4 text-dark-400">
                    {record.borrowDate
                      ? dayjs(record.borrowDate).format("YYYY-MM-DD HH:mm")
                      : "-"}
                  </td>
                  <td className="py-4 pr-4 text-dark-400">
                    {record.returnDate ? String(record.returnDate) : "未归还"}
                  </td>
                  <td className="py-4 pr-4 text-dark-400">{record.status}</td>
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
