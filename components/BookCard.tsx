import React from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";

const BookCard = ({
  id,
  title,
  genre,
  coverColor,
  coverUrl,
  isLoanedBook = false,
  dueDate,
  borrowStatus,
  riskLevel,
  riskScore,
}: Book) => (
  <li className={cn(isLoanedBook && "xs:w-52 w-full")}>
    <Link
      href={`/books/${id}`}
      className={cn(isLoanedBook && "w-full flex flex-col items-center")}
    >
      <BookCover coverColor={coverColor} coverImage={coverUrl} />

      <div className={cn("mt-4", !isLoanedBook && "xs:max-w-40 max-w-28")}>
        <p className="book-title">{title}</p>
        <p className="book-genre">{genre}</p>
      </div>

      {isLoanedBook && (
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

          <Button className="book-btn">查看详情</Button>
        </div>
      )}
    </Link>
  </li>
);

export default BookCard;
