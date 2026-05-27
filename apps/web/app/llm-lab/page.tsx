"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Bot, History, MessageSquareText, Send, Sparkles } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  chatLLM,
  generateLLMText,
  getLLMLogs,
  getLLMScenarios,
  getLLMStatus,
} from "@/lib/api";
import type {
  LLMCallLog,
  LLMChatResponse,
  LLMGenerateResponse,
  LLMScenario,
  LLMStatusResponse,
} from "@/lib/types";

const fieldClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export default function LLMLabPage() {
  const [status, setStatus] = useState<LLMStatusResponse | null>(null);
  const [scenarios, setScenarios] = useState<LLMScenario[]>([]);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState("profile");
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [chatInput, setChatInput] = useState("请解释幻读，并说明引用来源。");
  const [generateResult, setGenerateResult] = useState<LLMGenerateResponse | null>(null);
  const [chatResult, setChatResult] = useState<LLMChatResponse | null>(null);
  const [logs, setLogs] = useState<LLMCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.key === selectedScenarioKey),
    [scenarios, selectedScenarioKey],
  );

  async function loadLabData() {
    setLoading(true);
    setError(null);
    try {
      const [statusData, scenarioData, logData] = await Promise.all([
        getLLMStatus(),
        getLLMScenarios(),
        getLLMLogs(20),
      ]);
      setStatus(statusData);
      setScenarios(scenarioData);
      setLogs(logData);
      const defaultScenario =
        scenarioData.find((scenario) => scenario.key === selectedScenarioKey) ??
        scenarioData.find((scenario) => scenario.key === "profile") ??
        scenarioData[0];
      if (defaultScenario) {
        setSelectedScenarioKey(defaultScenario.key);
        setPrompt(defaultScenario.sample_prompt);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "模型实验室数据请求失败");
    } finally {
      setLoading(false);
    }
  }

  async function refreshLogs() {
    setLogs(await getLLMLogs(20));
  }

  useEffect(() => {
    void loadLabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScenarioChange(key: string) {
    setSelectedScenarioKey(key);
    const nextScenario = scenarios.find((scenario) => scenario.key === key);
    setPrompt(nextScenario?.sample_prompt ?? "");
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await generateLLMText({
        scenario: selectedScenarioKey,
        prompt,
        system_prompt: systemPrompt || null,
        temperature: 0.2,
      });
      setGenerateResult(result);
      await refreshLogs();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Mock 生成失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const messages = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: chatInput },
      ];
      const result = await chatLLM({
        scenario: selectedScenarioKey,
        messages,
        temperature: 0.2,
      });
      setChatResult(result);
      await refreshLogs();
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Mock Chat 失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Badge variant="warning">第五阶段：MockLLM 与讯飞接口预留</Badge>
        <h1 className="mt-3 text-3xl font-bold">模型实验室</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          当前页面只测试 Mock 模型和讯飞接口预留，不代表已经实现学习画像、智能体或资源生成。
          本阶段不调用真实外部 API，不需要 API Key，不产生费用。
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>模型实验室不可用</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <StatusCard label="effective_provider" value={status?.effective_provider ?? "-"} />
            <StatusCard label="model" value={status?.model ?? "-"} />
            <StatusCard label="use_mock_llm" value={String(status?.use_mock_llm ?? false)} />
            <StatusCard label="spark_configured" value={String(status?.spark_configured ?? false)} />
            <StatusCard label="status" value={status?.status ?? "-"} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">warning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{status?.warning ?? "无"}</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
                  场景选择
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.key}
                    type="button"
                    className={`w-full rounded-md border p-3 text-left hover:border-primary/50 ${
                      scenario.key === selectedScenarioKey ? "border-primary bg-primary/5" : "bg-background"
                    }`}
                    onClick={() => handleScenarioChange(scenario.key)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={scenario.key === selectedScenarioKey ? "warning" : "outline"}>
                        {scenario.key}
                      </Badge>
                      <span className="text-sm font-semibold">{scenario.title}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{scenario.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                  Generate 测试
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={(event) => void handleGenerate(event)}>
                  <div>
                    <label className="text-sm font-medium">System Prompt（可选）</label>
                    <textarea
                      className={`${fieldClass} mt-2 min-h-20`}
                      value={systemPrompt}
                      onChange={(event) => setSystemPrompt(event.target.value)}
                      placeholder="例如：你是 EduForge 的离线演示模型。"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Prompt：{selectedScenario?.title ?? selectedScenarioKey}
                    </label>
                    <textarea
                      className={`${fieldClass} mt-2 min-h-36`}
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={busy || !prompt.trim()}>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Generate
                  </Button>
                </form>
                {generateResult && <ResultBlock title="Generate 结果" result={generateResult} />}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquareText className="h-5 w-5 text-primary" aria-hidden="true" />
                  Chat 测试
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={(event) => void handleChat(event)}>
                  <textarea
                    className={`${fieldClass} min-h-28`}
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="输入一条用户消息"
                  />
                  <Button type="submit" variant="outline" disabled={busy || !chatInput.trim()}>
                    <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                    Chat
                  </Button>
                </form>
                {chatResult && <ResultBlock title="Chat 结果" result={chatResult} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5 text-primary" aria-hidden="true" />
                  最近调用日志
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {logs.length === 0 && (
                  <p className="text-sm text-muted-foreground">暂无日志。点击 Generate 或 Chat 后会写入。</p>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="rounded-md border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={log.status === "success" ? "success" : "outline"}>
                        {log.status}
                      </Badge>
                      <Badge variant="secondary">{log.provider}</Badge>
                      <Badge variant="outline">{log.scenario}</Badge>
                      <span className="text-xs text-muted-foreground">
                        #{log.id} / {log.latency_ms ?? 0} ms /{" "}
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">model: {log.model}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">prompt:</span> {log.prompt_preview}
                    </p>
                    {log.response_preview && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">response:</span>{" "}
                        {log.response_preview}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ResultBlock({
  title,
  result,
}: {
  title: string;
  result: LLMGenerateResponse | LLMChatResponse;
}) {
  return (
    <div className="mt-4 rounded-md border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">{title}</Badge>
        <Badge variant="secondary">{result.provider}</Badge>
        <Badge variant="outline">{result.model}</Badge>
        <Badge variant="outline">{result.scenario}</Badge>
        <span className="text-xs text-muted-foreground">
          mock={String(result.used_mock)} / {result.latency_ms} ms / log #{result.log_id ?? "-"}
        </span>
      </div>
      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-6">
        {result.content}
      </pre>
    </div>
  );
}
