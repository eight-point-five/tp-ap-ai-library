"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NlqResponse = {
  queryText: string;
  parsedIntent: string;
  parsedFilters: Record<string, string | number>;
  results: Array<Record<string, string | number | null>>;
  explanation: string;
};

const NaturalLanguageQueryBox = () => {
  const [query, setQuery] = useState("查询高风险用户");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NlqResponse | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/nlq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "查询失败");
        setResult(null);
        return;
      }

      setResult(payload);
    } catch {
      setError("自然语言查询接口暂不可用。");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-7">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-dark-400">
          自然语言查询
        </h3>
        <p className="text-sm text-light-500">
          尝试输入"查询高风险用户"或"查询24小时内借书超过5次的用户"等查询语句。
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="book-form_input"
          placeholder="请输入自然语言查询"
        />
        <Button onClick={handleSubmit} className="bg-primary-admin text-white">
          {loading ? "查询中..." : "执行查询"}
        </Button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-light-400 bg-light-600 p-4 text-sm text-dark-400">
            <p>
              <span className="font-semibold">解析意图：</span>{" "}
              {result.parsedIntent}
            </p>
            <p className="mt-2">
              <span className="font-semibold">解释说明：</span>{" "}
              {result.explanation}
            </p>
          </div>

          <div className="space-y-3">
            {result.results.length === 0 ? (
              <p className="text-sm text-light-500">未找到匹配的记录。</p>
            ) : (
              result.results.map((item, index) => (
                <pre
                  key={index}
                  className="overflow-x-auto rounded-xl bg-dark-400 p-4 text-xs text-white"
                >
                  {JSON.stringify(item, null, 2)}
                </pre>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default NaturalLanguageQueryBox;
