"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { buildClassInsight, type InsightState } from "../actions";

const ROOT_CAUSE: Record<
  string,
  { label: string; hint: string; tone: string }
> = {
  TEACHING: {
    label: "Проблема в подаче темы",
    hint: "Ошибки однотипны у большой доли класса — дело не в учениках.",
    tone: "bg-red-50 text-red-800",
  },
  PREREQUISITE: {
    label: "Пробел в предыдущем материале",
    hint: "Сыпется не на новой теме, а на базе прошлых классов.",
    tone: "bg-amber-50 text-amber-800",
  },
  INDIVIDUAL: {
    label: "Отдельные ученики",
    hint: "Класс в целом справился, нужна точечная работа.",
    tone: "bg-[var(--color-brand-tint)] text-[var(--color-brand)]",
  },
  MIXED: {
    label: "Смешанная причина",
    hint: "Есть и системная, и индивидуальная составляющая.",
    tone: "bg-slate-100 text-slate-700",
  },
};

function Trigger({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Анализирую класс…" : label}
    </button>
  );
}

export function InsightPanel({
  assignmentId,
  labels,
}: {
  assignmentId: string;
  labels: { generate: string; title: string; subtitle: string };
}) {
  const [state, action] = useActionState<InsightState, FormData>(
    buildClassInsight,
    {},
  );
  const insight = state.insight;

  return (
    <div className="space-y-5">
      <form
        action={action}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <h2 className="h2">{labels.title}</h2>
          <p className="muted mt-0.5">{labels.subtitle}</p>
        </div>
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <Trigger label={labels.generate} />
      </form>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      {insight && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`chip ${ROOT_CAUSE[insight.rootCause]?.tone ?? ""}`}
              >
                {ROOT_CAUSE[insight.rootCause]?.label ?? insight.rootCause}
              </span>
              <span className="muted text-xs">
                {ROOT_CAUSE[insight.rootCause]?.hint}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-4xl font-semibold tracking-tight">
                {insight.masteryPercent}%
              </p>
              <p className="muted">класса усвоили тему</p>
            </div>

            <p className="mt-4 text-sm leading-relaxed">{insight.diagnosis}</p>
          </div>

          {/* Раньше это были четыре отдельные карточки подряд: четыре рамки,
              четыре тени и ни одного акцента. Теперь одна карточка, а разделы
              внутри разделены линией. */}
          <div className="card divide-y divide-[var(--color-line)]">
            {insight.weakConcepts.length > 0 && (
              <div className="py-5 first:pt-0 last:pb-0">
                <h3 className="mb-3 text-sm font-semibold">
                  Просевшие понятия
                </h3>
                <ul className="space-y-2">
                  {insight.weakConcepts.map((c) => (
                    <li
                      key={c.concept}
                      className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                    >
                      <span className="font-medium">{c.concept}</span>
                      <span className="muted text-xs">
                        {c.affectedStudents} учеников · {c.dominantNature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insight.classActions.length > 0 && (
              <div className="py-5 first:pt-0 last:pb-0">
                <h3 className="mb-3 text-sm font-semibold">
                  Что сделать на следующем уроке
                </h3>
                <ol className="space-y-3">
                  {insight.classActions.map((a, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-brand-tint)] text-xs font-semibold text-[var(--color-brand)]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {a.title}{" "}
                          <span className="muted font-normal">
                            · {a.minutes} мин
                          </span>
                        </p>
                        <p className="muted mt-0.5 text-sm">{a.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {insight.atRisk.length > 0 && (
              <div className="py-5 first:pt-0 last:pb-0">
                <h3 className="mb-3 text-sm font-semibold">Требуют внимания</h3>
                <div className="space-y-3">
                  {insight.atRisk.map((s) => (
                    <div key={s.studentName} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{s.studentName}</p>
                      <p className="muted mt-0.5 text-sm">{s.reason}</p>
                      <p className="mt-2 rounded-md bg-[var(--color-canvas)] px-3 py-2 text-sm">
                        <span className="font-medium">
                          Персональное задание:{" "}
                        </span>
                        {s.personalTask}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
