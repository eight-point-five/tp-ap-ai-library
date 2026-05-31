import React from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import ReturnBookButton from "@/components/ReturnBookButton";
import dayjs from "dayjs";

const BookCard = ({
  id,
  bookId,
  title,
  genre,
  coverColor,
  coverUrl,
  isLoanedBook = false,
  dueDate,
  borrowStatus,
  riskLevel,
  riskScore,
}: Book) => {
  // 借出的书用书籍 ID 跳转详情，未借出的书用 id
  const detailHref = isLoanedBook && bookId ? `/books/${bookId}` : `/books/${id}`;

  // 借出的书：不用外层 Link，布局更自由
  if (isLoanedBook) {
    return (
      <li className="xs:w-52 w-full">
        <div className="flex w-full flex-col items-center">
          <Link href={detailHref}>
            <BookCover coverColor={coverColor} coverImage={coverUrl} />
          </Link>

          <div className="mt-4 w-full">
            <Link href={detailHref}>
              <p className="book-title">{title}</p>
              <p className="book-genre">{genre}</p>
            </Link>
          </div>

          <div className="mt-3 w-full">
            <div className="book-loaned">
              <Image
                src="/icons/calendar.svg"
                alt="calendar"
                width={18}
                height={18}
                className="object-contain"
              />
              <p className="text-light-100">
                {dueDate
                  ? `剩余 ${Math.max(dayjs(dueDate).diff(dayjs(), "day"), 0)} 天需归还`
                  : "已借出"}
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {borrowStatus ? (
                <p className="text-sm text-light-100">状态：{borrowStatus}</p>
              ) : null}
              {riskLevel ? (
                <p className="text-sm text-light-100">
                  风险：{riskLevel}
                  {typeof riskScore === "number" ? ` (${riskScore})` : ""}
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex gap-2">
              <Link href={detailHref} className="flex-1">
                <Button className="book-btn w-full text-white">查看详情</Button>
              </Link>
              <div className="flex-1">
                <ReturnBookButton recordId={id} />
              </div>
            </div>
          </div>
        </div>
      </li>
    );
  }

  // 未借出的书：保持原有整卡点击行为
  return (
    <li>
      <Link href={detailHref}>
        <BookCover coverColor={coverColor} coverImage={coverUrl} />

        <div className={cn("mt-4", "xs:max-w-40 max-w-28")}>
          <p className="book-title">{title}</p>
          <p className="book-genre">{genre}</p>
        </div>
      </Link>
    </li>
  );
};

export default BookCard;
