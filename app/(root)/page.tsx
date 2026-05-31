import BookList from "@/components/BookList";
import BookOverview from "@/components/BookOverview";
import BookDiscoveryWorkbench from "@/components/search/BookDiscoveryWorkbench";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { auth } from "@/auth";
import { desc } from "drizzle-orm";

const Home = async () => {
  const session = await auth();

  const latestBooks = (await db
    .select()
    .from(books)
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
          如以管理员身份登录，请打开风险监控界面查看风险事件、用户档案更新及自然语言查询面板。
        </p>
      </div>

      <BookOverview {...latestBooks[0]} userId={session?.user?.id as string} />

      <BookList
        title="最新上架"
        books={latestBooks.slice(1)}
        containerClassName="mt-28"
      />
      <div className="mt-14">
        <BookDiscoveryWorkbench
          scope="USER"
          heading="按书名、作者、ISBN、描述或图片找书"
          subheading="保留原有的精确查询方式，同时支持接入豆包或千问，实现自然语言模糊找书和图片辅助找书。"
        />
      </div>
    </>
  );
};

export default Home;
