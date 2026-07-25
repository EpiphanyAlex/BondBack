"use client";

/**
 * 结果页与 03a 两个 route 的**唯一**接口层（03b §6）。
 *
 * 契约（以 03a 已交付的 route 为准）：
 *   POST /api/facts    ← { evidence: EvidenceImage[] }        → { facts: EvidenceFact[], diagnostic }
 *   POST /api/analyze  ← { input: CaseInput, facts: EvidenceFact[] } → { result: AnalysisResult, diagnostic }
 *
 * 两个 route 都只在极端情况下返回非 2xx：
 * - `/api/facts` 永远 200，失败时 `facts` 为空数组
 * - `/api/analyze` 只有 state 非法才 400，其余一律 200 + 完整的 burden-shift 结果
 *
 * 所以**「失败」只有一种**：fetch reject 或非 2xx。
 * `burden-shift` / `ai-disabled` / `rate-limited` 都是正常降级结果，不渲染重试按钮。
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AnalysisResult,
  CaseInput,
  EvidenceFact,
  EvidenceImage,
} from "@/lib/types";

import { countStatutes } from "./utils";

/* ── 两个 fetch ───────────────────────────────────────────────────────── */

export interface FactsResponse {
  facts: EvidenceFact[];
  diagnostic: string;
}

export interface AnalyzeResponse {
  result: AnalysisResult;
  diagnostic: string;
}

export async function postFacts(
  evidence: EvidenceImage[],
  signal?: AbortSignal,
): Promise<FactsResponse> {
  const response = await fetch("/api/facts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ evidence }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`facts ${response.status}`);
  }

  const data = (await response.json()) as Partial<FactsResponse>;
  return {
    facts: Array.isArray(data.facts) ? data.facts : [],
    diagnostic: typeof data.diagnostic === "string" ? data.diagnostic : "ok",
  };
}

/**
 * `evidence[].dataUrl` 在这里就剥掉：`/api/analyze` 只吃文本事实，
 * 服务端也会主动置空。手机上少传一大坨 base64，差别很明显。
 */
function stripImages(input: CaseInput): CaseInput {
  return {
    ...input,
    evidence: input.evidence.map((item) => ({ ...item, dataUrl: "" })),
  };
}

export async function postAnalyze(
  input: CaseInput,
  facts: EvidenceFact[],
  signal?: AbortSignal,
): Promise<AnalyzeResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: stripImages(input), facts }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`analyze ${response.status}`);
  }

  const data = (await response.json()) as Partial<AnalyzeResponse>;
  if (!data.result) {
    throw new Error("analyze: empty result");
  }

  return {
    result: data.result,
    diagnostic: typeof data.diagnostic === "string" ? data.diagnostic : "ok",
  };
}

/* ── 两段进度的状态 ───────────────────────────────────────────────────── */

export type AnalysisStageId = "facts" | "analyze";

export type AnalysisStageStatus =
  | "pending"
  | "running"
  | "done"
  /** 没有东西可读，这一段本来就不该跑（零证据）—— 不空转装样子 */
  | "skipped"
  | "failed";

export interface AnalysisStageState {
  id: AnalysisStageId;
  status: AnalysisStageStatus;
  /** 完成 / 跳过 / 失败时的一句话，进度组件直接显示 */
  detailZh?: string;
}

function factsDetail(diagnostic: string, count: number): string {
  switch (diagnostic) {
    case "ok":
      return `读到 ${count} 条事实`;
    case "no-facts-found":
      return "通读完了，但没有可直接引用的行";
    case "no-images":
      return "没有可读取的证据文件";
    case "ai-disabled":
      return "识别未启用，跳过这一段";
    case "rate-limited":
      return "请求太频繁，这一段没读成";
    case "payload-too-large":
      return "证据体积超上限，这一段没读成";
    default:
      return "这一段没读成，下面按举证责任翻转处理";
  }
}

function analyzeDetail(diagnostic: string, statuteCount: number): string {
  switch (diagnostic) {
    case "ok":
      return `比对了 ${statuteCount} 条法条`;
    case "burden-shift":
      return "没有证据可比对，已按举证责任翻转生成";
    case "rate-limited":
      return "请求太频繁，已按举证责任翻转生成";
    case "ai-disabled":
      return "对照未启用，已按举证责任翻转生成";
    default:
      return "模型没跑成，已按举证责任翻转生成";
  }
}

function initialStages(
  analysis: AnalysisResult | null,
): Record<AnalysisStageId, AnalysisStageState> {
  if (!analysis) {
    return {
      facts: { id: "facts", status: "pending" },
      analyze: { id: "analyze", status: "pending" },
    };
  }
  return {
    facts: {
      id: "facts",
      status: analysis.facts.length > 0 ? "done" : "skipped",
      detailZh:
        analysis.facts.length > 0
          ? `读到 ${analysis.facts.length} 条事实`
          : "没有可读取的证据文件",
    },
    analyze: {
      id: "analyze",
      status: "done",
      detailZh: `比对了 ${countStatutes(analysis.items)} 条法条`,
    },
  };
}

/* ── hook ─────────────────────────────────────────────────────────────── */

export interface UseAnalysisOptions {
  caseInput: CaseInput | null;
  /** 会话里已经算过就不重跑 */
  initialAnalysis?: AnalysisResult | null;
  /** 算完回写会话，返回本页再进来不会重跑 */
  onAnalysis?: (result: AnalysisResult) => void;
  enabled?: boolean;
}

export interface UseAnalysisValue {
  analysis: AnalysisResult | null;
  facts: EvidenceFact[];
  stages: AnalysisStageState[];
  running: boolean;
  /** 单段重试。重试 facts 会连带重跑 analyze —— 结论依赖事实，但不用重走向导 */
  retryStage: (id: AnalysisStageId) => void;
}

export function useAnalysis({
  caseInput,
  initialAnalysis = null,
  onAnalysis,
  enabled = true,
}: UseAnalysisOptions): UseAnalysisValue {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis);
  const [facts, setFacts] = useState<EvidenceFact[]>(initialAnalysis?.facts ?? []);
  const [stages, setStages] = useState(() => initialStages(initialAnalysis));
  const [running, setRunning] = useState(false);

  const analysisRef = useRef<AnalysisResult | null>(initialAnalysis);
  const factsRef = useRef<EvidenceFact[]>(initialAnalysis?.facts ?? []);
  const controllerRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);
  const startedForRef = useRef<CaseInput | null>(null);
  const onAnalysisRef = useRef(onAnalysis);

  useEffect(() => {
    onAnalysisRef.current = onAnalysis;
  }, [onAnalysis]);

  const setStage = useCallback(
    (id: AnalysisStageId, patch: Omit<AnalysisStageState, "id">) => {
      setStages((current) => ({ ...current, [id]: { id, ...patch } }));
    },
    [],
  );

  const runFacts = useCallback(
    async (input: CaseInput, signal: AbortSignal): Promise<EvidenceFact[]> => {
      // 零证据不走网络：03a 会直接给 burden-shift 结果，这一段没有东西可读。
      // 空转两秒装进度就是假进度，军规明令禁止。
      if (input.evidence.length === 0) {
        factsRef.current = [];
        setFacts([]);
        setStage("facts", {
          status: "skipped",
          detailZh: "没有上传证据，这一段没有东西可读",
        });
        return [];
      }

      setStage("facts", { status: "running" });

      try {
        const { facts: read, diagnostic } = await postFacts(
          input.evidence,
          signal,
        );
        factsRef.current = read;
        setFacts(read);
        setStage("facts", {
          status: "done",
          detailZh: factsDetail(diagnostic, read.length),
        });
        return read;
      } catch (error) {
        if (signal.aborted) throw error;
        // 只有真正的网络异常才算失败。继续往下走，用户至少拿得到一封信。
        factsRef.current = [];
        setFacts([]);
        setStage("facts", {
          status: "failed",
          detailZh: "没连上服务器，这一段没读成",
        });
        return [];
      }
    },
    [setStage],
  );

  const runAnalyze = useCallback(
    async (
      input: CaseInput,
      known: EvidenceFact[],
      signal: AbortSignal,
    ): Promise<void> => {
      setStage("analyze", { status: "running" });

      try {
        const { result, diagnostic } = await postAnalyze(input, known, signal);
        analysisRef.current = result;
        setAnalysis(result);
        setFacts(result.facts);
        factsRef.current = result.facts;
        onAnalysisRef.current?.(result);
        setStage("analyze", {
          status: "done",
          detailZh: analyzeDetail(diagnostic, countStatutes(result.items)),
        });
      } catch (error) {
        if (signal.aborted) throw error;
        setStage("analyze", {
          status: "failed",
          detailZh: "没连上服务器，这一段没跑成",
        });
      }
    },
    [setStage],
  );

  const start = useCallback(
    async (input: CaseInput, mode: "all" | "analyze-only") => {
      if (runningRef.current) return;
      runningRef.current = true;
      setRunning(true);

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const known =
          mode === "all"
            ? await runFacts(input, controller.signal)
            : factsRef.current;
        await runAnalyze(input, known, controller.signal);
      } catch {
        // 被 abort（换案情或卸载）——什么都不做，状态由下一次运行覆盖
      } finally {
        runningRef.current = false;
        setRunning(false);
      }
    },
    [runFacts, runAnalyze],
  );

  const retryStage = useCallback(
    (id: AnalysisStageId) => {
      if (!caseInput || runningRef.current) return;
      void start(caseInput, id === "facts" ? "all" : "analyze-only");
    },
    [caseInput, start],
  );

  useEffect(() => {
    if (!enabled || !caseInput) return;
    if (analysisRef.current) return;
    if (startedForRef.current === caseInput) return;

    startedForRef.current = caseInput;
    void start(caseInput, "all");

    return () => {
      // StrictMode 的模拟卸载也会走到这里：没算出结果就把闸门放开，
      // 第二次挂载才不会卡在「已经跑过了」而永远停在 pending。
      if (!analysisRef.current) startedForRef.current = null;
      controllerRef.current?.abort();
      runningRef.current = false;
    };
  }, [caseInput, enabled, start]);

  return {
    analysis,
    facts,
    stages: [stages.facts, stages.analyze],
    running,
    retryStage,
  };
}
