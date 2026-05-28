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
          Borrow a book here, then open My Profile to see the saved borrow record.
        </p>
        <p className="mt-2 text-sm text-light-100/80">
          If you are logged in as admin, open Risk Dashboard to see the risk event,
          user profile updates, and natural language query panel.
        </p>
      </div>

      <BookOverview {...latestBooks[0]} userId={session?.user?.id as string} />

      <BookList
        title="Latest Books"
        books={latestBooks.slice(1)}
        containerClassName="mt-28"
      />
    </>
  );
};

export default Home;
