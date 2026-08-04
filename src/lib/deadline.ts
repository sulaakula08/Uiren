import type { LatePolicy, LateRequestStatus } from "@prisma/client";

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
  | { canSubmit: false; late: true; reason: "BLOCKED" | "NEEDS_REQUEST" | "REQUEST_PENDING" | "REQUEST_DECLINED" };

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

export const ACCESS_TEXT: Record<
  Exclude<Access["reason"], null>,
  { title: string; text: string }
> = {
  BLOCKED: {
    title: "Срок сдачи прошёл",
    text: "Учитель закрыл приём этой работы. Если считаете, что это ошибка, напишите ему в переписке.",
  },
  NEEDS_REQUEST: {
    title: "Срок сдачи прошёл",
    text: "Сдать ещё можно, но нужно разрешение учителя. Напишите, почему не успели, — он ответит.",
  },
  REQUEST_PENDING: {
    title: "Запрос отправлен",
    text: "Учитель его видит. Как только откроет доступ, здесь появится форма сдачи.",
  },
  REQUEST_DECLINED: {
    title: "Учитель отказал",
    text: "Работу принять не получится. Причину можно уточнить в переписке.",
  },
};

export const POLICY_LABEL: Record<LatePolicy, string> = {
  OPEN: "Можно сдать и после срока",
  REQUEST: "После срока — только с разрешения",
  BLOCK: "После срока сдать нельзя",
};

export const POLICY_HINT: Record<LatePolicy, string> = {
  OPEN: "Работа будет помечена как сданная позже срока.",
  REQUEST: "Ученик сможет попросить вас открыть доступ.",
  BLOCK: "Форма сдачи закроется, попросить будет нельзя.",
};
