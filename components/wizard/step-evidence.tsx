"use client";

/**
 * 第 2 步：上传证据（可跳过）。
 *
 * 上传优先（v1.1）：这一步只管收材料 + 触发预填，核对留给第 3 步。
 * 跳过的代价要说清楚，但只说事实——信息量决定结论强度，不吓人。
 */

import type { PrefillableField } from "@/lib/case-draft";

import { EvidenceUploader } from "./evidence-uploader";
import { Callout, SectionCard } from "./fields";

export function StepEvidence({
  onPrefilled,
}: {
  onPrefilled: (fields: PrefillableField[]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* 不再给这一组起「拖进来，或点击选择文件」的小标题：
          页面抬头已经是「手里有什么，先传上来」，落点上还写着「拖进来，或点击选择」
          —— 同一句话连说三遍，读者只会跳过。这里只留它们都没说的那件事：
          读出来干什么用、图片去了哪。 */}
      <SectionCard hint="AI 会读出押金、被扣金额、退租日期和扣款明细，直接填进下一步的表。图片只留在这次会话里，不上传存档。">
        <EvidenceUploader onPrefilled={onPrefilled} />
      </SectionCard>

      <Callout tone="info" title="一张都没有？也能继续">
        下一步全部手填一样走得通。只是没有证据，多数结论会停在「待核实」——
        不是判你输，是还没有东西能把话说死。材料越全，结论越敢下。
      </Callout>
    </div>
  );
}
