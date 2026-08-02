import "server-only";
import { db } from "./db";

export type FamilyState = { ok?: string; error?: string };

/**
 * Связка «родитель — ученик».
 *
 * Обе стороны заводят её одинаково: по почте второго участника и только внутри
 * своей школы. Раньше связь возникала лишь в момент регистрации родителя —
 * если ребёнок регистрировался позже или в семье двое детей, привязать их
 * было уже нечем.
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
    select: { id: true },
  });
  if (existing) return { error: `${counterpart.fullName} уже привязан.` };

  await db.parentLink.create({ data: { parentId, studentId } });

  return {
    ok:
      counterpartRole === "STUDENT"
        ? `${counterpart.fullName} добавлен — успеваемость появится ниже.`
        : `${counterpart.fullName} теперь видит вашу успеваемость.`,
  };
}

/** Разрыв связи. Инициировать может любая из сторон — обе видят одну строку. */
export async function unlinkFamily({
  parentId,
  studentId,
}: {
  parentId: string;
  studentId: string;
}) {
  if (!parentId || !studentId) return;
  await db.parentLink.deleteMany({ where: { parentId, studentId } });
}
