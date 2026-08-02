import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  exportFileName,
  isExportTarget,
  toCsv,
  type ExportRow,
} from "@/lib/journal";

export const runtime = "nodejs";

/**
 * Выгрузка оценок за работу в формате журнала.
 *
 * Отдельный route, а не server action: браузер должен получить файл, а не
 * перерисованную страницу. Формат приходит параметром — школа могла ничего не
 * выбрать в панели, и тогда учитель выбирает сам прямо на странице.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const target = new URL(request.url).searchParams.get("journal");
  if (!isExportTarget(target)) {
    return new Response("Неизвестный формат журнала", { status: 400 });
  }

  const assignment = await db.assignment.findUnique({
    where: { id },
    include: {
      subject: true,
      class: true,
      submissions: {
        orderBy: { student: { fullName: "asc" } },
        include: { student: { select: { fullName: true, email: true } } },
      },
    },
  });

  // Чужую работу выгрузить нельзя — оценки чужого класса не наше дело.
  if (!assignment || assignment.authorId !== session.userId) {
    return new Response("Работа не найдена", { status: 404 });
  }

  const KIND: Record<string, string> = {
    HOMEWORK: "Домашняя работа",
    QUIZ: "Тест",
    FORMATIVE: "Формативное оценивание",
    SUMMATIVE: "Суммативное оценивание",
  };

  // Черновики не выгружаем: ученик ещё не сдал, ставить в журнал нечего.
  const rows: ExportRow[] = assignment.submissions
    .filter((s) => s.status !== "DRAFT")
    .map((s) => ({
      studentName: s.student.fullName,
      studentEmail: s.student.email,
      className: assignment.class.name,
      subject: assignment.subject.name,
      assignment: assignment.title,
      kind: KIND[assignment.kind] ?? assignment.kind,
      score: s.teacherScore ?? s.aiScore,
      maxScore: assignment.maxScore,
      date: s.submittedAt ?? s.createdAt,
    }));

  const csv = toCsv(rows, target);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(
        target,
        assignment.title,
      )}"`,
      "Cache-Control": "no-store",
    },
  });
}
