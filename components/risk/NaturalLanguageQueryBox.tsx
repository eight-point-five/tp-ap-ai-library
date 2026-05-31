"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import RiskBadge from "@/components/risk/RiskBadge";
import ControlStatusBadge from "@/components/risk/ControlStatusBadge";

type NlqRow = Record<string, string | number | null>;

type NlqResponse = {
  queryText: string;
  parsedIntent: string;
  parsedFilters: Record<string, string | number>;
  results: NlqRow[];
  explanation: string;
  mode: "rule" | "llm";
  provider: LlmProvider | null;
};

type ConfigItem = {
  id: string;
  scope: LlmScope;
  provider: LlmProvider;
  model: string;
  apiBaseUrl: string;
  enabled: boolean;
  supportsVision: boolean;
  systemPrompt: string | null;
  hasApiKey: boolean;
  updatedAt: string | null;
};

const providerDefaults: Record<LlmProvider, { model: string; endpoint: string }> = {
  DOUBAO: {
    model: "doubao-1.5-pro-32k",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  },
  QWEN: {
    model: "qwen-plus",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  },
};

const isRiskUserRow = (item: NlqRow) =>
  "fullName" in item && "currentScore" in item && "currentLevel" in item;

const isRiskEventRow = (item: NlqRow) =>
  "bookTitle" in item && "riskScore" in item && "decision" in item;

const ResultSummary = ({ result }: { result: NlqResponse }) => (
  <div className="grid gap-4 md:grid-cols-4">
    <div className="rounded-xl bg-light-600 p-4">
      <p className="text-sm text-light-500">解析模式</p>
      <p className="mt-2 text-lg font-semibold text-dark-400">
        {result.mode === "llm" ? "大模型解析" : "规则回退"}
      </p>
    </div>
    <div className="rounded-xl bg-light-600 p-4">
      <p className="text-sm text-light-500">使用模型</p>
      <p className="mt-2 text-lg font-semibold text-dark-400">
        {result.provider || "未启用"}
      </p>
    </div>
    <div className="rounded-xl bg-light-600 p-4">
      <p className="text-sm text-light-500">解析意图</p>
      <p className="mt-2 break-all text-sm font-semibold text-dark-400 md:text-base">
        {result.parsedIntent}
      </p>
    </div>
    <div className="rounded-xl bg-light-600 p-4">
      <p className="text-sm text-light-500">结果数量</p>
      <p className="mt-2 text-lg font-semibold text-dark-400">
        {result.results.length}
      </p>
    </div>
  </div>
);

const RiskUserResults = ({ results }: { results: NlqRow[] }) => (
  <div className="overflow-x-auto rounded-2xl border border-light-400 bg-white">
    <table className="min-w-full text-left">
      <thead>
        <tr className="border-b border-light-400 text-sm text-light-500">
          <th className="px-4 py-3">用户</th>
          <th className="px-4 py-3">账号状态</th>
          <th className="px-4 py-3">风险等级</th>
          <th className="px-4 py-3">控制状态</th>
          <th className="px-4 py-3">风险分数</th>
          <th className="px-4 py-3">在借数</th>
          <th className="px-4 py-3">逾期数</th>
          <th className="px-4 py-3">24h 借阅</th>
        </tr>
      </thead>
      <tbody>
        {results.map((item, index) => (
          <tr key={`${item.userId || index}`} className="border-b border-light-400/70 text-sm">
            <td className="px-4 py-4">
              <p className="font-semibold text-dark-400">{String(item.fullName || "-")}</p>
              <p className="mt-1 text-light-500">{String(item.email || "-")}</p>
            </td>
            <td className="px-4 py-4 text-dark-400">{String(item.accountStatus || "-")}</td>
            <td className="px-4 py-4">
              <RiskBadge level={String(item.currentLevel || "LOW") as RiskLevel} />
            </td>
            <td className="px-4 py-4">
              {"controlStatus" in item && item.controlStatus ? (
                <ControlStatusBadge
                  status={String(item.controlStatus) as ControlStatus}
                />
              ) : (
                <span className="text-light-500">-</span>
              )}
            </td>
            <td className="px-4 py-4 font-semibold text-dark-400">
              {String(item.currentScore ?? "-")}
            </td>
            <td className="px-4 py-4 text-dark-400">
              {String(item.activeBorrowCount ?? "-")}
            </td>
            <td className="px-4 py-4 text-dark-400">
              {String(item.overdueCount ?? "-")}
            </td>
            <td className="px-4 py-4 text-dark-400">
              {String(item.recent24hBorrowCount ?? "-")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RiskEventResults = ({ results }: { results: NlqRow[] }) => (
  <div className="space-y-4">
    {results.map((item, index) => (
      <article
        key={`${item.id || index}`}
        className="rounded-2xl border border-light-400 bg-white p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-dark-400">
              {String(item.fullName || "未知用户")} · 《{String(item.bookTitle || "未知图书")}》
            </p>
            <p className="mt-1 text-sm text-light-500">
              {String(item.createdAt || "未知时间")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-dark-400">
              评分 {String(item.riskScore ?? "-")}
            </span>
            <RiskBadge level={String(item.riskLevel || "LOW") as RiskLevel} />
          </div>
        </div>
        <p className="mt-3 text-sm text-light-500">
          处理决策：{String(item.decision || "-")}
        </p>
        <p className="mt-2 text-sm text-light-500">
          {String(item.explanation || "暂无解释")}
        </p>
      </article>
    ))}
  </div>
);

const RawResults = ({ results }: { results: NlqRow[] }) => (
  <div className="space-y-3">
    {results.map((item, index) => (
      <pre
        key={index}
        className="overflow-x-auto rounded-xl bg-dark-400 p-4 text-xs text-white"
      >
        {JSON.stringify(item, null, 2)}
      </pre>
    ))}
  </div>
);

const ResultPanel = ({ result }: { result: NlqResponse }) => {
  const firstRow = result.results[0];

  return (
    <div className="mt-6 space-y-4">
      <ResultSummary result={result} />

      <div className="rounded-xl border border-light-400 bg-light-600 p-4 text-sm text-dark-400">
        <p>
          <span className="font-semibold">解释说明：</span>
          {result.explanation}
        </p>
      </div>

      {result.results.length === 0 ? (
        <p className="text-sm text-light-500">未找到匹配的记录。</p>
      ) : firstRow && isRiskUserRow(firstRow) ? (
        <RiskUserResults results={result.results} />
      ) : firstRow && isRiskEventRow(firstRow) ? (
        <RiskEventResults results={result.results} />
      ) : (
        <RawResults results={result.results} />
      )}
    </div>
  );
};

const NaturalLanguageQueryBox = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [provider, setProvider] = useState<LlmProvider>("DOUBAO");
  const [model, setModel] = useState(providerDefaults.DOUBAO.model);
  const [endpoint, setEndpoint] = useState(providerDefaults.DOUBAO.endpoint);
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [deletingConfig, setDeletingConfig] = useState(false);

  const [query, setQuery] = useState("查询高风险用户");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NlqResponse | null>(null);
  const [error, setError] = useState("");

  const currentConfig = useMemo(
    () => configs.find((item) => item.provider === provider) || null,
    [configs, provider],
  );

  const loadConfigs = async () => {
    const response = await fetch("/api/llm-config?scope=ADMIN");
    if (!response.ok) {
      throw new Error("load failed");
    }

    const payload = (await response.json()) as { configs: ConfigItem[] };
    setConfigs(payload.configs || []);
  };

  useEffect(() => {
    void loadConfigs().catch(() => {
      toast({
        title: "读取失败",
        description: "无法加载自然语言查询的模型配置。",
        variant: "destructive",
      });
    });
  }, []);

  useEffect(() => {
    if (!currentConfig) {
      setModel(providerDefaults[provider].model);
      setEndpoint(providerDefaults[provider].endpoint);
      setEnabled(false);
      setSystemPrompt("");
      return;
    }

    setModel(currentConfig.model);
    setEndpoint(currentConfig.apiBaseUrl);
    setEnabled(currentConfig.enabled);
    setSystemPrompt(currentConfig.systemPrompt || "");
  }, [currentConfig, provider]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const response = await fetch("/api/llm-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope: "ADMIN",
          provider,
          model,
          apiBaseUrl: endpoint,
          apiKey,
          enabled,
          supportsVision: false,
          systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("save failed");
      }

      toast({
        title: "保存成功",
        description: `${provider} 自然语言查询配置已更新。`,
      });
      setApiKey("");
      await loadConfigs();
    } catch {
      toast({
        title: "保存失败",
        description: "请检查接口地址和 API 密钥。",
        variant: "destructive",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!currentConfig) return;

    setDeletingConfig(true);
    try {
      const response = await fetch(
        `/api/llm-config?scope=ADMIN&provider=${provider}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("delete failed");
      }

      toast({
        title: "删除成功",
        description: `${provider} 自然语言查询配置已删除。`,
      });
      setApiKey("");
      await loadConfigs();
    } catch {
      toast({
        title: "删除失败",
        description: "当前配置删除失败，请稍后重试。",
        variant: "destructive",
      });
    } finally {
      setDeletingConfig(false);
    }
  };

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

      const payload = (await response.json()) as NlqResponse & { error?: string };

      if (!response.ok) {
        setError(payload.error || "查询失败");
        setResult(null);
        return;
      }

      setResult(payload);
    } catch {
      setError("自然语言查询接口暂时不可用。");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-7">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-dark-400">自然语言查询</h3>
        <p className="text-sm text-light-500">
          支持配置豆包或千问，将管理员输入的中文查询解析为风控查询条件。例如“查询高风险用户”“查询最近7天异常风险事件”“查询被封禁账号”。
        </p>
      </div>

      <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-dark-400">
            <span className="font-semibold">模型提供方</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as LlmProvider)}
              className="book-form_input h-12"
            >
              <option value="DOUBAO">豆包 Doubao</option>
              <option value="QWEN">千问 Qwen</option>
            </select>
          </label>

          <label className="space-y-2 text-sm text-dark-400">
            <span className="font-semibold">模型名称</span>
            <Input value={model} onChange={(event) => setModel(event.target.value)} />
          </label>
        </div>

        <label className="mt-4 block space-y-2 text-sm text-dark-400">
          <span className="font-semibold">接口地址</span>
          <Input
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            placeholder="https://.../chat/completions"
          />
        </label>

        <label className="mt-4 block space-y-2 text-sm text-dark-400">
          <span className="font-semibold">API 密钥</span>
          <Input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={
              currentConfig?.hasApiKey ? "已保存密钥，留空则保持不变" : "请输入 API 密钥"
            }
          />
        </label>

        <label className="mt-4 block space-y-2 text-sm text-dark-400">
          <span className="font-semibold">系统提示词</span>
          <Textarea
            rows={4}
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            placeholder="可选：定制自然语言查询解析行为。"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-dark-400">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            启用为管理员自然语言查询默认模型
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            className="bg-primary-admin text-white"
            onClick={handleSaveConfig}
            disabled={savingConfig}
          >
            {savingConfig ? "保存中..." : "保存配置"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteConfig}
            disabled={!currentConfig || deletingConfig}
          >
            {deletingConfig ? "删除中..." : "删除当前配置"}
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="book-form_input"
          placeholder="例如：查询高风险用户 / 查询最近7天异常风险事件 / 查询被封禁账号"
        />
        <Button onClick={handleSubmit} className="bg-primary-admin text-white">
          {loading ? "查询中..." : "执行查询"}
        </Button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}
      {result ? <ResultPanel result={result} /> : null}
    </section>
  );
};

export default NaturalLanguageQueryBox;
