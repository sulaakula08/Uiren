"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { AiError } from "@/lib/ai/client";
import { generateLessonPlan, type LessonPlan } from "@/lib/ai/tasks";

export type LessonState = {
  plan?: LessonPlan;
  meta?: { subjectId: string; classId: string };
  error?: string;
  saved?: boolean;
};

export async function draftLesson(
  _prev: LessonState,
  formData: FormData,
): Promise<LessonState> {
  const session = await requireRole("TEACHER");
  const locale = await getLocale();

  const subjectId = String(formData.get("subjectId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const minutes = Number(formData.get("minutes") ?? 45);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!subjectId || !classId || !topic) {
    return { error: "Заполните предмет, класс и тему урока." };
  }

  const [subject, klass] = await Promise.all([
    db.subject.findUnique({ where: { id: subjectId } }),
    db.classGroup.findUnique({ where: { id: classId } }),
  ]);
  if (!subject || !klass) return { error: "Предмет или класс не найден." };

  try {
    const plan = await generateLessonPlan({
      userId: session.userId,
      locale,
      subject: subject.name,
      grade: klass.grade,
      topic,
      minutes: Math.min(Math.max(minutes, 20), 90),
      notes: notes || undefined,
    });
    return { plan, meta: { subjectId, classId } };
  } catch (error) {
    return {
      error: error instanceof AiError ? error.message : "AI-запрос не удался.",
    };
  }
}

export async function saveLesson(input: {
  subjectId: string;
  classId: string;
  plan: LessonPlan;
}) {
  const session = await requireRole("TEACHER");

  await db.lesson.create({
    data: {
      authorId: session.userId,
      subjectId: input.subjectId,
      classId: input.classId,
      title: input.plan.title,
      planJson: JSON.stringify(input.plan),
      aiGenerated: true,
    },
  });

  revalidatePath("/teacher/lessons");
}
