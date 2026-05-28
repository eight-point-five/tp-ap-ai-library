import Link from "next/link";

const Page = () => {
  return (
    <section className="rounded-2xl bg-white p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
        Account Requests
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-dark-400">
        Account Review Page
      </h2>
      <p className="mt-3 max-w-3xl text-sm text-light-500">
        This route is provided so the admin sidebar stays usable. The local demo
        currently focuses on the TP + AP + AI borrow-risk workflow rather than a
        complete account approval workflow.
      </p>

      <div className="mt-8 rounded-2xl border border-light-400 bg-light-600 p-6">
        <p className="text-base font-semibold text-dark-400">
          Recommended demo navigation
        </p>
        <p className="mt-3 text-sm text-light-500">
          Use the seeded admin account to enter the system, borrow books with one
          of the demo users, then inspect the generated risk state from the risk
          dashboard.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/admin/users" className="font-semibold text-primary-admin">
            Open all users
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
