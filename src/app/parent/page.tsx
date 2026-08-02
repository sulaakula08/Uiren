import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { studentGaps } from "@/lib/analytics";
import { Empty, PageHeader, SectionHeader, Stat } from "@/components/ui";
import { FamilyLinkForm } from "@/components/family-link-form";
import type { MessageKey } from "@/lib/i18n";
import { acceptChild, linkChild, unlinkChild } from "./actions";

const LINK_LABELS = {
  label: "Почта аккаунта ребёнка",
  placeholder: "ученик@school.kz",
  hint: "Ребёнок должен быть зарегистрирован в этой школе и подтвердить запрос у себя. Детей можно добавить сколько угодно.",
  submitLabel: "Добавить",
};

export default async function ParentPage() {
  const session = await requireRole("PARENT");
  const { t } = await getT();

  const allLinks = await db.parentLink.findMany({
    where: { parentId: session.userId },
    orderBy: { student: { fullName: "asc" } },
    include: {
      student: {
        include: { enrollments: { include: { class: true } } },
      },
    },
  });

  // Успеваемость показываем только по подтверждённым связям. Заявка сама по
  // себе не открывает ничего — иначе проверка второй стороны была бы фикцией.
  const links = allLinks.filter((l) => l.status === "ACCEPTED");
  const incoming = allLinks.filter(
    (l) => l.status === "PENDING" && l.requestedById !== session.userId,
  );
  const outgoing = allLinks.filter(
    (l) => l.status === "PENDING" && l.requestedById === session.userId,
  );

  const messages = await db.parentMessage.findMany({
    where: { recipientId: session.userId, status: "SENT" },
    orderBy: { sentAt: "desc" },
    take: 10,
    include: { author: true, student: true },
  });

  // Успеваемость считаем по всем проверенным работам, а не по последним шести:
  // иначе «средний результат» скакал от того, что ребёнок сдал на этой неделе.
  // Черновики сюда не попадают — родителю показываем только сданное.
  const children = await Promise.all(
    links.map(async (link) => {
      const [submissions, gaps] = await Promise.all([
        db.submission.findMany({
          where: { studentId: link.studentId, status: { not: "DRAFT" } },
          orderBy: [
            { submittedAt: { sort: "desc", nulls: "last" } },
            { createdAt: "desc" },
          ],
          include: { assignment: { include: { subject: true } } },
        }),
        studentGaps(link.studentId),
      ]);

      const graded = submissions.filter(
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
                    Math.max(1, s.assignment.maxScore)) *
                    100,
                0,
              ) / graded.length,
            );

      return {
        link,
        student: link.student,
        recent: submissions.slice(0, 6),
        submittedCount: submissions.length,
        awaiting: submissions.filter((s) => s.status === "SUBMITTED").length,
        average,
        gaps,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("parent.title")}
        subtitle="Оценки, пробелы и сообщения от учителей"
      />

      {incoming.length > 0 && (
        <section>
          <SectionHeader
            title="Запросы на связь"
            subtitle="Ученик указал вашу почту — подтвердите, если это ваш ребёнок"
          />
          <div className="space-y-2">
            {incoming.map((link) => (
              <div
                key={link.id}
                className="card flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {link.student.fullName}
                  </p>
                  <p className="muted text-xs">{link.student.email}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={acceptChild}>
                    <input type="hidden" name="linkId" value={link.id} />
                    <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
                      Подтвердить
                    </button>
                  </form>
                  <form action={unlinkChild}>
                    <input type="hidden" name="linkId" value={link.id} />
                    <button type="submit" className="btn-danger px-3 py-1.5 text-xs">
                      Отклонить
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <SectionHeader
            title="Ожидают подтверждения"
            subtitle="Пока ребёнок не подтвердит запрос, оценки не открываются"
          />
          <div className="space-y-2">
            {outgoing.map((link) => (
              <div
                key={link.id}
                className="card flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {link.student.fullName}
                  </p>
                  <p className="muted text-xs">{link.student.email}</p>
                </div>
                <form action={unlinkChild} className="shrink-0">
                  <input type="hidden" name="linkId" value={link.id} />
                  <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
                    Отозвать
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {children.length === 0 ? (
        <div className="space-y-4">
          <Empty
            text={
              outgoing.length > 0
                ? "Запрос отправлен — успеваемость появится здесь, как только ребёнок его подтвердит."
                : t("parent.noChildren")
            }
          />
          <FamilyLinkForm
            action={linkChild}
            name="childEmail"
            {...LINK_LABELS}
          />
        </div>
      ) : (
        <>
          <div data-tour="children" className="space-y-10">
            {children.map((child) => {
              const { student, recent, gaps, average } = child;
              const classes = student.enrollments
                .map((e) => e.class.name)
                .join(", ");

              return (
                <section key={child.link.id} className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="h2">{student.fullName}</h2>
                      <p className="muted mt-0.5 text-sm">
                        {classes || "класс не назначен"} · {student.email}
                      </p>
                    </div>
                    <form action={unlinkChild}>
                      <input
                        type="hidden"
                        name="linkId"
                        value={child.link.id}
                      />
                      <button
                        type="submit"
                        className="btn-danger px-3 py-1.5 text-xs"
                      >
                        Отвязать
                      </button>
                    </form>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Stat
                      label="Средний результат"
                      value={average === null ? "—" : `${average}%`}
                      hint={
                        average === null
                          ? "работы ещё не проверены"
                          : "по всем проверенным работам"
                      }
                      tone="brand"
                    />
                    <Stat
                      label="Сдано работ"
                      value={child.submittedCount}
                      hint={
                        child.awaiting > 0
                          ? `${child.awaiting} ждёт проверки`
                          : "все проверены"
                      }
                      tone={child.awaiting > 0 ? "warn" : "default"}
                      delay={70}
                    />
                    <Stat
                      label="Тем с пробелами"
                      value={gaps.length}
                      delay={140}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="card">
                      <p className="label mb-3">{t("parent.recent")}</p>
                      {recent.length === 0 ? (
                        <p className="muted text-sm">
                          Ребёнок ещё не сдал ни одной работы.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {recent.map((s) => {
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
                              <span className="min-w-0 truncate">
                                {gap.concept}
                              </span>
                              <span className="muted ml-3 shrink-0 text-xs">
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
            })}
          </div>

          <section>
            <SectionHeader
              title="Ещё один ребёнок"
              subtitle="Если в школе учится второй ребёнок, добавьте его сюда"
            />
            <FamilyLinkForm
              action={linkChild}
              name="childEmail"
              {...LINK_LABELS}
            />
          </section>
        </>
      )}

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
                    {m.author.fullName} · про {m.student.fullName} ·{" "}
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
