"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type Props = {
  scope: LlmScope;
  heading: string;
  subheading: string;
};

type SearchResponse = {
  mode: "basic" | "fallback" | "llm";
  provider: LlmProvider | null;
  results: Array<{
    id: string;
    title: string;
    author: string;
    isbn: string | null;
    genre: string;
    coverUrl: string;
    availableCopies: number;
    rating: number;
    score: number;
    matchReason: string;
  }>;
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

const providerDefaults: Record<
  LlmProvider,
  { model: string; endpoint: string; supportsVision: boolean }
> = {
  DOUBAO: {
    model: "doubao-1.5-vision-pro-32k",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    supportsVision: true,
  },
  QWEN: {
    model: "qwen-vl-max",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    supportsVision: true,
  },
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      resolve(raw.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BookDiscoveryWorkbench = ({ scope, heading, subheading }: Props) => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [provider, setProvider] = useState<LlmProvider>("DOUBAO");
  const [model, setModel] = useState(providerDefaults.DOUBAO.model);
  const [endpoint, setEndpoint] = useState(providerDefaults.DOUBAO.endpoint);
  const [apiKey, setApiKey] = useState("");
  const [supportsVision, setSupportsVision] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [deletingConfig, setDeletingConfig] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  const currentConfig = useMemo(
    () => configs.find((item) => item.provider === provider) || null,
    [configs, provider],
  );

  const imageLabel = useMemo(
    () =>
      imageFile
        ? `${imageFile.name} (${Math.round(imageFile.size / 1024)} KB)`
        : "未选择图片",
    [imageFile],
  );

  const loadConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const response = await fetch(`/api/llm-config?scope=${scope}`);
      if (!response.ok) {
        throw new Error("load failed");
      }

      const payload = (await response.json()) as { configs: ConfigItem[] };
      const items = payload.configs || [];
      setConfigs(items);
    } catch {
      toast({
        title: "读取失败",
        description: "模型配置读取失败，请稍后重试。",
        variant: "destructive",
      });
    } finally {
      setLoadingConfigs(false);
    }
  };

  useEffect(() => {
    void loadConfigs();
  }, [scope]);

  useEffect(() => {
    if (!currentConfig) {
      setModel(providerDefaults[provider].model);
      setEndpoint(providerDefaults[provider].endpoint);
      setSupportsVision(providerDefaults[provider].supportsVision);
      setEnabled(false);
      setSystemPrompt("");
      return;
    }

    setModel(currentConfig.model);
    setEndpoint(currentConfig.apiBaseUrl);
    setSupportsVision(currentConfig.supportsVision);
    setEnabled(currentConfig.enabled);
    setSystemPrompt(currentConfig.systemPrompt || "");
  }, [currentConfig, provider]);

  const handleProviderChange = (nextProvider: LlmProvider) => {
    setProvider(nextProvider);
    setApiKey("");
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);

    try {
      const response = await fetch("/api/llm-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope,
          provider,
          model,
          apiBaseUrl: endpoint,
          apiKey,
          enabled,
          supportsVision,
          systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save config");
      }

      toast({
        title: "保存成功",
        description: `${provider} 配置已更新。`,
      });
      setApiKey("");
      await loadConfigs();
    } catch {
      toast({
        title: "保存失败",
        description: "请检查接口地址和 API 密钥是否正确。",
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
        `/api/llm-config?scope=${scope}&provider=${provider}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("delete failed");
      }

      toast({
        title: "删除成功",
        description: `${provider} 配置已删除。`,
      });

      setApiKey("");
      await loadConfigs();
    } catch {
      toast({
        title: "删除失败",
        description: "无法删除当前配置，请稍后重试。",
        variant: "destructive",
      });
    } finally {
      setDeletingConfig(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);

    try {
      const payload: Record<string, unknown> = {
        scope,
        provider,
        title,
        author,
        isbn,
        description,
        limit: 12,
      };

      if (imageFile) {
        payload.imageBase64 = await fileToBase64(imageFile);
        payload.imageMimeType = imageFile.type;
      }

      const response = await fetch("/api/book-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const result = (await response.json()) as SearchResponse;
      setSearchResult(result);
    } catch {
      toast({
        title: "检索失败",
        description: "请检查模型配置，或先尝试基础检索。",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-admin">
            {scope === "ADMIN" ? "管理员多模态检索" : "用户多模态检索"}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-dark-400">{heading}</h3>
          <p className="mt-2 max-w-3xl text-sm text-light-500">{subheading}</p>
        </div>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-dark-400">
              <span className="font-semibold">模型提供方</span>
              <select
                value={provider}
                onChange={(event) =>
                  handleProviderChange(event.target.value as LlmProvider)
                }
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
            <span className="font-semibold">兼容 Chat Completions 的接口地址</span>
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
                currentConfig?.hasApiKey
                  ? "已保存密钥，留空则保持不变"
                  : "请输入 API 密钥"
              }
            />
          </label>

          <label className="mt-4 block space-y-2 text-sm text-dark-400">
            <span className="font-semibold">系统提示词</span>
            <Textarea
              rows={4}
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="可选：针对馆藏检索进行定制。"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-6 text-sm text-dark-400">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              启用为当前作用域默认模型
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={supportsVision}
                onChange={(event) => setSupportsVision(event.target.checked)}
              />
              支持图片理解
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

          <div className="mt-5 rounded-xl border border-light-400 bg-white p-4 text-sm text-light-500">
            {loadingConfigs ? (
              <p>正在加载已保存配置...</p>
            ) : currentConfig ? (
              <div className="space-y-2">
                <p className="font-semibold text-dark-400">已保存配置</p>
                <p>提供方：{currentConfig.provider}</p>
                <p>模型：{currentConfig.model}</p>
                <p>接口：{currentConfig.apiBaseUrl}</p>
                <p>密钥状态：{currentConfig.hasApiKey ? "已保存" : "未保存"}</p>
                <p>启用状态：{currentConfig.enabled ? "已启用" : "未启用"}</p>
              </div>
            ) : (
              <p>当前提供方还没有保存过配置。</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-light-400 bg-light-600 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm text-dark-400">
              <span className="font-semibold">书名</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm text-dark-400">
              <span className="font-semibold">作者</span>
              <Input value={author} onChange={(event) => setAuthor(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm text-dark-400">
              <span className="font-semibold">ISBN</span>
              <Input value={isbn} onChange={(event) => setIsbn(event.target.value)} />
            </label>
          </div>

          <label className="mt-4 block space-y-2 text-sm text-dark-400">
            <span className="font-semibold">模糊描述你想找的书</span>
            <Textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="例如：我想找一本讲事务处理、OLTP 和 OLAP 的数据库教材。"
            />
          </label>

          <label className="mt-4 block space-y-2 text-sm text-dark-400">
            <span className="font-semibold">参考图片</span>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
            <p className="text-xs text-light-500">{imageLabel}</p>
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="bg-primary text-dark-100"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? "检索中..." : "开始检索"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTitle("");
                setAuthor("");
                setIsbn("");
                setDescription("");
                setImageFile(null);
                setSearchResult(null);
              }}
            >
              清空条件
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {searchResult ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-sm text-light-500">
                  <span>
                    模式：
                    {searchResult.mode === "llm"
                      ? "大模型检索"
                      : searchResult.mode === "fallback"
                        ? "本地回退检索"
                        : "基础精确检索"}
                  </span>
                  <span>
                    提供方：
                    {searchResult.provider
                      ? searchResult.provider
                      : "未命中模型，使用本地回退"}
                  </span>
                  <span>结果数：{searchResult.results.length}</span>
                </div>

                {searchResult.results.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-light-400 p-4 text-sm text-light-500">
                    当前条件下没有找到匹配书籍。
                  </p>
                ) : (
                  searchResult.results.map((book) => (
                    <article
                      key={book.id}
                      className="rounded-xl border border-light-400 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/books/${book.id}`}
                            className="text-lg font-semibold text-dark-400 hover:underline"
                          >
                            {book.title}
                          </Link>
                          <p className="mt-1 text-sm text-light-500">
                            {book.author} · {book.genre}
                            {book.isbn ? ` · ISBN ${book.isbn}` : ""}
                          </p>
                        </div>
                        <div className="text-right text-sm text-dark-400">
                          <p className="font-semibold">匹配分数 {book.score}</p>
                          <p>可借数量 {book.availableCopies}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-light-500">{book.matchReason}</p>
                    </article>
                  ))
                )}
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-light-400 p-4 text-sm text-light-500">
                先用书名、作者、ISBN 做基础检索；再补充描述或图片，触发多模态模糊找书。
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookDiscoveryWorkbench;
