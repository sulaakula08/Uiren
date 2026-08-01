import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { studentGaps } from "@/lib/analytics";
import { Empty, PageHeader, SectionHeader } from "@/components/ui";
import type { MessageKey } from "@/lib/i18n";

export default async function ParentPage() {
  const session = await requireRole("PARENT");
  const { t } = await getT();

  const links = await db.parentLink.findMany({
    where: { parentId: session.userId },
    include: {
      student: {
        include: {
          enrollments: { include: { class: true } },
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 6,
            include: { assignment: { include: { subject: true } } },
          },
        },
      },
    },
  });

  const messages = await db.parentMessage.findMany({
    where: { recipientId: session.userId, status: "SENT" },
    orderBy: { sentAt: "desc" },
    take: 10,
    include: { author: true, student: true },
  });

  if (links.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="h1">{t("parent.title")}</h1>
        <Empty text={t("parent.noChildren")} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("parent.title")}
        subtitle="Оценки, пробелы и сообщения от учителей"
      />

      <div data-tour="children" className="space-y-8">
      {await Promise.all(
        links.map(async (link) => {
          const student = link.student;
          const gaps = await studentGaps(student.id);
          const graded = student.submissions.filter(
            (s) => s.teacherScore !== null || s.aiScore !== null,
          );
          const average =
            graded.length === 0
              ? null
              : Math.round(
                  graded.reduce(
                    (sum, s) =>
                      sum +
                      ((s.teacherScore ?? s.aiScore ?? 0) /
                        s.assignment.maxScore) *
                        100,
                    0,
                  ) / graded.length,
                );

          return (
            <section key={link.id} className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="h2">{student.fullName}</h2>
                <p className="muted text-sm">
                  {student.enrollments[0]?.class.name ?? "класс не назначен"}
                  {average !== null ? ` · средний результат ${average}%` : ""}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="card">
                  <p className="label mb-3">{t("parent.recent")}</p>
                  {student.submissions.length === 0 ? (
                    <p className="muted text-sm">{t("common.empty")}</p>
                  ) : (
                    <ul className="space-y-2">
                      {student.submissions.map((s) => {
                        const score = s.teacherScore ?? s.aiScore;
                        return (
                          <li
                            key={s.id}
                            className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {s.assignment.title}
                              </p>
                              <p className="muted text-xs">
                                {s.assignment.subject.name} ·{" "}
                                {t(`sub.status.${s.status}` as MessageKey)}
                              </p>
                            </div>
                            <span className="ml-3 shrink-0 font-semibold">
                              {score !== null && score !== undefined
                                ? `${score}/${s.assignment.maxScore}`
                                : "—"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="card">
                  <p className="label mb-3">Над чем стоит поработать</p>
                  {gaps.length === 0 ? (
                    <p className="muted text-sm">
                      Системных пробелов не выявлено.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {gaps.slice(0, 6).map((gap) => (
                        <li
                          key={gap.concept}
                          className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                        >
                          <span>{gap.concept}</span>
                          <span className="muted text-xs">
                            {t(`nature.${gap.nature}` as MessageKey)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          );
        }),
      )}
      </div>

      <section data-tour="messages">
        <SectionHeader title={t("parent.fromTeacher")} />
        {messages.length === 0 ? (
          <Empty text="Сообщений пока нет. Учителя пишут сюда, когда есть что сказать." />
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <article key={m.id} className="card">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{m.subjectLine}</p>
                  <span className="muted text-xs">
                    {m.author.fullName} ·{" "}
                    {m.sentAt?.toLocaleDateString("ru-RU") ?? ""}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{m.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
