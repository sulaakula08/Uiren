"use client";

import { useState, useTransition } from "react";
import {
  addClass,
  addSubject,
  finishSetup,
  removeClass,
  removeSubject,
  saveStep,
} from "./actions";

type Item = { id: string; name: string };

const SUBJECT_PRESETS = [
  ["Математика", "Математика"],
  ["Алгебра", "Алгебра"],
  ["Геометрия", "Геометрия"],
  ["Физика", "Физика"],
  ["Химия", "Химия"],
  ["Биология", "Биология"],
  ["История Казахстана", "Қазақстан тарихы"],
  ["Казахский язык", "Қазақ тілі"],
  ["Русский язык", "Орыс тілі"],
  ["Английский язык", "Ағылшын тілі"],
  ["Информатика", "Информатика"],
  ["География", "География"],
];

const GRADES = [5, 6, 7, 8, 9, 10, 11];
const LETTERS = ["А", "Б", "В", "Г"];

const STEPS = [
  { title: "Предметы", hint: "Какие предметы преподают в школе" },
  { title: "Классы", hint: "Классы, которые учатся в этом году" },
  { title: "Приглашения", hint: "Как коллеги и семьи заведут аккаунты" },
];

export function SetupWizard({
  initialStep,
  subjects,
  classes,
  joinCode,
  schoolName,
}: {
  initialStep: number;
  subjects: Item[];
  classes: Item[];
  joinCode: string;
  schoolName: string;
}) {
  const [step, setStep] = useState(Math.min(initialStep, STEPS.length - 1));
  const [busy, start] = useTransition();
  const [copied, setCopied] = useState(false);

  function go(next: number) {
    setStep(next);
    start(() => saveStep(next));
  }

  const canLeaveStep0 = subjects.length > 0;
  const canLeaveStep1 = classes.length > 0;

  return (
    <div>
      {/* Прогресс: всегда видно, сколько осталось */}
      <ol className="mb-8 flex gap-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.title} className="flex-1">
              <button
                type="button"
                onClick={() => go(i)}
                className="w-full text-left"
              >
                <div
                  className={`h-1.5 rounded-full transition-colors duration-300 ${
                    done || active
                      ? "bg-[var(--color-brand)]"
                      : "bg-[var(--color-line)]"
                  }`}
                />
                <p
                  className={`mt-2 text-xs font-medium transition-colors ${
                    active
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {i + 1}. {s.title}
                </p>
              </button>
            </li>
          );
        })}
      </ol>

      <div key={step} className="animate-rise">
        <h2 className="h2">{STEPS[step].title}</h2>
        <p className="muted mt-1 mb-5">{STEPS[step].hint}</p>

        {step === 0 && (
          <div className="space-y-4">
            <div className="card">
              <p className="label">Добавить готовые</p>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_PRESETS.filter(
                  ([name]) => !subjects.some((s) => s.name === name),
                ).map(([name, nameKk]) => (
                  <form key={name} action={addSubject}>
                    <input type="hidden" name="name" value={name} />
                    <input type="hidden" name="nameKk" value={nameKk} />
                    <button
                      type="submit"
                      className="chip border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                    >
                      + {name}
                    </button>
                  </form>
                ))}
              </div>

              <form
                action={addSubject}
                className="mt-4 flex gap-2 border-t border-[var(--color-line)] pt-4"
              >
                <input
                  name="name"
                  className="input"
                  placeholder="Свой предмет"
                  required
                />
                <input
                  name="nameKk"
                  className="input"
                  placeholder="Название на казахском"
                />
                <button type="submit" className="btn-ghost shrink-0">
                  Добавить
                </button>
              </form>
            </div>

            <ItemList
              items={subjects}
              emptyText="Пока не добавлен ни один предмет"
              onRemove={removeSubject}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="card">
              <p className="label">Добавить готовые</p>
              <div className="space-y-2">
                {GRADES.map((grade) => (
                  <div key={grade} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-sm font-medium text-[var(--color-muted)]">
                      {grade}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {LETTERS.map((letter) => {
                        const name = `${grade}${letter}`;
                        if (classes.some((c) => c.name === name)) return null;
                        return (
                          <form key={name} action={addClass}>
                            <input type="hidden" name="name" value={name} />
                            <input
                              type="hidden"
                              name="grade"
                              value={String(grade)}
                            />
                            <button
                              type="submit"
                              className="chip border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                            >
                              + {name}
                            </button>
                          </form>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <form
                action={addClass}
                className="mt-4 flex gap-2 border-t border-[var(--color-line)] pt-4"
              >
                <input
                  name="name"
                  className="input"
                  placeholder="Свой класс, например 9Д"
                  required
                />
                <input
                  name="grade"
                  type="number"
                  min={1}
                  max={11}
                  className="input w-28"
                  placeholder="Параллель"
                  required
                />
                <button type="submit" className="btn-ghost shrink-0">
                  Добавить
                </button>
              </form>
            </div>

            <ItemList
              items={classes}
              emptyText="Пока не добавлен ни один класс"
              onRemove={removeClass}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="card text-center">
              <p className="label">Код школы {schoolName}</p>
              <p className="font-mono text-4xl font-semibold tracking-[0.25em] text-[var(--color-brand)]">
                {joinCode}
              </p>
              <button
                type="button"
                className="btn-ghost mt-4"
                onClick={() => {
                  navigator.clipboard?.writeText(joinCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
              >
                {copied ? "Скопировано" : "Скопировать код"}
              </button>
            </div>

            <div className="card">
              <p className="mb-3 text-sm font-medium">Что делать дальше</p>
              <ol className="space-y-3 text-sm">
                {[
                  "Раздайте код учителям — они регистрируются сами и выбирают, какие предметы и классы ведут.",
                  "Ученики регистрируются по тому же коду и выбирают свой класс из списка.",
                  "Родители регистрируются после ребёнка и указывают его почту, чтобы связать аккаунты.",
                ].map((text, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-brand-tint)] text-xs font-semibold text-[var(--color-brand)]">
                      {i + 1}
                    </span>
                    <span className="text-[var(--color-ink-2)]">{text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => go(step - 1)}
          disabled={step === 0 || busy}
        >
          Назад
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => go(step + 1)}
            disabled={
              busy || (step === 0 ? !canLeaveStep0 : !canLeaveStep1)
            }
          >
            Далее
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => start(() => finishSetup())}
          >
            Перейти в панель школы
          </button>
        )}
      </div>

      {step === 0 && !canLeaveStep0 && (
        <p className="muted mt-3 text-right text-xs">
          Добавьте хотя бы один предмет, чтобы продолжить
        </p>
      )}
      {step === 1 && !canLeaveStep1 && (
        <p className="muted mt-3 text-right text-xs">
          Добавьте хотя бы один класс, чтобы продолжить
        </p>
      )}
    </div>
  );
}

function ItemList({
  items,
  emptyText,
  onRemove,
}: {
  items: Item[];
  emptyText: string;
  onRemove: (formData: FormData) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-center text-sm text-[var(--color-muted)]">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <form key={item.id} action={onRemove} className="animate-pop">
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            title="Убрать"
            className="chip gap-1.5 bg-[var(--color-brand-tint)] text-[var(--color-brand)] transition-colors hover:bg-[var(--color-danger-tint)] hover:text-[var(--color-danger)]"
          >
            {item.name}
            <span aria-hidden="true">×</span>
          </button>
        </form>
      ))}
    </div>
  );
}
