CREATE UNIQUE INDEX "borrow_records_active_unique_user_book_idx"
ON "borrow_records" ("user_id", "book_id")
WHERE "status" = 'BORROWED';
