"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createSessionCookie } from "@/lib/session";
import { isLocale } from "@/lib/i18n";

export type SettingsState = { error?: string; ok?: string };

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Укажите имя и фамилию"),
  locale: z.enum(["ru", "kk"]),
});

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const user = await db.user.update({
    where: { id: session.userId },
    data: { fullName: parsed.data.fullName, locale: parsed.data.locale },
  });

  // В cookie лежит имя и язык — без обновления шапка покажет старые данные.
  await createSessionCookie({
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    schoolId: user.schoolId,
    locale: user.locale,
  });

  revalidatePath("/", "layout");
  return { ok: "Профиль сохранён" };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Введите текущий пароль"),
    next: z.string().min(6, "Новый пароль от 6 символов"),
    repeat: z.string(),
  })
  .refine((v) => v.next === v.repeat, {
    message: "Новый пароль и повтор не совпадают",
  })
  .refine((v) => v.next !== v.current, {
    message: "Новый пароль совпадает с текущим",
  });

export async function changePassword(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireUser();

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    repeat: formData.get("repeat"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Аккаунт не найден" };

  // Текущий пароль обязателен: иначе чужая открытая вкладка = смена пароля.
  const valid = await bcrypt.compare(parsed.data.current, user.passwordHash);
  if (!valid) return { error: "Текущий пароль неверен" };

  await db.user.update({
    where: { id: session.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.next, 10) },
  });

  return { ok: "Пароль изменён" };
}

/** Сброс отметки о пройденном туре — обучение запустится при следующем входе. */
export async function replayTour(): Promise<void> {
  const session = await requireUser();
  await db.user.update({
    where: { id: session.userId },
    data: { tourDoneAt: null },
  });
  revalidatePath("/", "layout");
}

export async function saveLocalePreference(locale: string) {
  const session = await requireUser();
  if (!isLocale(locale)) return;
  await db.user.update({
    where: { id: session.userId },
    data: { locale },
  });
}
