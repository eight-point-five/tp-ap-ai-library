import React from "react";
import Link from "next/link";
import { desc } from "drizzle-orm";
import BookCover from "@/components/BookCover";
import BookDiscoveryWorkbench from "@/components/search/BookDiscoveryWorkbench";
import { Button } from "@/components/ui/button";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";

const Page = async () => {
  const allBooks = await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt));

  return (
    <section className="w-full rounded-2xl bg-white p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
            Catalog admin
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-dark-400">
            Books and multimodal search setup
          </h2>
        </div>
        <Button className="bg-primary-admin" asChild>
          <Link href="/admin/books/new" className="text-white">
            + Add book
          </Link>
        </Button>
      </div>

      <div className="mt-7 w-full overflow-x-auto">
        {allBooks.length === 0 ? (
          <p className="py-10 text-center text-light-500">
            No books found yet. Add one book first.
          </p>
        ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-light-400 text-sm text-light-500">
                <th className="py-3 pr-4">Cover</th>
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Author</th>
                <th className="py-3 pr-4">ISBN</th>
                <th className="py-3 pr-4">Genre</th>
                <th className="py-3 pr-4">Rating</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3 pr-4">Available</th>
                <th className="py-3">Action</th>
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
                  <td className="py-4 pr-4 text-dark-400">{book.isbn || "-"}</td>
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
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-8">
        <BookDiscoveryWorkbench
          scope="ADMIN"
          heading="管理员多模态检索与模型配置"
          subheading="在这里配置豆包或千问，保留原有精确查询能力，并测试基于描述或图片的模糊找书。"
        />
      </div>
    </section>
  );
};

export default Page;
