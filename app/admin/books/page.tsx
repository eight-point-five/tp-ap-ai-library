import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Page = () => {
  return (
    <section className="w-full rounded-2xl bg-white p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">全部图书</h2>
        <Button className="bg-primary-admin" asChild>
          <Link href="/admin/books/new" className="text-white">
            + 新增图书
          </Link>
        </Button>
      </div>

      <div className="mt-7 w-full overflow-hidden">
        <p>表格</p>
      </div>
    </section>
  );
};

export default Page;
