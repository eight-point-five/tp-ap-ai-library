"use server";

import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { eq } from "drizzle-orm";
import dayjs from "dayjs";
import { evaluateBorrowRisk } from "@/lib/risk/service";

export const borrowBook = async (params: BorrowBookParams) => {
  const { userId, bookId } = params;

  try {
    const book = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book.length || book[0].availableCopies <= 0) {
      return {
        success: false,
        error: "Book is not available for borrowing",
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

    return {
      success: false,
      error: "An error occurred while borrowing the book",
    };
  }
};
