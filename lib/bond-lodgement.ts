/**
 * 押金存管分级判断 —— **确定性代码，LLM 不参与**（母文档 §3.2、02-wizard.md）。
 *
 * 军规：
 * - 「没收到确认邮件」永远不能单独证明未存管，只能给黄色核实提示。
 * - 租客直接付给 RBO/RTBA 时，不得套用「provider 收款后未转交」的判断。
 * - 缺收款人 / 付款日期 / NSW 分期信息 → 一律降级为 verify-record。
 * - 红色等级必须给出可展示的计算依据；措辞一律「可能」，罚则不写成租客获赔。
 *
 * 法条依据（只读 data/legal，不在此复制条文）：
 * - NSW: Residential Tenancies Act 2010 s 162
 * - VIC: Residential Tenancies Act 1997 s 406
 */

import {
  addBusinessDays,
  addDays,
  addMonths,
  endOfMonth,
  formatIsoDateZh,
  isIsoDate,
  maxDate,
  parseIsoDate,
  todayIsoDate,
  toIsoDate,
} from "@/lib/dates";
import type {
  AUState,
  BondLodgementAlert,
  BondPayment,
  CaseInput,
} from "@/lib/types";

/** 工作日算法未覆盖州假日与复活节等浮动假日，超过缓冲期才敢说「可能已过期限」。 */
const GRACE_DAYS = 5;

const STATE_TIME_ZONE: Record<AUState, string> = {
  NSW: "Australia/Sydney",
  VIC: "Australia/Melbourne",
};

const AUTHORITY_NAME: Record<AUState, string> = {
  NSW: "Rental Bonds Online（NSW Fair Trading）",
  VIC: "RTBA",
};

interface DeadlineComputation {
  deadline: string;
  basisZh: string;
}

/** 信息不足时返回原因，交给调用方降级为 verify-record。 */
type DeadlineOutcome =
  | { kind: "computed"; value: DeadlineComputation }
  | { kind: "insufficient"; reasonZh: string };

function sortedIsoDates(values: (string | undefined)[]): string[] {
  return values.filter((value): value is string => isIsoDate(value)).sort();
}

/** NSW s 162：一次性支付 —— 中介按收款月末起算，其他收款人按付款日起算。 */
function nswOneOffDeadline(payment: BondPayment, paidAt: Date): DeadlineOutcome {
  if (payment.paidTo === "agent" || payment.paidTo === "other") {
    // 「其他」身份不明，取较晚的中介算法，避免过早断言超期
    const start = endOfMonth(paidAt);
    const deadline = addBusinessDays(start, 10);
    const roleZh =
      payment.paidTo === "agent"
        ? "押金付给中介"
        : "收款人身份不确定，按较宽松的中介口径估算";
    return {
      kind: "computed",
      value: {
        deadline: toIsoDate(deadline),
        basisZh: `${roleZh}，NSW《Residential Tenancies Act 2010》s 162 要求在收款月份结束（${formatIsoDateZh(
          toIsoDate(start),
        )}）后 10 个工作日内存管，估算期限为 ${formatIsoDateZh(toIsoDate(deadline))}。`,
      },
    };
  }

  const deadline = addBusinessDays(paidAt, 10);
  return {
    kind: "computed",
    value: {
      deadline: toIsoDate(deadline),
      basisZh: `押金付给房东，NSW s 162 要求在收款后 10 个工作日内存管，按付款日 ${formatIsoDateZh(
        toIsoDate(paidAt),
      )} 估算期限为 ${formatIsoDateZh(toIsoDate(deadline))}。`,
    },
  };
}

/**
 * NSW s 162(4)：分期支付不能套用一次性的统一 10 天算法。
 * - 首期后 3 个月内付清 → 付清后 10 个工作日
 * - 否则首批款项取「首期后 3 个月」与「各期后 10 个工作日」中较晚者
 */
function nswInstalmentDeadline(
  payment: BondPayment,
  firstPaidAt: Date,
): DeadlineOutcome {
  const instalments = sortedIsoDates([
    toIsoDate(firstPaidAt),
    ...(payment.instalmentDates ?? []),
  ]);

  if (instalments.length < 2) {
    return {
      kind: "insufficient",
      reasonZh:
        "你选择了分期支付，但缺少后续分期或付清日期。NSW s 162(4) 的分期规则与一次性支付不同，无法用统一的 10 天算法估算。",
    };
  }

  const threeMonthMark = addMonths(firstPaidAt, 3);
  const fullyPaidAt = parseIsoDate(instalments[instalments.length - 1]!)!;

  if (fullyPaidAt.getTime() <= threeMonthMark.getTime()) {
    const deadline = addBusinessDays(fullyPaidAt, 10);
    return {
      kind: "computed",
      value: {
        deadline: toIsoDate(deadline),
        basisZh: `押金分期支付且在首期后 3 个月内付清（付清日 ${formatIsoDateZh(
          toIsoDate(fullyPaidAt),
        )}），NSW s 162(4) 要求付清后 10 个工作日内存管，估算期限为 ${formatIsoDateZh(
          toIsoDate(deadline),
        )}。`,
      },
    };
  }

  // 未在 3 个月内付清：只评估首批款项的期限（较晚者），后续各期另有节点
  const withinFirstQuarter = instalments.filter(
    (iso) => parseIsoDate(iso)!.getTime() <= threeMonthMark.getTime(),
  );
  const lastEarlyInstalment = parseIsoDate(
    withinFirstQuarter[withinFirstQuarter.length - 1] ?? instalments[0]!,
  )!;
  const deadline = maxDate(
    threeMonthMark,
    addBusinessDays(lastEarlyInstalment, 10),
  );

  return {
    kind: "computed",
    value: {
      deadline: toIsoDate(deadline),
      basisZh: `押金分期支付且未在首期后 3 个月内付清，NSW s 162(4) 对首批款项采用「首期后 3 个月」（${formatIsoDateZh(
        toIsoDate(threeMonthMark),
      )}）与「各期后 10 个工作日」中较晚者，估算期限为 ${formatIsoDateZh(
        toIsoDate(deadline),
      )}；其后的分期另有 3 个月节点。`,
    },
  };
}

/** VIC s 406：provider 收到押金后 10 个工作日内交 RTBA。 */
function vicDeadline(payment: BondPayment, paidAt: Date): DeadlineOutcome {
  let effectivePaidAt = paidAt;
  let instalmentNoteZh = "";

  if (payment.paidByInstalments === "yes") {
    const instalments = sortedIsoDates([
      toIsoDate(paidAt),
      ...(payment.instalmentDates ?? []),
    ]);
    if (instalments.length < 2) {
      return {
        kind: "insufficient",
        reasonZh:
          "你选择了分期支付，但缺少后续分期或付清日期，无法确定 RTBA 存管义务的起算日。",
      };
    }
    effectivePaidAt = parseIsoDate(instalments[instalments.length - 1]!)!;
    instalmentNoteZh = "（分期支付，按最后一期起算）";
  }

  const deadline = addBusinessDays(effectivePaidAt, 10);
  return {
    kind: "computed",
    value: {
      deadline: toIsoDate(deadline),
      basisZh: `押金由出租方（provider）或其中介收取${instalmentNoteZh}，VIC《Residential Tenancies Act 1997》s 406 要求收款后 10 个工作日内交给 RTBA，按 ${formatIsoDateZh(
        toIsoDate(effectivePaidAt),
      )} 估算期限为 ${formatIsoDateZh(toIsoDate(deadline))}。`,
    },
  };
}

function computeDeadline(
  state: AUState,
  payment: BondPayment,
): DeadlineOutcome {
  if (!isIsoDate(payment.paidAt)) {
    return {
      kind: "insufficient",
      reasonZh: "缺少押金支付日期，无法计算法定存管期限。",
    };
  }

  const paidAt = parseIsoDate(payment.paidAt)!;

  if (state === "VIC") return vicDeadline(payment, paidAt);

  if (payment.paidByInstalments === "yes") {
    return nswInstalmentDeadline(payment, paidAt);
  }
  if (payment.paidByInstalments === "unsure") {
    return {
      kind: "insufficient",
      reasonZh:
        "不确定押金是否分期支付。NSW s 162 对一次性与分期支付适用不同期限，无法据此估算。",
    };
  }
  return nswOneOffDeadline(payment, paidAt);
}

function verifyRecord(
  state: AUState,
  reasonZh: string,
  deadline?: DeadlineComputation,
): BondLodgementAlert {
  return {
    level: "verify-record",
    reasoningZh: `${reasonZh}建议先在 ${AUTHORITY_NAME[state]} 查询押金记录并保留查询结果，再判断是否存在存管问题。`,
    calculatedDeadline: deadline?.deadline,
    deadlineBasis: deadline?.basisZh,
  };
}

export interface BondLodgementInput {
  state: AUState;
  bondPayment: BondPayment;
}

/**
 * 计算存管提示等级。`asOf` 便于测试与演示，缺省取该州今天。
 */
export function evaluateBondLodgement(
  input: BondLodgementInput,
  asOf?: string,
): BondLodgementAlert {
  const { state, bondPayment } = input;
  const today = isIsoDate(asOf) ? asOf : todayIsoDate(STATE_TIME_ZONE[state]);
  const authority = AUTHORITY_NAME[state];

  // 规则 4：租客直接付给押金管理机构 → 不存在 provider 转交义务
  if (bondPayment.paidTo === "bond-authority") {
    return {
      level: "none",
      reasoningZh: `你的押金直接支付给 ${authority}，不涉及房东或中介「收款后未转交」的情形，因此不适用未按期存管的判断。`,
    };
  }

  // 规则 4：官方记录已查到 → 无存管问题
  if (bondPayment.lookup.status === "found") {
    return {
      level: "none",
      reasoningZh: `你已在 ${authority} 查到押金记录，说明押金已进入官方存管系统。`,
    };
  }

  if (bondPayment.paidTo === "unsure") {
    return verifyRecord(
      state,
      "你不确定押金当初付给了谁，而存管义务的适用对象和期限都取决于收款人身份。",
    );
  }

  const outcome = computeDeadline(state, bondPayment);
  if (outcome.kind === "insufficient") {
    return verifyRecord(state, outcome.reasonZh);
  }

  const deadline = outcome.value;

  // 规则 1：未查询 / 不确定官方记录 → 只做核实提示，不得断言违法
  if (
    bondPayment.lookup.status === "not-checked" ||
    bondPayment.lookup.status === "unsure"
  ) {
    const emailNote =
      bondPayment.confirmationReceived === "yes"
        ? ""
        : "没有收到确认邮件本身不能证明押金未存管（邮件可能发到旧邮箱或被过滤）。";
    return verifyRecord(
      state,
      `${emailNote}你还没有确认过官方记录。`,
      deadline,
    );
  }

  // 期限尚未（明显）届满 → 不升级
  const graceDeadline = toIsoDate(addDays(parseIsoDate(deadline.deadline)!, GRACE_DAYS));
  if (today <= graceDeadline) {
    return verifyRecord(
      state,
      `按你提供的信息估算，法定存管期限约在 ${formatIsoDateZh(
        deadline.deadline,
      )}，目前尚未确定已经过期（工作日估算未计入州公共假日）。`,
      deadline,
    );
  }

  // 规则 3：authority 书面确认查无记录
  if (bondPayment.lookup.evidence === "authority-written") {
    return {
      level: "authority-confirmed-missing",
      reasoningZh: `${authority} 已书面确认没有查到你的押金记录，且按你提供的付款信息估算，法定存管期限（约 ${formatIsoDateZh(
        deadline.deadline,
      )}）已经过去。这指向房东或中介**可能**未按期存管押金，是需要尽快跟进的高风险信号。是否构成违规须由监管机构或 Tribunal 认定，法条上的最高罚款是监管处罚上限，不是自动付给租客的赔偿。`,
      calculatedDeadline: deadline.deadline,
      deadlineBasis: deadline.basisZh,
    };
  }

  // 规则 2：官方记录查不到，付款信息足以证明期限已过
  return {
    level: "possible-non-lodgement",
    reasoningZh: `你在 ${authority} 查不到押金记录，且按你提供的付款信息估算，法定存管期限（约 ${formatIsoDateZh(
      deadline.deadline,
    )}）已经过去，因此**可能**存在未按期存管的情况。建议再向机构索取书面查询结果确认；在获得确认前不宜把它当作已认定的违规。`,
    calculatedDeadline: deadline.deadline,
    deadlineBasis: deadline.basisZh,
  };
}

export interface ClaimNoticeDeadline {
  /** 用户录入的通知期限优先，缺失时才用州别默认天数估算 */
  dueAt?: string;
  source: "notice" | "estimated" | "unknown";
  noteZh: string;
}

/**
 * 规则 5：claim notice 的紧急期限优先采用通知上明列的 due date，
 * 不得仅凭州别自行覆盖实际通知日期。
 */
export function resolveClaimNoticeDeadline(
  input: Pick<CaseInput, "state" | "claimNotice">,
): ClaimNoticeDeadline | null {
  const notice = input.claimNotice;
  if (!notice) return null;

  if (isIsoDate(notice.dueAt)) {
    return {
      dueAt: notice.dueAt,
      source: "notice",
      noteZh: `以你收到的通知上写明的期限为准：${formatIsoDateZh(notice.dueAt)}。`,
    };
  }

  if (isIsoDate(notice.receivedAt)) {
    const estimated = toIsoDate(addDays(parseIsoDate(notice.receivedAt)!, 14));
    const postNote =
      notice.deliveryMethod === "post"
        ? "（邮寄送达的实际操作期可能更长，务必以通知原件为准）"
        : "";
    return {
      dueAt: estimated,
      source: "estimated",
      noteZh: `通知上没有记录明确期限，按收到日 ${formatIsoDateZh(
        notice.receivedAt,
      )} 加 14 天粗略估算为 ${formatIsoDateZh(estimated)}${postNote}。请立即核对通知原件上的实际日期。`,
    };
  }

  return {
    source: "unknown",
    noteZh:
      "你已收到押金 claim 通知，但没有记录日期。通知上的期限通常很短，请马上翻出通知确认截止日。",
  };
}
