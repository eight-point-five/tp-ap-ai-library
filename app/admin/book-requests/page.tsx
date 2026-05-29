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
        原侧边栏要求此路由，故设为占位页面以避免 404。在当前演示版本中，借阅操作直接从图书详情页触发。
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
            打开风险仪表盘
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Page;
