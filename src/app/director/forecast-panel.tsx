"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { buildForecast, type ForecastState } from "./actions";

const CONFIDENCE: Record<string, { label: string; tone: string }> = {
  LOW: { label: "низкая уверенность", tone: "bg-red-50 text-red-800" },
  MEDIUM: { label: "средняя уверенность", tone: "bg-amber-50 text-amber-800" },
  HIGH: { label: "высокая уверенность", tone: "bg-[var(--color-brand-tint)] text-[var(--color-brand)]" },
};

const TREND: Record<string, string> = {
  UP: "↑ растёт",
  FLAT: "→ без изменений",
  DOWN: "↓ снижается",
};

function Trigger({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Считаю прогноз…" : label}
    </button>
  );
}

export function ForecastPanel({
  classes,
  labels,
}: {
  classes: { id: string; name: string }[];
  labels: { title: string; hint: string; action: string };
}) {
  const [state, action] = useActionState<ForecastState, FormData>(
    buildForecast,
    {},
  );
  const forecast = state.forecast;

  return (
    <div className="space-y-4">
      <form action={action} className="card space-y-4">
        <div>
          <h2 className="h2">{labels.title}</h2>
          <p className="muted mt-0.5">{labels.hint}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="label" htmlFor="forecast-class">
              Класс
            </label>
            <select id="forecast-class" name="classId" className="input">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Trigger label={labels.action} />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
            {state.error}
          </p>
        )}
      </form>

      {forecast && (
        <div className="card space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="label">Ожидаемый средний балл, {state.className}</p>
              <p className="text-5xl font-semibold tracking-tight text-[var(--color-brand)]">
                {forecast.predictedScore}
                <span className="muted text-xl font-normal"> / 140</span>
              </p>
            </div>
            <div className="flex gap-2 pb-2">
              <span
                className={`chip ${CONFIDENCE[forecast.confidence]?.tone ?? ""}`}
              >
                {CONFIDENCE[forecast.confidence]?.label ?? forecast.confidence}
              </span>
              <span className="chip bg-[var(--color-canvas)] text-[var(--color-muted)]">
                {TREND[forecast.trend] ?? forecast.trend}
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <section>
              <h3 className="label">Тянет вверх</h3>
              <ul className="space-y-1 text-sm">
                {forecast.drivers.map((d, i) => (
                  <li key={i}>• {d}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="label">Тянет вниз</h3>
              <ul className="space-y-1 text-sm">
                {forecast.risks.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="rounded-lg bg-[var(--color-canvas)] px-4 py-3">
            <p className="label">Что предпринять</p>
            <p className="text-sm leading-relaxed">{forecast.recommendation}</p>
          </div>

          <p className="muted text-xs">
            Оценка по текущей динамике, а не точное предсказание. Чем больше
            проверенных работ, тем она надёжнее.
          </p>
        </div>
      )}
    </div>
  );
}
