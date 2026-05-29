import BookList from "@/components/BookList";
import BookOverview from "@/components/BookOverview";
import { db } from "@/database/drizzle";
import { books, users } from "@/database/schema";
import { auth } from "@/auth";
import { desc } from "drizzle-orm";

const Home = async () => {
  const session = await auth();

  const latestBooks = (await db
    .select()
    .from(books)
    .limit(10)
    .orderBy(desc(books.createdAt))) as Book[];

  return (
    <>
      <div className="mb-8 rounded-2xl bg-dark-300 p-6 text-light-100">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Demo Flow
        </p>
        <p className="mt-3 text-lg font-semibold">
          在此借阅图书，然后打开个人中心查看借阅记录。
        </p>
        <p className="mt-2 text-sm text-light-100/80">
          如以管理员身份登录，请打开风险仪表盘查看风险事件、用户档案更新及自然语言查询面板。
        </p>
      </div>

      <BookOverview {...latestBooks[0]} userId={session?.user?.id as string} />

      <BookList
        title="最新上架"
        books={latestBooks.slice(1)}
        containerClassName="mt-28"
      />
    </>
  );
};

export default Home;
