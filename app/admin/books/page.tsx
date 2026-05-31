import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { desc } from "drizzle-orm";
import BookCover from "@/components/BookCover";

const Page = async () => {
  const allBooks = await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt));

  return (
    <section className="w-full rounded-2xl bg-white p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">全部图书</h2>
        <Button className="bg-primary-admin" asChild>
          <Link href="/admin/books/new" className="text-white">
            + 新增图书
          </Link>
        </Button>
      </div>

      <div className="mt-7 w-full overflow-x-auto">
        {allBooks.length === 0 ? (
          <p className="py-10 text-center text-light-500">暂无图书，请先添加。</p>
        ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-light-400 text-sm text-light-500">
                <th className="py-3 pr-4">封面</th>
                <th className="py-3 pr-4">书名</th>
                <th className="py-3 pr-4">作者</th>
                <th className="py-3 pr-4">分类</th>
                <th className="py-3 pr-4">评分</th>
                <th className="py-3 pr-4">馆藏</th>
                <th className="py-3 pr-4">可借</th>
                <th className="py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {allBooks.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-light-400/70 text-sm"
                >
                  <td className="py-4 pr-4">
                    <BookCover
                      coverColor={book.coverColor}
                      coverImage={book.coverUrl}
                      variant="extraSmall"
                    />
                  </td>
                  <td className="py-4 pr-4 font-semibold text-dark-400">
                    {book.title}
                  </td>
                  <td className="py-4 pr-4 text-dark-400">{book.author}</td>
                  <td className="py-4 pr-4 text-dark-400">{book.genre}</td>
                  <td className="py-4 pr-4 text-dark-400">{book.rating} / 5</td>
                  <td className="py-4 pr-4 text-dark-400">
                    {book.totalCopies}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={
                        book.availableCopies > 0
                          ? "text-dark-400"
                          : "text-red-500"
                      }
                    >
                      {book.availableCopies}
                    </span>
                  </td>
                  <td className="py-4">
                    <Link
                      href={`/books/${book.id}`}
                      className="font-semibold text-primary-admin hover:underline"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default Page;
