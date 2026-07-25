"use client";

/**
 * CaseSessionProvider —— 挂在根布局里的轻量会话内存（docs/plan.md 已钉死）。
 *
 * 红线：不引入状态库，不写 localStorage / sessionStorage / 数据库。
 * 证据图片只活在这份 React state 里，刷新即消失（这是产品承诺，不是缺陷）。
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyExtractedFields,
  createEmptyDraft,
  toCaseInput,
  type CaseDraft,
  type PrefillableField,
  type TouchedFields,
} from "@/lib/case-draft";
import type { AnalysisResult, CaseInput, ExtractedCaseFields } from "@/lib/types";

interface CaseSessionValue {
  draft: CaseDraft;
  /** 局部更新草稿；传函数以基于最新值计算 */
  updateDraft: (patch: Partial<CaseDraft> | ((draft: CaseDraft) => Partial<CaseDraft>)) => void;
  touched: TouchedFields;
  markTouched: (field: PrefillableField) => void;
  /** 返回真正被写入的字段，供 UI 做高亮动画 */
  applyPrefill: (fields: ExtractedCaseFields) => PrefillableField[];
  /** 提交向导时固化的契约对象；/result 读它 */
  caseInput: CaseInput | null;
  submitCase: () => CaseInput;
  analysis: AnalysisResult | null;
  setAnalysis: (result: AnalysisResult | null) => void;
  reset: () => void;
}

const CaseSessionContext = createContext<CaseSessionValue | null>(null);

export function CaseSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CaseDraft>(createEmptyDraft);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [caseInput, setCaseInput] = useState<CaseInput | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const updateDraft = useCallback<CaseSessionValue["updateDraft"]>((patch) => {
    setDraft((current) => ({
      ...current,
      ...(typeof patch === "function" ? patch(current) : patch),
    }));
  }, []);

  const markTouched = useCallback((field: PrefillableField) => {
    setTouched((current) =>
      current[field] ? current : { ...current, [field]: true },
    );
  }, []);

  const applyPrefill = useCallback<CaseSessionValue["applyPrefill"]>(
    (fields) => {
      // 补丁在这里同步算好并立即返回：调用方要靠 filled 决定高亮哪些字段，
      // 而 setState 的 updater 不保证同步执行。
      const { patch, filled } = applyExtractedFields(draft, fields, touched);
      if (filled.length > 0) {
        setDraft((current) => ({ ...current, ...patch }));
      }
      return filled;
    },
    [draft, touched],
  );

  const submitCase = useCallback(() => {
    const next = toCaseInput(draft);
    setCaseInput(next);
    setAnalysis(null);
    return next;
  }, [draft]);

  const reset = useCallback(() => {
    setDraft(createEmptyDraft());
    setTouched({});
    setCaseInput(null);
    setAnalysis(null);
  }, []);

  const value = useMemo<CaseSessionValue>(
    () => ({
      draft,
      updateDraft,
      touched,
      markTouched,
      applyPrefill,
      caseInput,
      submitCase,
      analysis,
      setAnalysis,
      reset,
    }),
    [
      draft,
      updateDraft,
      touched,
      markTouched,
      applyPrefill,
      caseInput,
      submitCase,
      analysis,
      reset,
    ],
  );

  return (
    <CaseSessionContext.Provider value={value}>
      {children}
    </CaseSessionContext.Provider>
  );
}

export function useCaseSession(): CaseSessionValue {
  const value = useContext(CaseSessionContext);
  if (!value) {
    throw new Error("useCaseSession 必须在 CaseSessionProvider 内使用");
  }
  return value;
}
