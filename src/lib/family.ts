import "server-only";
import { db } from "./db";

export type FamilyState = { ok?: string; error?: string };

/**
 * Связь «родитель — ученик».
 *
 * Обе стороны заводят её одинаково: по почте второго участника и только внутри
 * своей школы. Раньше связь возникала лишь в момент регистрации родителя —
 * если ребёнок регистрировался позже или в семье двое детей, привязать их
 * было уже нечем.
 *
 * Одной почты для доступа к оценкам недостаточно: её знает половина школы.
 * Поэтому связь создаётся заявкой, а открывает данные только подтверждение
 * второй стороны — той, чьи оценки на кону.
 */
async function findCounterpart(
  email: string,
  role: "STUDENT" | "PARENT",
  schoolId: string,
) {
  return db.user.findFirst({
    where: { email, role, schoolId },
    select: { id: true, fullName: true },
  });
}

export async function linkFamilyByEmail({
  selfId,
  schoolId,
  email,
  counterpartRole,
}: {
  selfId: string;
  schoolId: string | null;
  email: string;
  /** Кого ищем по почте: ученика (действие родителя) или родителя (действие ученика). */
  counterpartRole: "STUDENT" | "PARENT";
}): Promise<FamilyState> {
  if (!schoolId) return { error: "Ваш аккаунт не привязан к школе." };

  const normalized = email.trim().toLowerCase();
  if (!normalized) return { error: "Укажите почту." };

  const counterpart = await findCounterpart(
    normalized,
    counterpartRole,
    schoolId,
  );
  if (!counterpart) {
    return {
      error:
        counterpartRole === "STUDENT"
          ? "Ученик с такой почтой не найден в вашей школе. Ребёнок должен сначала зарегистрироваться сам."
          : "Родитель с такой почтой не найден в вашей школе. Он должен сначала зарегистрироваться по коду школы.",
    };
  }

  const parentId = counterpartRole === "STUDENT" ? selfId : counterpart.id;
  const studentId = counterpartRole === "STUDENT" ? counterpart.id : selfId;

  const existing = await db.parentLink.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
    select: { id: true, status: true },
  });
  if (existing) {
    return {
      error:
        existing.status === "ACCEPTED"
          ? `${counterpart.fullName} уже привязан.`
          : `Запрос к ${counterpart.fullName} уже отправлен — ждём подтверждения.`,
    };
  }

  await db.parentLink.create({
    data: { parentId, studentId, requestedById: selfId },
  });

  return {
    ok:
      counterpartRole === "STUDENT"
        ? `Запрос отправлен. ${counterpart.fullName} подтвердит его у себя — до этого оценки не открываются.`
        : `Запрос отправлен. ${counterpart.fullName} подтвердит его у себя.`,
  };
}

/**
 * Подтверждение заявки. Принять может только вторая сторона — тот, кто
 * заявку создал, свою же подтвердить не должен, иначе проверка бессмысленна.
 */
export async function acceptFamilyLink({
  linkId,
  selfId,
}: {
  linkId: string;
  selfId: string;
}): Promise<boolean> {
  const link = await db.parentLink.findUnique({
    where: { id: linkId },
    select: { id: true, parentId: true, studentId: true, requestedById: true },
  });
  if (!link) return false;

  const isParticipant = link.parentId === selfId || link.studentId === selfId;
  if (!isParticipant || link.requestedById === selfId) return false;

  await db.parentLink.update({
    where: { id: link.id },
    data: { status: "ACCEPTED" },
  });
  return true;
}

/**
 * Разрыв связи или отклонение заявки — одно и то же действие: строка исчезает.
 * Доступно обеим сторонам, включая того, кто заявку отправил.
 */
export async function removeFamilyLink({
  linkId,
  selfId,
}: {
  linkId: string;
  selfId: string;
}) {
  if (!linkId) return;
  await db.parentLink.deleteMany({
    where: {
      id: linkId,
      OR: [{ parentId: selfId }, { studentId: selfId }],
    },
  });
}
