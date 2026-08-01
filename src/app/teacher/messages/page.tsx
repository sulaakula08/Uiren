import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { Empty, PageHeader, SectionHeader } from "@/components/ui";
import { MessageComposer } from "./composer";

export default async function MessagesPage() {
  const session = await requireRole("TEACHER");
  const { t } = await getT();

  const taught = await db.teacherAssignment.findMany({
    where: { teacherId: session.userId },
    select: { classId: true },
  });
  const classIds = [...new Set(taught.map((x) => x.classId))];

  const [enrollments, sent] = await Promise.all([
    db.enrollment.findMany({
      where: { classId: { in: classIds } },
      include: {
        student: { include: { childLinks: { select: { id: true } } } },
      },
      orderBy: { student: { fullName: "asc" } },
    }),
    db.parentMessage.findMany({
      where: { authorId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { student: true, recipient: true },
    }),
  ]);

  const students = enrollments.map((e) => ({
    id: e.student.id,
    name: e.student.fullName,
    hasParent: e.student.childLinks.length > 0,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("nav.messages")}
        subtitle="Сообщения родителям учеников"
      />

      {students.length === 0 ? (
        <Empty text="В ваших классах пока нет зарегистрированных учеников. Они появятся здесь, когда войдут по коду школы." />
      ) : (
        <MessageComposer students={students} />
      )}

      <section>
        <SectionHeader title="Отправленные" />
        {sent.length === 0 ? (
          <Empty text={t("common.empty")} />
        ) : (
          <div className="space-y-3">
            {sent.map((m) => (
              <article key={m.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{m.subjectLine}</p>
                  <span className="muted text-xs">
                    {m.student.fullName} → {m.recipient.fullName}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{m.body}</p>
                <p className="muted mt-2 text-xs">
                  {m.sentAt?.toLocaleString("ru-RU") ?? "черновик"}
                  {m.aiGenerated ? " · черновик AI" : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
