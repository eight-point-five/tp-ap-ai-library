import React from "react";

const Page = () => {
  return (
    <main className="root-container flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-bebas-neue text-5xl font-bold text-light-100">
        操作太频繁，请稍后再试！
      </h1>
      <p className="mt-3 max-w-xl text-center text-light-400">
        检测到短时间内操作过于频繁，系统已暂时限制您的访问。请稍等片刻再试。
      </p>
    </main>
  );
};
export default Page;
