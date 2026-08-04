import { requireRole } from "@/lib/auth";
import { Empty, PageHeader } from "@/components/ui";
import {
  BUCKET_LABEL,
  BUCKET_SHARE,
  neededForMark,
  studentSubjectStats,
  type Bucket,
} from "@/lib/quarter";

const BUCKETS: Bucket[] = ["FO", "SOR", "SOCH"];

function markTone(mark: number) {
  if (mark === 5) return "var(--color-brand)";
  if (mark === 4) return "#2e9e6b";
  if (mark === 3) return "var(--color-warn)";
  return "var(--color-danger)";
}

export default async function StudentGradesPage() {
  const session = await requireRole("STUDENT");
  const subjects = await studentSubjectStats(session.userId);

  return (
    <div>
      <PageHeader
        title="Оценки"
        subtitle="Формативное 25%, СОР 25%, СОЧ 50% — как принято в казахстанской школе"
      />

      {subjects.length === 0 ? (
        <Empty text="Проверенных работ пока нет. Оценки появятся, когда учитель проверит первую работу." />
      ) : (
        <div className="space-y-5">
          {subjects.map((s) => {
            const target = s.quarterMark && s.quarterMark < 5 ? s.quarterMark + 1 : null;
            const need = target ? neededForMark(s, target) : null;

            return (
              <section key={s.subjectId} className="animate-rise card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="h2">{s.subject}</h2>
                    <p className="muted mt-1 text-xs">
                      {s.total} {s.total === 1 ? "работа" : "работ"} проверено
                      {s.averageMark !== null
                        ? ` · средний балл ${s.averageMark}`
                        : ""}
                    </p>
                  </div>

                  {s.quarterMark !== null && (
                    <div className="text-right">
                      <p
                        className="text-[34px] leading-none font-semibold tabular-nums"
                        style={{ color: markTone(s.quarterMark) }}
                      >
                        {s.quarterMark}
                      </p>
                      <p className="muted text-xs">
                        {s.quarterPercent}% за четверть
                      </p>
                    </div>
                  )}
                </div>

                {/* Три группы работ с их весами */}
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {BUCKETS.map((key) => {
                    const b = s.buckets[key];
                    const has = b.average !== null;
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-3"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-medium text-[var(--color-muted)]">
                            {BUCKET_SHARE[key]}
                          </span>
                          {has && (
                            <span className="text-sm font-semibold tabular-nums">
                              {Math.round(b.average!)}%
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs">{BUCKET_LABEL[key]}</p>
                        {!has ? (
                          <p className="muted mt-1.5 text-xs">Ещё не было</p>
                        ) : (
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line-2)]">
                            <div
                              className="bar-fill h-full rounded-full bg-[var(--color-brand)]"
                              style={{ width: `${Math.round(b.average!)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {s.missing.length > 0 && (
                  <p className="muted mt-4 text-xs">
                    Оценка предварительная: ещё не было{" "}
                    {s.missing.map((m) => BUCKET_LABEL[m]).join(", ").toLowerCase()}.
                  </p>
                )}

                {/* Что нужно, чтобы поднять оценку */}
                {need && target && (
                  <div className="mt-4 rounded-xl border border-[var(--color-brand)]/20 bg-[var(--color-brand-tint)]/50 p-3.5">
                    {need.reachable ? (
                      <p className="text-sm text-[var(--color-brand-dark)]">
                        Чтобы выйти на <strong>{target}</strong>, нужно написать
                        СОЧ минимум на <strong>{need.percent}%</strong>.
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--color-ink-2)]">
                        Оценку <strong>{target}</strong> в этой четверти уже не
                        получить: даже 100% за СОЧ не хватит. Соберите баллы на
                        формативном оценивании.
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
