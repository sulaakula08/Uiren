"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const userSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["ADMIN", "DIRECTOR", "TEACHER", "STUDENT", "PARENT"]),
  locale: z.enum(["ru", "kk"]),
  password: z.string().min(6),
});

export type AdminState = { ok?: string; error?: string };

export async function createUser(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const session = await requireRole("ADMIN");

  const parsed = userSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    role: String(formData.get("role") ?? "TEACHER"),
    locale: String(formData.get("locale") ?? "ru"),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      error:
        "Проверьте поля: корректная почта, ФИО от 2 символов, пароль от 6 символов.",
    };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: "Пользователь с такой почтой уже существует." };

  await db.user.create({
    data: {
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      locale: parsed.data.locale,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      schoolId: session.schoolId,
    },
  });

  revalidatePath("/admin");
  return { ok: `Пользователь ${parsed.data.fullName} создан.` };
}

/** Журнал выбирается школой; Uiren работает поверх любого из них. */
export async function setJournal(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return { error: "Аккаунт не привязан к школе." };

  const journal = String(formData.get("journal") ?? "NONE");
  if (!["KUNDELIK", "BILIMCLASS", "EDUMARK", "NONE"].includes(journal)) {
    return { error: "Неизвестный журнал." };
  }

  await db.school.update({
    where: { id: session.schoolId },
    data: { journal },
  });

  revalidatePath("/admin");
  return { ok: "Журнал сохранён." };
}

/** Понятный пароль: без похожих друг на друга символов, их диктуют вслух. */
function temporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export type ResetState = { error?: string; password?: string; name?: string };

/**
 * Сброс пароля администратором.
 *
 * Новый пароль показывается один раз и нигде не хранится в открытом виде —
 * администратор передаёт его человеку лично. Это единственный путь: рассылки
 * у платформы нет, а восстановление «по секретному вопросу» в школе означает,
 * что аккаунт учителя откроет любой, кто знает, где он учился.
 */
export async function resetUserPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return { error: "Аккаунт не привязан к школе." };

  const userId = String(formData.get("userId") ?? "");
  const user = await db.user.findFirst({
    // Ограничение по школе обязательно: иначе администратор одной школы
    // сбрасывает пароль кому угодно во всей базе.
    where: { id: userId, schoolId: session.schoolId },
    select: { id: true, fullName: true, role: true },
  });
  if (!user) return { error: "Пользователь не найден в вашей школе." };

  if (user.id === session.userId) {
    return { error: "Свой пароль меняйте в настройках — там нужен текущий." };
  }

  const password = temporaryPassword();
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      passwordResetAt: null,
    },
  });

  revalidatePath("/admin");
  return { password, name: user.fullName };
}
