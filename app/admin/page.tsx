import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Page = () => {
  return (
    <section className="w-full rounded-2xl bg-white p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
            Admin Console
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-dark-400">
            Local TP + AP + AI Demo Entry
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-light-500">
            This admin home keeps the original library management entry points and
            adds the risk dashboard as the main browser demo surface.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-primary-admin" asChild>
            <Link href="/admin/risk-dashboard" className="text-white">
              Open risk dashboard
            </Link>
          </Button>
          <Button className="bg-light-300 text-primary-admin shadow-none" asChild>
            <Link href="/admin/books">Browse books</Link>
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link
          href="/admin/risk-dashboard"
          className="rounded-2xl border border-light-400 bg-light-600 p-6"
        >
          <p className="text-lg font-semibold text-dark-400">
            Risk analytics and NLQ
          </p>
          <p className="mt-3 text-sm text-light-500">
            Review high-risk users, risk events, event trends, and run natural language queries.
          </p>
        </Link>
        <Link
          href="/admin/books"
          className="rounded-2xl border border-light-400 bg-light-600 p-6"
        >
          <p className="text-lg font-semibold text-dark-400">
            Books and borrow management
          </p>
          <p className="mt-3 text-sm text-light-500">
            Keep using the original library management flows that generate TP data for risk analysis.
          </p>
        </Link>
      </div>
    </section>
  );
};

export default Page;
