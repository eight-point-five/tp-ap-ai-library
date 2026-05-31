"use server";

import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { and, eq } from "drizzle-orm";
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
        error: "该书暂不可借阅",
      };
    }

    // 检查用户是否已借了同一本书且尚未归还
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
        error: "您已借阅此书且尚未归还，不能重复借阅同一本书。",
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
      error: "借阅过程中发生错误",
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
      return { success: false, error: "未找到该借阅记录。" };
    }

    if (record.status === "RETURNED") {
      return { success: false, error: "该书已经归还，无需重复操作。" };
    }

    // 更新借阅记录为已归还
    await db
      .update(borrowRecords)
      .set({
        status: "RETURNED",
        returnDate: dayjs().format("YYYY-MM-DD"),
      })
      .where(eq(borrowRecords.id, borrowRecordId));

    // 恢复图书可借数量
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
    return { success: false, error: "归还过程中发生错误" };
  }
};
