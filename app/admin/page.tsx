import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Page = () => {
  return (
    <section className="w-full rounded-2xl bg-white p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
            管理控制台
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-dark-400">
            TP + AP + AI 演示入口
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-light-500">
            此管理首页保留原有图书管理入口，并将风险监控界面作为主要演示界面。
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-primary-admin" asChild>
            <Link href="/admin/risk-dashboard" className="text-white">
              打开风险监控
            </Link>
          </Button>
          <Button className="bg-light-300 text-primary-admin shadow-none" asChild>
            <Link href="/admin/books">浏览图书</Link>
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link
          href="/admin/risk-dashboard"
          className="rounded-2xl border border-light-400 bg-light-600 p-6"
        >
          <p className="text-lg font-semibold text-dark-400">
            风险分析与自然语言查询
          </p>
          <p className="mt-3 text-sm text-light-500">
            查看高风险用户、风险事件、事件趋势，并执行自然语言查询。
          </p>
        </Link>
        <Link
          href="/admin/books"
          className="rounded-2xl border border-light-400 bg-light-600 p-6"
        >
          <p className="text-lg font-semibold text-dark-400">
            图书与借阅管理
          </p>
          <p className="mt-3 text-sm text-light-500">
            继续使用原有的图书管理流程，为风险分析生成 TP 数据。
          </p>
        </Link>
      </div>
    </section>
  );
};

export default Page;
