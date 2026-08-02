"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type SetupState = { error?: string };

function slugCode(name: string) {
  // Код предмета нужен только для уникальности внутри школы.
  const base = name
    .toUpperCase()
    .replace(/[^A-ZА-ЯЁ0-9]/gi, "")
    .slice(0, 8);
  return base || "SUBJ";
}

/**
 * Свободный код для предмета.
 *
 * Раньше при совпадении к коду приписывались три последние цифры времени.
 * Два быстрых нажатия подряд попадали в одну миллисекунду, код повторялся и
 * упирался в уникальный индекс — запрос падал, а на экране просто ничего не
 * происходило. Счётчик по занятым кодам такого исхода не даёт.
 */
async function freeCode(schoolId: string, name: string) {
  const base = slugCode(name);
  const taken = new Set(
    (
      await db.subject.findMany({ where: { schoolId }, select: { code: true } })
    ).map((s) => s.code),
  );

  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base.slice(0, 6)}${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base.slice(0, 4)}${Date.now().toString().slice(-4)}`;
}

export async function addSubject(input: {
  name: string;
  nameKk?: string;
}): Promise<SetupState> {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return { error: "Аккаунт не привязан к школе." };

  const name = input.name.trim();
  const nameKk = input.nameKk?.trim() || name;
  if (!name) return { error: "Введите название предмета." };

  // У классов такая проверка была с самого начала, у предметов — нет. Поэтому
  // повторное нажатие добавляло ещё одну «Математику», и список зарастал
  // копиями, которые потом приходилось убирать вручную.
  const exists = await db.subject.findFirst({
    where: {
      schoolId: session.schoolId,
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (exists) return { error: `«${name}» уже в списке.` };

  try {
    await db.subject.create({
      data: {
        schoolId: session.schoolId,
        name,
        nameKk,
        code: await freeCode(session.schoolId, name),
      },
    });
  } catch (error) {
    // Гонка двух одновременных нажатий: код заняли между проверкой и записью.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Не удалось добавить — попробуйте ещё раз." };
    }
    throw error;
  }

  revalidatePath("/admin/setup");
  return {};
}

export async function removeSubject(id: string) {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return;
  await db.subject.deleteMany({ where: { id, schoolId: session.schoolId } });
  revalidatePath("/admin/setup");
}

export async function addClass(input: {
  name: string;
  grade: number;
}): Promise<SetupState> {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return { error: "Аккаунт не привязан к школе." };

  const name = input.name.trim();
  const grade = Number(input.grade);
  if (!name) return { error: "Введите название класса." };
  if (!grade || grade < 1 || grade > 11) {
    return { error: "Параллель — число от 1 до 11." };
  }

  const exists = await db.classGroup.findFirst({
    where: {
      schoolId: session.schoolId,
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
  // Раньше действие в этом случае молча заканчивалось, и было не понять,
  // добавился класс или нет.
  if (exists) return { error: `Класс ${name} уже создан.` };

  try {
    await db.classGroup.create({
      data: { schoolId: session.schoolId, name, grade },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Не удалось добавить — попробуйте ещё раз." };
    }
    throw error;
  }

  revalidatePath("/admin/setup");
  return {};
}

export async function removeClass(id: string) {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return;
  await db.classGroup.deleteMany({ where: { id, schoolId: session.schoolId } });
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
