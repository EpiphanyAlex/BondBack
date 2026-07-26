/**
 * `/api/extract` 的输出契约：OpenAI structured outputs 用手写 JSON Schema，
 * 回来的 JSON 再过一遍 zod（docs/plan.md：双重校验）。
 * 校验不过就当作「没识别出来」，绝不把脏数据写进表单。
 */

import { z } from "zod";

import { isIsoDate } from "@/lib/dates";
import type { ExtractedCaseFields } from "@/lib/types";

/** 一次最多接受多少条扣款明细，防止模型把整页文字拆成几十行 */
const MAX_DEDUCTIONS = 12;
const MAX_TEXT_LENGTH = 200;
/** 押金号只是一串编号，长过这个多半是模型把整行说明抄了进来 */
const MAX_BOND_NUMBER_LENGTH = 60;

/** strict 模式要求所有字段 required，可空字段用 null 表示「没读到」。 */
export const EXTRACT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "bondAmount",
    "claimedAmount",
    "moveOutDate",
    "propertyAddress",
    "bondNumber",
    "deductions",
  ],
  properties: {
    bondAmount: {
      type: ["number", "null"],
      description: "押金总额（AUD 数字，不带货币符号）。图中没有明确写出就返回 null。",
    },
    claimedAmount: {
      type: ["number", "null"],
      description: "房东/中介声称要从押金中扣除的总金额（AUD）。没有就返回 null。",
    },
    moveOutDate: {
      type: ["string", "null"],
      description: "退租日 / 租约结束日，格式 YYYY-MM-DD。无法确定就返回 null。",
    },
    propertyAddress: {
      type: ["string", "null"],
      description: "租赁房屋地址原文。没有就返回 null。",
    },
    bondNumber: {
      type: ["string", "null"],
      description:
        "押金存管编号原文（NSW 常见形如 RB-2025-402917 / rental bond number；VIC 为 bond number）。逐字照抄，不要改格式。没有明确写出就返回 null。",
    },
    deductions: {
      type: ["array", "null"],
      description: "逐项扣款明细；图中没有明细清单就返回 null。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "amount"],
        properties: {
          description: {
            type: "string",
            description: "扣款项目的原文描述（可保留英文）。",
          },
          amount: {
            type: ["number", "null"],
            description: "该项金额（AUD）；只写了项目没写金额就返回 null。",
          },
        },
      },
    },
  },
} as const;

// max() 顺带挡掉 Infinity；金额上限远高于任何真实押金
const amountSchema = z.number().nonnegative().max(1_000_000).nullable();

const extractPayloadSchema = z.object({
  bondAmount: amountSchema,
  claimedAmount: amountSchema,
  moveOutDate: z.string().max(40).nullable(),
  propertyAddress: z.string().max(MAX_TEXT_LENGTH).nullable(),
  bondNumber: z.string().max(MAX_BOND_NUMBER_LENGTH).nullable(),
  deductions: z
    .array(
      z.object({
        description: z.string().max(MAX_TEXT_LENGTH),
        amount: amountSchema,
      }),
    )
    .nullable(),
});

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 把模型输出收敛成 `ExtractedCaseFields`。任何可疑值直接丢掉 ——
 * 少填一个字段只是少一点惊喜，填错会让用户对整个产品失去信任。
 */
export function parseExtractPayload(raw: unknown): ExtractedCaseFields {
  const result = extractPayloadSchema.safeParse(raw);
  if (!result.success) return {};

  const data = result.data;
  const fields: ExtractedCaseFields = {};

  if (data.bondAmount !== null && data.bondAmount > 0) {
    fields.bondAmount = round2(data.bondAmount);
  }
  if (data.claimedAmount !== null && data.claimedAmount > 0) {
    fields.claimedAmount = round2(data.claimedAmount);
  }
  if (data.moveOutDate !== null && isIsoDate(data.moveOutDate.trim())) {
    fields.moveOutDate = data.moveOutDate.trim();
  }
  if (data.propertyAddress !== null && data.propertyAddress.trim()) {
    fields.propertyAddress = data.propertyAddress.trim();
  }
  if (data.bondNumber !== null && data.bondNumber.trim()) {
    fields.bondNumber = data.bondNumber.trim();
  }
  if (data.deductions !== null) {
    const deductions = data.deductions
      .map((item) => ({
        description: item.description.trim(),
        ...(item.amount !== null && item.amount > 0
          ? { amount: round2(item.amount) }
          : {}),
      }))
      .filter((item) => item.description.length > 0)
      .slice(0, MAX_DEDUCTIONS);
    if (deductions.length > 0) fields.deductions = deductions;
  }

  return fields;
}
