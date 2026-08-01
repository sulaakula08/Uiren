"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

/**
 * Сдача работы. Система видит процесс, а не только итог —
 * это и замыкает петлю данных: чем больше сдач, тем глубже инсайт учителя.
 */
export async function submitWork(input: {
  assignmentId: string;
  answers: Record<string, string>;
}) {
  const session = await requireRole("STUDENT");

  const assignment = await db.assignment.findUnique({
    where: { id: input.assignmentId },
    select: { id: true, classId: true },
  });
  if (!assignment) throw new Error("Задание не найдено");

  const enrolled = await db.enrollment.findFirst({
    where: { studentId: session.userId, classId: assignment.classId },
  });
  if (!enrolled) throw new Error("Это задание не для вашего класса");

  const answersJson = JSON.stringify(input.answers);

  await db.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: session.userId,
      },
    },
    create: {
      assignmentId: assignment.id,
      studentId: session.userId,
      answersJson,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      answersJson,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  revalidatePath(`/student/work/${assignment.id}`);
  revalidatePath("/student");
}
