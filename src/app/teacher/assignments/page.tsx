import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { Empty, PageHeader, SectionHeader } from "@/components/ui";
import { AssignmentComposer } from "./composer";

export default async function AssignmentsPage() {
  const session = await requireRole("TEACHER");
  const { t, locale } = await getT();

  const [taught, assignments] = await Promise.all([
    db.teacherAssignment.findMany({
      where: { teacherId: session.userId },
      include: { subject: true, class: true },
    }),
    db.assignment.findMany({
      where: { authorId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        subject: true,
        class: true,
        submissions: { select: { status: true } },
      },
    }),
  ]);

  const subjects = [
    ...new Map(
      taught.map((item) => [
        item.subject.id,
        {
          id: item.subject.id,
          label: locale === "kk" ? item.subject.nameKk : item.subject.name,
        },
      ]),
    ).values(),
  ];

  const classes = [
    ...new Map(
      taught.map((item) => [
        item.class.id,
        { id: item.class.id, label: item.class.name },
      ]),
    ).values(),
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={t("nav.assignments")} subtitle={t("assign.aiHint")} />

      <section>
        <SectionHeader title={t("teacher.newAssignment")} />
        {subjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-10 text-center">
            <p className="font-medium">Сначала укажите, что вы преподаёте</p>
            <p className="muted mx-auto mt-1.5 max-w-sm">
              Отметьте предметы и классы — после этого можно создавать задания.
            </p>
            <Link href="/teacher/setup" className="btn-primary mt-5">
              Указать предметы и классы
            </Link>
          </div>
        ) : (
          <AssignmentComposer subjects={subjects} classes={classes} />
        )}
      </section>

      <section>
        <SectionHeader title={t("teacher.myAssignments")} />
        {assignments.length === 0 ? (
          <Empty text={t("common.empty")} />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-canvas)] text-left">
                <tr className="text-xs tracking-wide text-[var(--color-muted)] uppercase">
                  <th className="px-4 py-2.5 font-medium">{t("common.title")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("common.class")}</th>
                  <th className="px-4 py-2.5 font-medium">Сдано</th>
                  <th className="px-4 py-2.5 font-medium">Проверено</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const submitted = a.submissions.length;
                  const reviewed = a.submissions.filter(
                    (s) =>
                      s.status === "AI_REVIEWED" ||
                      s.status === "TEACHER_APPROVED",
                  ).length;

                  return (
                    <tr key={a.id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">{a.title}</p>
                        <p className="muted text-xs">
                          {a.subject.name} · {t(`assign.kind.${a.kind}`)}
                        </p>
                      </td>
                      <td className="px-4 py-3">{a.class.name}</td>
                      <td className="px-4 py-3">{submitted}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            reviewed < submitted
                              ? "text-[var(--color-accent)]"
                              : ""
                          }
                        >
                          {reviewed} {t("common.of")} {submitted}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/teacher/assignments/${a.id}`}
                          className="text-[var(--color-brand)] hover:underline"
                        >
                          {t("common.open")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
