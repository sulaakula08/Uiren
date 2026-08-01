"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { draftLesson, saveLesson, type LessonState } from "./actions";

type Option = { id: string; label: string };

function Generate() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Составляю КСП…" : "Составить план через AI"}
    </button>
  );
}

export function LessonPlanner({
  subjects,
  classes,
}: {
  subjects: Option[];
  classes: Option[];
}) {
  const [state, action] = useActionState<LessonState, FormData>(
    draftLesson,
    {},
  );
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();

  const plan = state.plan;
  const totalMinutes = plan?.stages.reduce((sum, s) => sum + s.minutes, 0) ?? 0;

  return (
    <div className="space-y-5">
      <form action={action} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="lesson-subject">
              Предмет
            </label>
            <select id="lesson-subject" name="subjectId" className="input">
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lesson-class">
              Класс
            </label>
            <select id="lesson-class" name="classId" className="input">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lesson-minutes">
              Длительность, мин
            </label>
            <input
              id="lesson-minutes"
              name="minutes"
              type="number"
              min={20}
              max={90}
              defaultValue={45}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="lesson-topic">
            Тема урока
          </label>
          <input
            id="lesson-topic"
            name="topic"
            className="input"
            placeholder="Теорема Виета и её применение"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="lesson-notes">
            Пожелания (необязательно)
          </label>
          <textarea
            id="lesson-notes"
            name="notes"
            rows={2}
            className="input"
            placeholder="Класс уже прошёл дискриминант, нужна связь с ним"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="muted text-xs">
            Цели обучения, критерии успеха, хронометраж и дифференциация
          </p>
          <Generate />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
            {state.error}
          </p>
        )}
      </form>

      {plan && state.meta && (
        <article className="card space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="h2">{plan.title}</h3>
              <p className="muted mt-0.5 text-xs">
                {plan.stages.length} этапов · {totalMinutes} минут
              </p>
            </div>
            <button
              className="btn-primary"
              disabled={saving || saved}
              onClick={() =>
                startSaving(async () => {
                  await saveLesson({ ...state.meta!, plan });
                  setSaved(true);
                })
              }
            >
              {saved ? "Сохранено" : saving ? "Сохраняю…" : "Сохранить план"}
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <section>
              <h4 className="label">Цели обучения</h4>
              <ul className="space-y-1 text-sm">
                {plan.objectives.map((o, i) => (
                  <li key={i}>• {o}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="label">Критерии успеха</h4>
              <ul className="space-y-1 text-sm">
                {plan.successCriteria.map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </section>
          </div>

          <section>
            <h4 className="label">Ход урока</h4>
            <div className="space-y-3">
              {plan.stages.map((stage, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{stage.name}</p>
                    <span className="chip bg-[var(--color-canvas)] text-[var(--color-muted)]">
                      {stage.minutes} мин
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{stage.activity}</p>
                  <p className="muted mt-2 text-xs">
                    <span className="font-medium">Оценивание: </span>
                    {stage.assessment}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <section>
              <h4 className="label">Дифференциация</h4>
              <p className="text-sm">{plan.differentiation}</p>
            </section>
            <section>
              <h4 className="label">Ресурсы</h4>
              <ul className="space-y-1 text-sm">
                {plan.resources.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      )}
    </div>
  );
}
