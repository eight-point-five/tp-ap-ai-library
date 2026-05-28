import React from "react";
import Link from "next/link";
import { signOut, auth } from "@/auth";
import { db } from "@/database/drizzle";
import { books, borrowRecords, borrowRiskEvents, users } from "@/database/schema";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import BookList from "@/components/BookList";

const Page = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [currentUser] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const borrowedBooks = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      rating: books.rating,
      totalCopies: books.totalCopies,
      availableCopies: books.availableCopies,
      description: books.description,
      coverColor: books.coverColor,
      coverUrl: books.coverUrl,
      videoUrl: books.videoUrl,
      summary: books.summary,
      createdAt: books.createdAt,
      dueDate: borrowRecords.dueDate,
      borrowDate: borrowRecords.borrowDate,
      borrowStatus: borrowRecords.status,
      riskLevel: borrowRiskEvents.riskLevel,
      riskScore: borrowRiskEvents.riskScore,
    })
    .from(borrowRecords)
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(
      borrowRiskEvents,
      eq(borrowRiskEvents.borrowRecordId, borrowRecords.id),
    )
    .where(eq(borrowRecords.userId, session.user.id))
    .orderBy(desc(borrowRecords.borrowDate));

  const mappedBooks: Book[] = borrowedBooks.map((record) => ({
    ...record,
    isLoanedBook: true,
  }));

  return (
    <>
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            My Profile
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            {currentUser?.fullName}
          </h1>
          <p className="mt-3 text-light-100">
            {currentUser?.email} · Role: {currentUser?.role} · Status: {currentUser?.status}
          </p>
          <p className="mt-3 max-w-2xl text-light-100">
            This page now shows your real borrow records from the database, including
            due dates and the risk level generated during borrow events.
          </p>
        </div>

        <div className="flex gap-3">
          {currentUser?.role === "ADMIN" ? (
            <Button asChild className="bg-primary-admin text-white">
              <Link href="/admin/risk-dashboard">Open Risk Dashboard</Link>
            </Button>
          ) : null}

          <form
            action={async () => {
              "use server";

              await signOut();
            }}
          >
            <Button>Logout</Button>
          </form>
        </div>
      </div>

      <BookList title="Borrowed Books" books={mappedBooks} />

      {mappedBooks.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-dark-300 p-6 text-light-100">
          <p className="text-lg font-semibold">No borrowed books yet.</p>
          <p className="mt-2 text-sm text-light-100/80">
            Go back to the home page, borrow a book, and then refresh this page to
            see the TP + AP + AI chain reflected here.
          </p>
        </div>
      ) : null}
    </>
  );
};

export default Page;
