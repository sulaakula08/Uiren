import type { LatePolicy, LateRequestStatus } from "@prisma/client";
import type { MessageKey } from "@/lib/i18n";

/**
 * Можно ли ученику сдать работу.
 *
 * Одно место, где принимается это решение. Проверка нужна и на странице (чтобы
 * не показывать бесполезную кнопку), и в серверном действии (чтобы кнопку
 * нельзя было обойти). Если правила разъедутся, ученик увидит форму, отправка
 * из которой всегда падает, — поэтому обе стороны спрашивают одну функцию.
 */
export type Access =
  | { canSubmit: true; late: boolean; reason: null }
  | {
      canSubmit: false;
      late: true;
      reason: "BLOCKED" | "NEEDS_REQUEST" | "REQUEST_PENDING" | "REQUEST_DECLINED";
    };

export function submissionAccess(input: {
  dueAt: Date | null;
  latePolicy: LatePolicy;
  requestStatus: LateRequestStatus | null;
  now?: Date;
}): Access {
  const now = input.now ?? new Date();

  // Срока нет или он ещё не наступил — обычная сдача.
  if (!input.dueAt || now <= input.dueAt) {
    return { canSubmit: true, late: false, reason: null };
  }

  if (input.latePolicy === "OPEN") {
    // Сдать можно, но работа уже помечена как поздняя — учитель это увидит.
    return { canSubmit: true, late: true, reason: null };
  }

  if (input.latePolicy === "BLOCK") {
    return { canSubmit: false, late: true, reason: "BLOCKED" };
  }

  // REQUEST: открывает только одобренная заявка.
  if (input.requestStatus === "APPROVED") {
    return { canSubmit: true, late: true, reason: null };
  }
  if (input.requestStatus === "PENDING") {
    return { canSubmit: false, late: true, reason: "REQUEST_PENDING" };
  }
  if (input.requestStatus === "DECLINED") {
    return { canSubmit: false, late: true, reason: "REQUEST_DECLINED" };
  }
  return { canSubmit: false, late: true, reason: "NEEDS_REQUEST" };
}

/**
 * Ключи словаря, а не готовые строки: этот модуль зовут и с сервера, и с
 * клиента, а язык у каждого пользователя свой.
 */
export const ACCESS_KEYS: Record<
  Exclude<Access["reason"], null>,
  { title: MessageKey; text: MessageKey }
> = {
  BLOCKED: { title: "late.passed", text: "late.blocked" },
  NEEDS_REQUEST: { title: "late.passed", text: "late.needsRequest" },
  REQUEST_PENDING: { title: "late.pendingTitle", text: "late.pending" },
  REQUEST_DECLINED: { title: "late.declinedTitle", text: "late.declined" },
};

export const POLICY_KEY: Record<LatePolicy, MessageKey> = {
  OPEN: "policy.OPEN",
  REQUEST: "policy.REQUEST",
  BLOCK: "policy.BLOCK",
};

export const POLICY_HINT_KEY: Record<LatePolicy, MessageKey> = {
  OPEN: "policyHint.OPEN",
  REQUEST: "policyHint.REQUEST",
  BLOCK: "policyHint.BLOCK",
};
