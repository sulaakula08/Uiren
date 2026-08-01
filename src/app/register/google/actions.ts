"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionCookie } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";
import { readPendingProfile } from "@/lib/google-pending";

export type GoogleRegisterState = { error?: string };

const schema = z.object({
  token: z.string().min(10),
  role: z.enum(["TEACHER", "STUDENT", "PARENT"]),
  joinCode: z.string().trim().toUpperCase().min(4, "Введите код школы"),
  classId: z.string().optional(),
  childEmail: z.string().trim().toLowerCase().optional(),
  locale: z.enum(["ru", "kk"]).default("ru"),
});

/** Завершение регистрации через Google: роль, школа и связи. */
export async function completeGoogleSignup(
  _prev: GoogleRegisterState,
  formData: FormData,
): Promise<GoogleRegisterState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    role: formData.get("role"),
    joinCode: formData.get("joinCode"),
    classId: formData.get("classId") || undefined,
    childEmail: formData.get("childEmail") || undefined,
    locale: formData.get("locale") ?? "ru",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const data = parsed.data;

  // Личность берём только из подписанного токена, никогда из формы.
  const profile = await readPendingProfile(data.token);
  if (!profile) {
    return {
      error: "Ссылка устарела. Вернитесь на страницу входа и нажмите кнопку Google ещё раз.",
    };
  }

  const school = await db.school.findUnique({
    where: { joinCode: data.joinCode },
  });
  if (!school) return { error: "Школа с таким кодом не найдена" };

  // Пока человек заполнял форму, аккаунт мог появиться другим путём.
  const existing = await db.user.findUnique({ where: { email: profile.email } });
  if (existing) {
    return {
      error: "Аккаунт с такой почтой уже существует. Войдите обычным способом.",
    };
  }

  let classId: string | null = null;
  if (data.role === "STUDENT") {
    if (!data.classId) return { error: "Выберите свой класс" };
    const klass = await db.classGroup.findFirst({
      where: { id: data.classId, schoolId: school.id },
    });
    if (!klass) return { error: "Класс не найден" };
    classId = klass.id;
  }

  let childId: string | null = null;
  if (data.role === "PARENT") {
    if (!data.childEmail) return { error: "Укажите почту аккаунта ребёнка" };
    const child = await db.user.findFirst({
      where: { email: data.childEmail, role: "STUDENT", schoolId: school.id },
    });
    if (!child) {
      return {
        error:
          "Ученик с такой почтой не найден в этой школе. Сначала ребёнок регистрируется сам.",
      };
    }
    childId = child.id;
  }

  const user = await db.user.create({
    data: {
      email: profile.email,
      fullName: profile.fullName,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      role: data.role,
      locale: data.locale,
      schoolId: school.id,
      // Пароля у такого аккаунта нет: вход только через Google. Значение
      // заведомо не является bcrypt-хешом, поэтому сравнение всегда ложно.
      passwordHash: "!google-only",
      ...(classId ? { enrollments: { create: { classId } } } : {}),
    },
  });

  if (childId) {
    await db.parentLink.create({
      data: { parentId: user.id, studentId: childId },
    });
  }

  await createSessionCookie({
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    schoolId: school.id,
    locale: user.locale,
  });

  redirect(HOME_BY_ROLE[user.role]);
}

/** Классы школы по коду — для выпадающего списка ученика. */
export async function lookupSchoolClasses(joinCode: string) {
  const code = joinCode.trim().toUpperCase();
  if (code.length < 4) return null;
  return db.school.findUnique({
    where: { joinCode: code },
    select: {
      name: true,
      city: true,
      classGroups: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
}
