"use client";

/**
 * 证据上传 + 自动预填。
 *
 * 军规：**识别失败静默回退手填** —— 这里所有失败路径都只留一行低调提示，
 * 不弹窗、不拦人、不把流程卡住。图片压缩和 PDF 转图都在浏览器里做，
 * 原始文件不出设备，压缩后的图片只在会话内存里。
 */

import { useRef, useState } from "react";

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

const UPLOAD_SLOTS: {
  kind: EvidenceKind;
  label: string;
  hint: string;
  accept: string;
}[] = [
  {
    kind: "chat",
    label: "聊天 / 邮件截图",
    hint: "对方说要扣多少钱的那条",
    accept: "image/*",
  },
  {
    kind: "lease",
    label: "租约 lease",
    hint: "PDF 或照片都行",
    accept: "application/pdf,image/*",
  },
  {
    kind: "condition-report",
    label: "入住 condition report",
    hint: "证明原来就有的痕迹",
    accept: "application/pdf,image/*",
  },
  {
    kind: "room",
    label: "房间照片",
    hint: "退租时的实际状况",
    accept: "image/*",
  },
];

const KIND_LABEL: Record<EvidenceKind, string> = {
  chat: "聊天截图",
  lease: "租约",
  "condition-report": "入住报告",
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
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const evidence = draft.evidence;
  const remainingSlots = MAX_EVIDENCE_IMAGES - evidence.length;

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
          note: "这几张图里没读到可以填的字段，手动填一下就行。",
        });
      }
    } catch {
      // 断网、超时、模型跑偏都走这里：证据留着，流程照常
      setStatus({
        phase: "quiet",
        note: "这次没能自动识别，手动填一下就行，不影响后面的分析。",
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {UPLOAD_SLOTS.map((slot) => (
          <div key={slot.kind}>
            <input
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
            <button
              type="button"
              onClick={() => inputsRef.current[slot.kind]?.click()}
              disabled={remainingSlots <= 0}
              className="h-full w-full rounded-xl border border-dashed border-line bg-card px-3 py-3.5 text-left transition active:scale-[0.99] disabled:opacity-40"
            >
              <span className="block text-sm font-medium text-ink">
                + {slot.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">
                {slot.hint}
              </span>
            </button>
          </div>
        ))}
      </div>

      <StatusLine status={status} />

      {evidence.length > 0 ? (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              已上传 {evidence.length} / {MAX_EVIDENCE_IMAGES}
            </p>
            <p className="font-mono text-[11px] text-muted">
              {(totalBytes / 1024 / 1024).toFixed(1)} MB · 仅存在这次会话里
            </p>
          </div>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {evidence.map((item) => (
              <li
                key={item.id}
                className="relative overflow-hidden rounded-xl border border-line bg-card"
              >
                {/* 会话内的 dataURL 缩略图，不走远端存储 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={item.fileName}
                  className="h-24 w-full object-cover"
                />
                <div className="px-2 py-1.5">
                  <p className="truncate text-[11px] text-muted">
                    {KIND_LABEL[item.kind]}
                    {item.sourcePage ? ` · 第 ${item.sourcePage} 页` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeEvidence(item.id)}
                  aria-label={`删除 ${item.fileName}`}
                  className="absolute right-1 top-1 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] text-white"
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
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="size-2 animate-pulse rounded-full bg-gold-bright" />
        {note}
      </p>
    );
  }

  if (status.phase === "quiet") {
    return <p className="text-sm leading-relaxed text-muted">{status.note}</p>;
  }

  return (
    <div className="prefilled rounded-xl border border-gold-bright/50 px-3.5 py-3">
      <p className="text-sm font-medium text-ink">
        已根据你的证据自动填好 {status.fields.length} 项
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {status.fields.map((field) => (
          <li
            key={field}
            className="rounded-full bg-gold-wash px-2.5 py-1 font-mono text-[11px] text-gold"
          >
            {PREFILL_FIELD_LABELS[field]}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        回上一步核对一下，数字不对随时改——改过的字段不会再被覆盖。
      </p>
    </div>
  );
}
