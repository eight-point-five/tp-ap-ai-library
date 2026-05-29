import Link from "next/link";

const Page = () => {
  return (
    <section className="rounded-2xl bg-white p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
        账号申请
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-dark-400">
        账号审核页
      </h2>
      <p className="mt-3 max-w-3xl text-sm text-light-500">
        此路由为保证管理员侧边栏可用性而设置。当前本地演示侧重于
        TP + AP + AI 借阅风险流程，而非完整的账号审批流程。
      </p>

      <div className="mt-8 rounded-2xl border border-light-400 bg-light-600 p-6">
        <p className="text-base font-semibold text-dark-400">
          推荐演示导航
        </p>
        <p className="mt-3 text-sm text-light-500">
          使用预设管理员账号登录系统，以演示用户身份借阅图书，然后从风险仪表盘查看生成的风险状态。
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/admin/users" className="font-semibold text-primary-admin">
            查看全部用户
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
