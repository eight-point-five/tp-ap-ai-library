import Link from "next/link";

const Page = () => {
  return (
    <section className="rounded-2xl bg-white p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
        借阅申请
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-dark-400">
        借阅申请控制台
      </h2>
      <p className="mt-3 max-w-3xl text-sm text-light-500">
        这个功能不是演示的重点，时间精力有限，该页面暂时置空。
      </p>

      <div className="mt-8 rounded-2xl border border-light-400 bg-light-600 p-6">
        <p className="text-base font-semibold text-dark-400">
          当前演示流程
        </p>
        <p className="mt-3 text-sm text-light-500">
          用户从前端详情页借阅图书，系统写入 TP 记录并立即生成风险事件。
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/" className="font-semibold text-primary-admin">
            前往图书馆
          </Link>
          <Link href="/admin/risk-dashboard" className="font-semibold text-primary-admin">
            打开风险监控
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Page;
