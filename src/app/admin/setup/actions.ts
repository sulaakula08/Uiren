"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

function slugCode(name: string) {
  // Код предмета нужен только для уникальности внутри школы.
  const base = name
    .toUpperCase()
    .replace(/[^A-ZА-ЯЁ0-9]/gi, "")
    .slice(0, 8);
  return base || `SUBJ${Date.now().toString().slice(-4)}`;
}

export async function addSubject(formData: FormData) {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return;

  const name = String(formData.get("name") ?? "").trim();
  const nameKk = String(formData.get("nameKk") ?? "").trim() || name;
  if (!name) return;

  let code = slugCode(name);
  const clash = await db.subject.findFirst({
    where: { schoolId: session.schoolId, code },
  });
  if (clash) code = `${code}${Date.now().toString().slice(-3)}`;

  await db.subject.create({
    data: { schoolId: session.schoolId, name, nameKk, code },
  });

  revalidatePath("/admin/setup");
}

export async function removeSubject(formData: FormData) {
  const session = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  await db.subject.deleteMany({ where: { id, schoolId: session.schoolId! } });
  revalidatePath("/admin/setup");
}

export async function addClass(formData: FormData) {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return;

  const name = String(formData.get("name") ?? "").trim();
  const grade = Number(formData.get("grade") ?? 0);
  if (!name || !grade) return;

  const exists = await db.classGroup.findFirst({
    where: { schoolId: session.schoolId, name },
  });
  if (exists) return;

  await db.classGroup.create({
    data: { schoolId: session.schoolId, name, grade },
  });

  revalidatePath("/admin/setup");
}

export async function removeClass(formData: FormData) {
  const session = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  await db.classGroup.deleteMany({ where: { id, schoolId: session.schoolId! } });
  revalidatePath("/admin/setup");
}

/** Запоминаем шаг, чтобы администратор мог вернуться и продолжить. */
export async function saveStep(step: number) {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return;

  await db.school.update({
    where: { id: session.schoolId },
    data: { setupStep: Math.max(0, Math.min(step, 4)) },
  });
}

export async function finishSetup() {
  const session = await requireRole("ADMIN");
  if (session.schoolId) {
    await db.school.update({
      where: { id: session.schoolId },
      data: { setupStep: 4 },
    });
  }
  redirect("/admin");
}
