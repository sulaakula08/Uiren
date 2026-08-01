"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

/**
 * Учитель сам отмечает, что и где ведёт. Так школе не нужно ждать,
 * пока администратор распишет нагрузку на всех.
 */
export async function saveTeaching(input: {
  subjectIds: string[];
  classIds: string[];
}) {
  const session = await requireRole("TEACHER");
  if (!session.schoolId) throw new Error("Аккаунт не привязан к школе");

  const [subjects, classes] = await Promise.all([
    db.subject.findMany({
      where: { id: { in: input.subjectIds }, schoolId: session.schoolId },
      select: { id: true },
    }),
    db.classGroup.findMany({
      where: { id: { in: input.classIds }, schoolId: session.schoolId },
      select: { id: true },
    }),
  ]);

  if (subjects.length === 0 || classes.length === 0) {
    throw new Error("Выберите хотя бы один предмет и один класс");
  }

  // Пересобираем нагрузку целиком: экран показывает полную картину,
  // поэтому сохранение должно её и записывать.
  await db.teacherAssignment.deleteMany({ where: { teacherId: session.userId } });
  await db.teacherAssignment.createMany({
    data: subjects.flatMap((subject) =>
      classes.map((klass) => ({
        teacherId: session.userId,
        subjectId: subject.id,
        classId: klass.id,
      })),
    ),
  });

  revalidatePath("/teacher", "layout");
  redirect("/teacher");
}
