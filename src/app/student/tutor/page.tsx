import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { TutorChat } from "./chat";

export default async function TutorPage() {
  const session = await requireRole("STUDENT");
  const { t } = await getT();

  // Продолжаем последний диалог: контекст ученика не должен теряться между входами.
  const last = await db.tutorSession.findFirst({
    where: { studentId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="h1">{t("nav.tutor")}</h1>
        <p className="muted mt-1">{t("student.tutorHint")}</p>
      </header>

      <TutorChat
        initialSessionId={last?.id ?? null}
        initialTurns={
          last?.messages.map((m) => ({
            role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
            content: m.content,
          })) ?? []
        }
      />
    </div>
  );
}
