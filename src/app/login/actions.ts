"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionCookie } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "auth.error" };

  const user = await db.user.findUnique({ where: { email } });
  // Сравниваем всегда, даже если пользователя нет: иначе время ответа
  // выдаёт, зарегистрирован ли адрес.
  const ok = await bcrypt.compare(
    password,
    user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv",
  );

  if (!user || !ok) return { error: "auth.error" };

  await createSessionCookie({
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    schoolId: user.schoolId,
    locale: user.locale,
  });

  redirect(HOME_BY_ROLE[user.role]);
}
