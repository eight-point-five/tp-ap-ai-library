"use server";

import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { evaluateBorrowRisk, getBorrowingEligibility } from "@/lib/risk/service";

export const borrowBook = async (params: BorrowBookParams) => {
  const { userId, bookId } = params;

  try {
    const eligibility = await getBorrowingEligibility(userId);
    if (!eligibility.isEligible) {
      return {
        success: false,
        error: eligibility.message,
      };
    }

    const book = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book.length || book[0].availableCopies <= 0) {
      return {
        success: false,
        error: "This book is currently unavailable.",
      };
    }

    const existingBorrow = await db
      .select({ id: borrowRecords.id })
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.userId, userId),
          eq(borrowRecords.bookId, bookId),
          eq(borrowRecords.status, "BORROWED"),
        ),
      )
      .limit(1);

    if (existingBorrow.length > 0) {
      return {
        success: false,
        error: "You have already borrowed this book and have not returned it yet.",
      };
    }

    const dueDate = dayjs().add(7, "day").format("YYYY-MM-DD");

    const [record] = await db
      .insert(borrowRecords)
      .values({
        userId,
        bookId,
        dueDate,
        status: "BORROWED",
      })
      .returning({ id: borrowRecords.id });

    await db
      .update(books)
      .set({ availableCopies: book[0].availableCopies - 1 })
      .where(eq(books.id, bookId));

    if (record?.id) {
      await evaluateBorrowRisk({
        userId,
        bookId,
        borrowRecordId: record.id,
        eventType: "BORROW",
      });
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(record)),
    };
  } catch (error) {
    console.log(error);

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      String(error.message).includes("borrow_records_active_unique_user_book_idx")
    ) {
      return {
        success: false,
        error: "You have already borrowed this book and have not returned it yet.",
      };
    }

    return {
      success: false,
      error: "An error occurred while borrowing this book.",
    };
  }
};

export const returnBook = async (borrowRecordId: string) => {
  try {
    const [record] = await db
      .select({ bookId: borrowRecords.bookId, status: borrowRecords.status })
      .from(borrowRecords)
      .where(eq(borrowRecords.id, borrowRecordId))
      .limit(1);

    if (!record) {
      return { success: false, error: "Borrow record not found." };
    }

    if (record.status === "RETURNED") {
      return { success: false, error: "This book has already been returned." };
    }

    await db
      .update(borrowRecords)
      .set({
        status: "RETURNED",
        returnDate: dayjs().format("YYYY-MM-DD"),
      })
      .where(eq(borrowRecords.id, borrowRecordId));

    const [book] = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, record.bookId))
      .limit(1);

    if (book) {
      await db
        .update(books)
        .set({ availableCopies: book.availableCopies + 1 })
        .where(eq(books.id, record.bookId));
    }

    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, error: "An error occurred while returning the book." };
  }
};
