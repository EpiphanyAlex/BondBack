"use client";

/**
 * 证据上传 + 自动预填。
 *
 * 军规：**识别失败静默回退手填** —— 这里所有失败路径都只留一行低调提示，
 * 不弹窗、不拦人、不把流程卡住。图片压缩和 PDF 转图都在浏览器里做，
 * 原始文件不出设备，压缩后的图片只在会话内存里。
 */

import { useEffect, useRef, useState } from "react";

import { useCaseSession } from "@/lib/case-session";
import { PREFILL_FIELD_LABELS, type PrefillableField } from "@/lib/case-draft";
import {
  compressImageFile,
  dataUrlBytes,
  MAX_EVIDENCE_IMAGES,
  MAX_SOURCE_FILE_BYTES,
} from "@/lib/image";
import { pdfToImages } from "@/lib/pdf-to-images";
import type { EvidenceImage, EvidenceKind, ExtractResult } from "@/lib/types";

interface UploadSlot {
  kind: EvidenceKind;
  label: string;
  hint: string;
  accept: string;
}

/**
 * 入住报告置顶单独成卡（02-wizard.md v1.1 §2）：它是唯一能证明「入住时就有」的
 * 材料，一份就能推翻大多数扣款，值得占满一行并配说服文案。
 */
const HERO_SLOT: UploadSlot = {
  kind: "condition-report",
  label: "入住 condition report",
  hint: "PDF 或照片都行 · 手机翻拍的也认",
  accept: "application/pdf,image/*",
};

/** 扣款清单排在其余证据之首：一张就能填满金额与逐笔明细，预填收益最高。 */
const UPLOAD_SLOTS: UploadSlot[] = [
  {
    kind: "deduction-notice",
    label: "扣款清单 / 结算单",
    hint: "一张就能填满金额和明细",
    accept: "application/pdf,image/*",
  },
  {
    kind: "lease",
    label: "租约 lease",
    hint: "PDF 或照片都行",
    accept: "application/pdf,image/*",
  },
  {
    kind: "chat",
    label: "聊天 / 邮件截图",
    hint: "对方说要扣多少钱的那条",
    accept: "image/*",
  },
  {
    kind: "room",
    label: "房间照片",
    hint: "退租时的实际状况",
    accept: "image/*",
  },
];

const ALL_SLOTS: UploadSlot[] = [HERO_SLOT, ...UPLOAD_SLOTS];

const KIND_LABEL: Record<EvidenceKind, string> = {
  "condition-report": "入住报告",
  "deduction-notice": "扣款清单",
  lease: "租约",
  chat: "聊天截图",
  room: "房间照片",
  other: "其他",
};

type Status =
  | { phase: "idle" }
  | { phase: "processing"; note: string }
  | { phase: "extracting" }
  | { phase: "filled"; fields: PrefillableField[] }
  | { phase: "quiet"; note: string };

let evidenceSeq = 0;

function nextEvidenceId(): string {
  evidenceSeq += 1;
  return `ev-${evidenceSeq}-${Date.now().toString(36)}`;
}

export function EvidenceUploader({
  onPrefilled,
}: {
  onPrefilled: (fields: PrefillableField[]) => void;
}) {
  const { draft, updateDraft, applyPrefill } = useCaseSession();
  const [status, setStatus] = useState<Status>({ phase: "idle" });
  /**
   * 拖拽悬停中。
   *
   * 计数而不是布尔：`dragenter` / `dragleave` 会在落点内部的每个子元素上各冒泡
   * 一次，用布尔的话鼠标划过里面那个「＋」就会误判成「拖出去了」，高亮一闪一闪。
   */
  const [dragDepth, setDragDepth] = useState(0);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const evidence = draft.evidence;
  const remainingSlots = MAX_EVIDENCE_IMAGES - evidence.length;
  const dragging = dragDepth > 0 && remainingSlots > 0;

  /*
   * 落在落点**之外**的文件，浏览器默认会直接打开它 —— 于是页面被那个 PDF 顶掉，
   * 而这个产品无登录无数据库，向导填的一切只活在这块内存里，一走就全没了。
   * 所以这一步在场期间，整窗吞掉所有非落点的拖放。只在本组件挂载时生效。
   */
  useEffect(() => {
    const swallow = (event: DragEvent) => event.preventDefault();
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    return () => {
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
    };
  }, []);

  async function fileToEvidence(
    file: File,
    kind: EvidenceKind,
  ): Promise<EvidenceImage[]> {
    if (file.size > MAX_SOURCE_FILE_BYTES) return [];

    if (file.type === "application/pdf") {
      const pages = await pdfToImages(file);
      return pages.map((page) => ({
        id: nextEvidenceId(),
        kind,
        fileName: file.name,
        mimeType: page.mimeType,
        dataUrl: page.dataUrl,
        sourcePage: page.pageNumber,
      }));
    }

    const compressed = await compressImageFile(file);
    return [
      {
        id: nextEvidenceId(),
        kind,
        fileName: file.name,
        mimeType: compressed.mimeType,
        dataUrl: compressed.dataUrl,
      },
    ];
  }

  async function runExtract(images: EvidenceImage[]) {
    if (images.length === 0) {
      setStatus({ phase: "idle" });
      return;
    }

    setStatus({ phase: "extracting" });
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map((image) => ({
            dataUrl: image.dataUrl,
            kind: image.kind,
          })),
        }),
      });

      if (!response.ok) throw new Error(`extract ${response.status}`);

      const result = (await response.json()) as ExtractResult;
      const filled = applyPrefill(result.fields ?? {});

      if (filled.length > 0) {
        onPrefilled(filled);
        setStatus({ phase: "filled", fields: filled });
      } else {
        setStatus({
          phase: "quiet",
          note: "这几张图里没读到可以填的字段，下一步手动填一下就行。",
        });
      }
    } catch {
      // 断网、超时、模型跑偏都走这里：证据留着，流程照常
      setStatus({
        phase: "quiet",
        note: "这次没能自动识别，下一步手动填一下就行，不影响后面的分析。",
      });
    }
  }

  async function handleFiles(fileList: FileList | null, kind: EvidenceKind) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, Math.max(remainingSlots, 0));
    if (files.length === 0) {
      setStatus({
        phase: "quiet",
        note: `最多留 ${MAX_EVIDENCE_IMAGES} 张证据，先删掉几张再传。`,
      });
      return;
    }

    setStatus({ phase: "processing", note: "正在压缩图片…" });

    const added: EvidenceImage[] = [];
    let skipped = 0;

    for (const file of files) {
      try {
        const items = await fileToEvidence(file, kind);
        if (items.length === 0) skipped += 1;
        added.push(...items);
      } catch {
        // 单个文件解码失败（HEIC、加密 PDF 等）：跳过它，别连累其他文件
        skipped += 1;
      }
    }

    const capped = added.slice(0, Math.max(remainingSlots, 0));
    if (capped.length > 0) {
      updateDraft((current) => ({
        evidence: [...current.evidence, ...capped].slice(0, MAX_EVIDENCE_IMAGES),
      }));
    }

    if (capped.length === 0) {
      setStatus({
        phase: "quiet",
        note: "这个文件读不出来（iPhone 的 HEIC 或加密 PDF 常见）。换成 JPG / PNG 再试，或者直接手填。",
      });
      return;
    }

    if (skipped > 0) {
      // 有成功的就继续识别，失败的只提一句
      setStatus({ phase: "processing", note: `有 ${skipped} 个文件没读出来，其余继续。` });
    }

    await runExtract(capped);
  }

  function removeEvidence(id: string) {
    updateDraft((current) => ({
      evidence: current.evidence.filter((item) => item.id !== id),
    }));
  }

  const totalBytes = evidence.reduce(
    (sum, item) => sum + dataUrlBytes(item.dataUrl),
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        {ALL_SLOTS.map((slot) => (
          <input
            key={slot.kind}
            ref={(node) => {
              inputsRef.current[slot.kind] = node;
            }}
            type="file"
            accept={slot.accept}
            multiple
            className="sr-only"
            onChange={(event) => {
              void handleFiles(event.target.files, slot.kind);
              event.target.value = "";
            }}
          />
        ))}
      </div>

      {/* ── 落点 ──
          「拖进来」原先只是一句文案：整个组件没有任何 drag 事件，把文件拖上去
          浏览器会直接打开那个 PDF、把向导填的东西全冲掉。现在是真的能拖了。
          拖拽悬停时整块翻成实心朱红：这是全站最强的一个颜色，用在「松手就开始」
          这一刻正好 —— 落点必须在余光里也认得出来。 */}
      <button
        type="button"
        onClick={() => inputsRef.current[HERO_SLOT.kind]?.click()}
        disabled={remainingSlots <= 0}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragDepth((depth) => depth + 1);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          // 没有这一行，光标会显示成「不可放置」
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => setDragDepth((depth) => Math.max(depth - 1, 0))}
        onDrop={(event) => {
          event.preventDefault();
          setDragDepth(0);
          void handleFiles(event.dataTransfer.files, HERO_SLOT.kind);
        }}
        className={`group flex w-full items-center gap-6 border-2 px-6 py-7 text-left transition-colors duration-150 disabled:opacity-40 ${
          dragging
            ? "border-solid border-seal bg-seal"
            : "border-dashed border-seal/55 bg-seal/5 hover:border-solid hover:border-seal hover:bg-seal/12"
        }`}
      >
        {/* 落点的标记是一个大朱红加号；拖拽中整块变朱红，它反过来变米白 */}
        <span
          className={`text-title leading-none transition-colors duration-150 ${
            dragging ? "text-paper" : "text-verdict-unlawful"
          }`}
          aria-hidden="true"
        >
          ＋
        </span>
        <span className="min-w-0">
          <span
            className={`block text-section font-bold transition-colors duration-150 ${
              dragging ? "text-paper" : "text-ink"
            }`}
          >
            {dragging
              ? "松手，它就开始读"
              : `拖进来，或点击选择 · ${HERO_SLOT.label}`}
          </span>
          <span
            className={`mt-1.5 block text-label transition-colors duration-150 ${
              dragging ? "text-paper/80" : "text-muted"
            }`}
          >
            扣款清单 / 入住报告 / 租约 / 聊天截图 · PDF 与图片都行。
            入住报告最关键 —— 它能推翻大多数扣款。
          </span>
        </span>
      </button>

      {/* ── 分类入口 ──
          hover 原先只是 `border-ink/40`：白卡放在米白纸上，一条发丝线深一点点，
          鼠标扫过去等于没有反馈。现在给三个同时发生的信号 ——
          顶边落下一道朱红（与首页流水线同一个装置）、加号变朱红、描边转墨黑。 */}
      <div className="grid gap-2.5 md:grid-cols-2">
        {UPLOAD_SLOTS.map((slot) => (
          <button
            key={slot.kind}
            type="button"
            onClick={() => inputsRef.current[slot.kind]?.click()}
            disabled={remainingSlots <= 0}
            className="group relative h-full w-full border border-line bg-card px-4 py-3.5 text-left transition-colors duration-150 hover:border-ink disabled:opacity-40 disabled:hover:border-line"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-seal opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-disabled:opacity-0"
            />
            <span className="block text-label font-medium text-ink">
              <span
                aria-hidden="true"
                className="mr-1.5 text-faint transition-colors duration-150 group-hover:text-verdict-unlawful"
              >
                +
              </span>
              {slot.label}
            </span>
            <span className="mt-0.5 block text-caption leading-snug text-muted">
              {slot.hint}
            </span>
          </button>
        ))}
      </div>

      <StatusLine status={status} />

      {evidence.length > 0 ? (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-label font-medium text-ink">
              已上传 {evidence.length} / {MAX_EVIDENCE_IMAGES}
            </p>
            <p className="font-mono text-micro text-muted">
              {(totalBytes / 1024 / 1024).toFixed(1)} MB · 仅存在这次会话里
            </p>
          </div>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {evidence.map((item) => (
              <li
                key={item.id}
                className="relative overflow-hidden border border-line bg-card"
              >
                {/* 会话内的 dataURL 缩略图，不走远端存储 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={item.fileName}
                  className="h-24 w-full object-cover"
                />
                <div className="px-2 py-1.5">
                  <p className="truncate text-micro text-muted">
                    {KIND_LABEL[item.kind]}
                    {item.sourcePage ? ` · 第 ${item.sourcePage} 页` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeEvidence(item.id)}
                  aria-label={`删除 ${item.fileName}`}
                  className="absolute right-1 top-1 bg-ink/80 px-2 py-0.5 font-mono text-micro text-paper transition-colors duration-150 hover:bg-seal"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.phase === "idle") return null;

  if (status.phase === "processing" || status.phase === "extracting") {
    const note =
      status.phase === "extracting"
        ? "正在读图上的金额和日期…"
        : status.note;
    return (
      <p className="flex items-center gap-2 text-label text-muted">
        <span className="size-2 animate-pulse rounded-full bg-gold-bright" />
        {note}
      </p>
    );
  }

  if (status.phase === "quiet") {
    return <p className="text-label leading-relaxed text-muted">{status.note}</p>;
  }

  return (
    <div className="prefilled border-l-[3px] border-l-alert-verify bg-verdict-doubtful-wash px-4 py-3.5">
      <p className="text-label font-medium text-ink">
        已根据你的证据自动填好 {status.fields.length} 项
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {status.fields.map((field) => (
          <li
            key={field}
            className="border border-alert-verify/40 px-2.5 py-1 font-mono text-micro text-verdict-doubtful"
          >
            {PREFILL_FIELD_LABELS[field]}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-caption leading-relaxed text-muted">
        下一步核对一下，数字不对随时改——改过的字段不会再被覆盖。
      </p>
    </div>
  );
}
