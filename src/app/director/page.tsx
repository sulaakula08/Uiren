import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import {
  errorMix,
  schoolHoursSaved,
  subjectMastery,
  weakConcepts,
} from "@/lib/analytics";
import { Bar, Empty, SectionHeader, Stat } from "@/components/ui";
import type { MessageKey } from "@/lib/i18n";
import { ForecastPanel } from "./forecast-panel";

export default async function DirectorDashboard() {
  const session = await requireRole("DIRECTOR");
  const { t, locale } = await getT();

  if (!session.schoolId) {
    return <Empty text="Аккаунт не привязан к школе." />;
  }

  const schoolId = session.schoolId;

  const [school, mastery, weak, mix, hours, teachers, classes, activeTeachers] =
    await Promise.all([
      db.school.findUnique({ where: { id: schoolId } }),
      subjectMastery(schoolId),
      weakConcepts(schoolId),
      errorMix({ schoolId }),
      schoolHoursSaved(schoolId),
      db.user.count({ where: { schoolId, role: "TEACHER" } }),
      db.classGroup.findMany({
        where: { schoolId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      db.aiLog.groupBy({
        by: ["userId"],
        where: {
          ok: true,
          user: { schoolId, role: "TEACHER" },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
        },
      }),
    ]);

  const withData = mastery.filter((m) => m.reviewed > 0);
  const schoolMastery =
    withData.length === 0
      ? 0
      : Math.round(
          withData.reduce((sum, m) => sum + m.mastery, 0) / withData.length,
        );

  const totalErrors = mix.reduce((sum, m) => sum + m.count, 0);
  const adoption =
    teachers === 0 ? 0 : Math.round((activeTeachers.length / teachers) * 100);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h1">{t("director.title")}</h1>
        <p className="muted mt-1.5">
          {school?.name}, {school?.city}
        </p>
      </header>

      <div
        data-tour="stats"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Stat
          label={t("director.schoolMastery")}
          value={`${schoolMastery}%`}
          hint="средневзвешенно по предметам"
          tone="brand"
        />
        <Stat
          label={t("teacher.hoursSaved")}
          value={hours}
          hint="всеми учителями за 30 дней"
          tone="brand"
        />
        <Stat
          label={t("director.aiAdoption")}
          value={`${adoption}%`}
          hint={`${activeTeachers.length} из ${teachers} учителей`}
          tone={adoption < 50 ? "warn" : "default"}
        />
        <Stat label="Классов в школе" value={classes.length} />
      </div>

      <section data-tour="subjects">
        <SectionHeader
          title={t("director.subject")}
          subtitle="Доля набранных баллов по проверенным работам"
        />
        {withData.length === 0 ? (
          <Empty text="Данные появятся, когда учителя проверят первые работы." />
        ) : (
          <div className="card space-y-4">
            {withData.map((m) => (
              <div key={m.subject.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {locale === "kk" ? m.subject.nameKk : m.subject.name}
                  </span>
                  <span className="muted text-xs">
                    {m.mastery}% · {m.reviewed} разборов
                  </span>
                </div>
                <Bar percent={m.mastery} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader
            title="Системно просевшие понятия"
            subtitle="То, что повторяется у разных учителей и классов"
          />
          {weak.length === 0 ? (
            <Empty text={t("common.empty")} />
          ) : (
            <div className="card">
              <ul className="space-y-2">
                {weak.map((w) => (
                  <li
                    key={w.concept}
                    className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                  >
                    <span className="font-medium">{w.concept}</span>
                    <span className="muted text-xs">{w.misses} ошибок</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <SectionHeader
            title={t("insight.errorMix")}
            subtitle="Структура ошибок по школе"
          />
          {totalErrors === 0 ? (
            <Empty text={t("common.empty")} />
          ) : (
            <div className="card space-y-3">
              {mix.map((m) => (
                <div key={m.nature}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{t(`nature.${m.nature}` as MessageKey)}</span>
                    <span className="muted text-xs">
                      {Math.round((m.count / totalErrors) * 100)}%
                    </span>
                  </div>
                  <Bar
                    percent={(m.count / totalErrors) * 100}
                    tone={
                      m.nature === "CORRECT"
                        ? "bg-[var(--color-brand)]"
                        : m.nature === "CONCEPT_GAP"
                          ? "bg-red-500"
                          : "bg-amber-400"
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section data-tour="forecast" className="border-t pt-8">
        <ForecastPanel
          classes={classes}
          labels={{
            title: t("director.entForecast"),
            hint: t("director.entHint"),
            action: "Построить прогноз",
          }}
        />
      </section>
    </div>
  );
}
