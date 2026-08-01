import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AiError } from "@/lib/ai/client";
import { streamTutorReply, type TutorTurn } from "@/lib/ai/tutor";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return new Response("Требуется вход как ученик", { status: 401 });
  }

  let payload: { sessionId?: string; message?: string };
  try {
    payload = await request.json();
  } catch {
    return new Response("Некорректный запрос", { status: 400 });
  }

  const message = payload.message?.trim();
  if (!message) return new Response("Пустое сообщение", { status: 400 });

  // Сессия диалога принадлежит ученику — чужую подсунуть нельзя.
  let tutorSession = payload.sessionId
    ? await db.tutorSession.findFirst({
        where: { id: payload.sessionId, studentId: session.userId },
      })
    : null;

  if (!tutorSession) {
    tutorSession = await db.tutorSession.create({
      data: {
        studentId: session.userId,
        title: message.slice(0, 60),
      },
    });
  }

  await db.tutorMessage.create({
    data: { sessionId: tutorSession.id, role: "user", content: message },
  });

  const stored = await db.tutorMessage.findMany({
    where: { sessionId: tutorSession.id },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  const history: TutorTurn[] = stored.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  try {
    const stream = await streamTutorReply({
      studentId: session.userId,
      history,
      onComplete: async (fullText) => {
        if (!fullText.trim()) return;
        await db.tutorMessage.create({
          data: {
            sessionId: tutorSession.id,
            role: "assistant",
            content: fullText,
          },
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Tutor-Session": tutorSession.id,
      },
    });
  } catch (error) {
    const message =
      error instanceof AiError ? error.message : "AI-запрос не удался";
    return new Response(message, { status: 500 });
  }
}
