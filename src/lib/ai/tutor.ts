import "server-only";
import { db } from "@/lib/db";
import { MODEL_FAST, anthropic, logAi } from "./client";

/**
 * Контекст ученика — то, чего у общего чат-бота нет и не будет:
 * что проходили в его классе и где он лично ошибался в последних работах.
 */
export async function buildStudentContext(studentId: string): Promise<string> {
  const [enrollment, submissions] = await Promise.all([
    db.enrollment.findFirst({
      where: { studentId },
      include: { class: true },
    }),
    db.submission.findMany({
      where: { studentId, status: { in: ["AI_REVIEWED", "TEACHER_APPROVED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        findings: true,
        assignment: { include: { subject: true, topic: true } },
      },
    }),
  ]);

  const lessons = enrollment
    ? await db.lesson.findMany({
        where: { classId: enrollment.classId },
        orderBy: { date: "desc" },
        take: 5,
        include: { subject: true },
      })
    : [];

  const lines: string[] = [];

  if (enrollment) lines.push(`Класс: ${enrollment.class.name}`);

  if (lessons.length) {
    lines.push(
      "\nЧто проходили на последних уроках:",
      ...lessons.map((l) => `- ${l.subject.name}: ${l.title}`),
    );
  }

  const gaps = submissions.flatMap((s) =>
    s.findings
      .filter((f) => f.nature !== "CORRECT" && f.nature !== "NOT_ATTEMPTED")
      .map(
        (f) =>
          `- ${s.assignment.subject.name}, ${s.assignment.topic?.title ?? s.assignment.title}: ${f.concept ?? "—"} (${f.nature})`,
      ),
  );

  if (gaps.length) {
    lines.push("\nГде этот ученик ошибался в последних работах:", ...gaps.slice(0, 12));
  }

  if (submissions.length) {
    lines.push(
      "\nПоследние результаты:",
      ...submissions.map(
        (s) =>
          `- ${s.assignment.title}: ${s.teacherScore ?? s.aiScore ?? "—"} из ${s.assignment.maxScore}`,
      ),
    );
  }

  return lines.length ? lines.join("\n") : "Данных по ученику пока нет.";
}

const TUTOR_SYSTEM = `Ты — персональный тьютор ученика казахстанской школы внутри платформы Uiren.

Как ты работаешь:
- Не выдавай готовый ответ на домашнее задание. Веди к нему: задай наводящий
  вопрос, разбери похожий пример, попроси показать свой шаг.
- Опирайся на контекст ученика ниже. Если он уже ошибался в этом понятии —
  начни именно с него, а не с общего определения.
- Говори коротко и по делу: 2–5 абзацев максимум, без длинных вступлений.
- Если ученик прямо просит «просто дай ответ» — объясни, что так он не сдаст
  ЕНТ, и предложи разобрать за 2 минуты.
- Отвечай на языке, на котором к тебе обратились (русский или казахский).

Контекст программы: ГОСО РК, критериальное оценивание, подготовка к ЕНТ.`;

export type TutorTurn = { role: "user" | "assistant"; content: string };

/**
 * Стрим ответа тьютора. Возвращает ReadableStream с текстовыми чанками,
 * чтобы ученик видел ответ по мере генерации, а не ждал целиком.
 */
export async function streamTutorReply(input: {
  studentId: string;
  history: TutorTurn[];
  onComplete: (fullText: string) => Promise<void>;
}): Promise<ReadableStream<Uint8Array>> {
  const context = await buildStudentContext(input.studentId);
  const client = anthropic();

  const stream = client.messages.stream({
    model: MODEL_FAST,
    max_tokens: 4000,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: [
      { type: "text", text: TUTOR_SYSTEM, cache_control: { type: "ephemeral" } },
      { type: "text", text: `\n\n=== Контекст ученика ===\n${context}` },
    ],
    messages: input.history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();
        await logAi({
          userId: input.studentId,
          feature: "tutor",
          model: MODEL_FAST,
          inputTokens: final.usage.input_tokens,
          outputTokens: final.usage.output_tokens,
          minutesSaved: 0,
          ok: true,
        });
        await input.onComplete(full);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Неизвестная ошибка";
        controller.enqueue(encoder.encode(`\n\n[Ошибка: ${message}]`));
        await logAi({
          userId: input.studentId,
          feature: "tutor",
          model: MODEL_FAST,
          inputTokens: 0,
          outputTokens: 0,
          minutesSaved: 0,
          ok: false,
          error: message.slice(0, 500),
        });
      } finally {
        controller.close();
      }
    },
  });
}
