"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionCookie } from "@/lib/session";
import { generateJoinCode } from "@/lib/join-code";

export type RegisterState = { error?: string };

const account = {
  fullName: z.string().trim().min(2, "Укажите имя и фамилию"),
  email: z.string().trim().toLowerCase().email("Некорректная почта"),
  password: z.string().min(6, "Пароль от 6 символов"),
  locale: z.enum(["ru", "kk"]).default("ru"),
};

const schoolSchema = z.object({
  schoolName: z.string().trim().min(2, "Укажите название школы"),
  city: z.string().trim().min(2, "Укажите город"),
  ...account,
});

/** Регистрация школы: создаётся организация и её первый администратор. */
export async function registerSchool(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = schoolSchema.safeParse({
    schoolName: formData.get("schoolName"),
    city: formData.get("city"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale") ?? "ru",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const data = parsed.data;

  if (await db.user.findUnique({ where: { email: data.email } })) {
    return { error: "Аккаунт с такой почтой уже существует" };
  }

  const school = await db.school.create({
    data: {
      name: data.schoolName,
      city: data.city,
      joinCode: await generateJoinCode(),
    },
  });

  const user = await db.user.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      role: "ADMIN",
      locale: data.locale,
      passwordHash: await bcrypt.hash(data.password, 10),
      schoolId: school.id,
    },
  });

  await createSessionCookie({
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    schoolId: school.id,
    locale: user.locale,
  });

  redirect("/admin/setup");
}

const joinSchema = z.object({
  joinCode: z.string().trim().toUpperCase().min(4, "Введите код школы"),
  role: z.enum(["TEACHER", "STUDENT", "PARENT"]),
  classId: z.string().optional(),
  childEmail: z.string().trim().toLowerCase().optional(),
  ...account,
});

/** Присоединение к существующей школе по коду приглашения. */
export async function joinSchool(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = joinSchema.safeParse({
    joinCode: formData.get("joinCode"),
    role: formData.get("role"),
    classId: formData.get("classId") || undefined,
    childEmail: formData.get("childEmail") || undefined,
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale") ?? "ru",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const data = parsed.data;

  const school = await db.school.findUnique({
    where: { joinCode: data.joinCode },
  });
  if (!school) return { error: "Школа с таким кодом не найдена" };

  if (await db.user.findUnique({ where: { email: data.email } })) {
    return { error: "Аккаунт с такой почтой уже существует" };
  }

  // Ученик обязан попасть в класс, иначе он не увидит ни одного задания.
  let classId: string | null = null;
  if (data.role === "STUDENT") {
    if (!data.classId) return { error: "Выберите свой класс" };
    const klass = await db.classGroup.findFirst({
      where: { id: data.classId, schoolId: school.id },
    });
    if (!klass) return { error: "Класс не найден" };
    classId = klass.id;
  }

  // Родителя сразу связываем с ребёнком по его почте — иначе аккаунт пустой.
  let childId: string | null = null;
  if (data.role === "PARENT") {
    if (!data.childEmail) return { error: "Укажите почту аккаунта ребёнка" };
    const child = await db.user.findFirst({
      where: {
        email: data.childEmail,
        role: "STUDENT",
        schoolId: school.id,
      },
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
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      locale: data.locale,
      passwordHash: await bcrypt.hash(data.password, 10),
      schoolId: school.id,
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

  redirect(
    data.role === "TEACHER"
      ? "/teacher/setup"
      : data.role === "STUDENT"
        ? "/student"
        : "/parent",
  );
}

/** Классы школы для формы регистрации ученика — по коду, без авторизации. */
export async function lookupSchool(joinCode: string) {
  const code = joinCode.trim().toUpperCase();
  if (code.length < 4) return null;

  const school = await db.school.findUnique({
    where: { joinCode: code },
    select: {
      name: true,
      city: true,
      classGroups: {
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });

  return school;
}
