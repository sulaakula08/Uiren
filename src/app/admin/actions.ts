"use server";

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
export async function setJournal(formData: FormData) {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return;

  const journal = String(formData.get("journal") ?? "NONE");
  if (!["KUNDELIK", "BILIMCLASS", "EDUMARK", "NONE"].includes(journal)) return;

  await db.school.update({
    where: { id: session.schoolId },
    data: { journal },
  });

  revalidatePath("/admin");
}
