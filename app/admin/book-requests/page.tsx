import Link from "next/link";

const Page = () => {
  return (
    <section className="rounded-2xl bg-white p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
        Borrow Requests
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-dark-400">
        Borrow Request Console
      </h2>
      <p className="mt-3 max-w-3xl text-sm text-light-500">
        The original sidebar expected this route, so it has been added as a live
        placeholder instead of leaving a 404. In the current demo build, borrow
        actions are triggered directly from the book detail page.
      </p>

      <div className="mt-8 rounded-2xl border border-light-400 bg-light-600 p-6">
        <p className="text-base font-semibold text-dark-400">
          Current demo flow
        </p>
        <p className="mt-3 text-sm text-light-500">
          User borrows a book from the front-end detail page, which writes the TP
          record and immediately creates a risk event.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/" className="font-semibold text-primary-admin">
            Go to library
          </Link>
          <Link href="/admin/risk-dashboard" className="font-semibold text-primary-admin">
            Open risk dashboard
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Page;
