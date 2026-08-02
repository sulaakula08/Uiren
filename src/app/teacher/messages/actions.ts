"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { AiError } from "@/lib/ai/client";
import { draftParentMessage } from "@/lib/ai/tasks";

export type MessageState = {
  draft?: { subjectLine: string; body: string; studentId: string };
  error?: string;
};

export async function draftMessage(
  _prev: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const session = await requireRole("TEACHER");
  const locale = await getLocale();

  const studentId = String(formData.get("studentId") ?? "");
  const situation = String(formData.get("situation") ?? "").trim();
  const tone = String(formData.get("tone") ?? "neutral") as
    | "concern"
    | "praise"
    | "neutral";

  if (!studentId || !situation) {
    return { error: "Выберите ученика и опишите ситуацию." };
  }

  const student = await db.user.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Ученик не найден." };

  const teaching = await db.teacherAssignment.findFirst({
    where: { teacherId: session.userId },
    include: { subject: true },
  });

  try {
    const draft = await draftParentMessage({
      userId: session.userId,
      locale,
      teacherName: session.fullName,
      studentName: student.fullName,
      subject: teaching?.subject.name ?? "предмет",
      situation,
      tone,
    });
    return { draft: { ...draft, studentId } };
  } catch (error) {
    return {
      error: error instanceof AiError ? error.message : "AI-запрос не удался.",
    };
  }
}

/**
 * Отправка — явное действие учителя. AI пишет черновик,
 * решение отправить принимает человек.
 */
export async function sendMessage(input: {
  studentId: string;
  subjectLine: string;
  body: string;
}) {
  const session = await requireRole("TEACHER");

  // Только подтверждённая связь: неподтверждённая заявка не должна приводить
  // к тому, что сообщение об ученике уходит постороннему человеку.
  const link = await db.parentLink.findFirst({
    where: { studentId: input.studentId, status: "ACCEPTED" },
  });
  if (!link) {
    throw new Error(
      "К этому ученику не привязан подтверждённый родитель.",
    );
  }

  await db.parentMessage.create({
    data: {
      authorId: session.userId,
      recipientId: link.parentId,
      studentId: input.studentId,
      subjectLine: input.subjectLine,
      body: input.body,
      status: "SENT",
      aiGenerated: true,
      sentAt: new Date(),
    },
  });

  revalidatePath("/teacher/messages");
}
