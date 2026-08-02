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

/** Ошибка под формой: без неё неудачное действие выглядит как «ничего не произошло». */
function Problem({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="animate-pop mt-3 rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
      {text}
    </p>
  );
}

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

  /** Что именно сейчас отправляется — подсвечиваем нажатую кнопку, а не все. */
  const [pending, setPending] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // Поля контролируемые: после успешного добавления их надо очистить. Пока они
  // были обычными, текст оставался на месте, добавление выглядело несработавшим
  // — и предмет заводили повторно, по копии на каждое нажатие.
  const [subjectName, setSubjectName] = useState("");
  const [subjectNameKk, setSubjectNameKk] = useState("");
  const [className, setClassName] = useState("");
  const [classGrade, setClassGrade] = useState("");

  function go(next: number) {
    setStep(next);
    setProblem(null);
    start(() => saveStep(next));
  }

  /** Помечаем, что именно выполняется, и показываем ответ действия. */
  function run(key: string, action: () => Promise<{ error?: string } | void>) {
    setPending(key);
    setProblem(null);
    start(async () => {
      const result = await action();
      setPending(null);
      setProblem(result?.error ?? null);
    });
  }

  const canLeaveStep0 = subjects.length > 0;
  const canLeaveStep1 = classes.length > 0;

  const presetsLeft = SUBJECT_PRESETS.filter(
    ([name]) =>
      !subjects.some((s) => s.name.toLowerCase() === name.toLowerCase()),
  );

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

      <div className="animate-rise">
        <h2 className="h2">{STEPS[step].title}</h2>
        <p className="muted mt-1 mb-5">{STEPS[step].hint}</p>

        {step === 0 && (
          <div className="space-y-4">
            <div className="card">
              <p className="label">Добавить готовые</p>
              {presetsLeft.length === 0 ? (
                <p className="muted text-sm">
                  Все готовые предметы уже добавлены — ниже можно завести свой.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {presetsLeft.map(([name, nameKk]) => (
                    <button
                      key={name}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(`subject:${name}`, () => addSubject({ name, nameKk }))
                      }
                      className="chip border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50"
                    >
                      {pending === `subject:${name}` ? "…" : `+ ${name}`}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-4">
                <input
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="input min-w-40 flex-1"
                  placeholder="Свой предмет"
                />
                <input
                  value={subjectNameKk}
                  onChange={(e) => setSubjectNameKk(e.target.value)}
                  className="input min-w-40 flex-1"
                  placeholder="Название на казахском"
                />
                <button
                  type="button"
                  className="btn-ghost shrink-0"
                  disabled={busy || !subjectName.trim()}
                  onClick={() =>
                    run("subject:custom", async () => {
                      const result = await addSubject({
                        name: subjectName,
                        nameKk: subjectNameKk,
                      });
                      if (!result.error) {
                        setSubjectName("");
                        setSubjectNameKk("");
                      }
                      return result;
                    })
                  }
                >
                  {pending === "subject:custom" ? "Добавляю…" : "Добавить"}
                </button>
              </div>

              <Problem text={problem} />
            </div>

            <ItemList
              items={subjects}
              emptyText="Пока не добавлен ни один предмет"
              busy={busy}
              pending={pending}
              onRemove={(item) =>
                run(`remove:${item.id}`, () => removeSubject(item.id))
              }
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="card">
              <p className="label">Добавить готовые</p>
              <div className="space-y-2">
                {GRADES.map((grade) => {
                  const left = LETTERS.filter(
                    (letter) =>
                      !classes.some((c) => c.name === `${grade}${letter}`),
                  );
                  if (left.length === 0) return null;
                  return (
                    <div key={grade} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 text-sm font-medium text-[var(--color-muted)]">
                        {grade}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {left.map((letter) => {
                          const name = `${grade}${letter}`;
                          return (
                            <button
                              key={name}
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                run(`class:${name}`, () =>
                                  addClass({ name, grade }),
                                )
                              }
                              className="chip border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50"
                            >
                              {pending === `class:${name}` ? "…" : `+ ${name}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-4">
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="input min-w-40 flex-1"
                  placeholder="Свой класс, например 9Д"
                />
                <input
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  type="number"
                  min={1}
                  max={11}
                  className="input w-28"
                  placeholder="Параллель"
                />
                <button
                  type="button"
                  className="btn-ghost shrink-0"
                  disabled={busy || !className.trim() || !classGrade}
                  onClick={() =>
                    run("class:custom", async () => {
                      const result = await addClass({
                        name: className,
                        grade: Number(classGrade),
                      });
                      if (!result.error) {
                        setClassName("");
                        setClassGrade("");
                      }
                      return result;
                    })
                  }
                >
                  {pending === "class:custom" ? "Добавляю…" : "Добавить"}
                </button>
              </div>

              <Problem text={problem} />
            </div>

            <ItemList
              items={classes}
              emptyText="Пока не добавлен ни один класс"
              busy={busy}
              pending={pending}
              onRemove={(item) =>
                run(`remove:${item.id}`, () => removeClass(item.id))
              }
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
                  "Родители регистрируются по коду и указывают почту ребёнка — ученик подтверждает запрос у себя.",
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
            disabled={busy || (step === 0 ? !canLeaveStep0 : !canLeaveStep1)}
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
  busy,
  pending,
  onRemove,
}: {
  items: Item[];
  emptyText: string;
  busy: boolean;
  pending: string | null;
  onRemove: (item: Item) => void;
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
        <button
          key={item.id}
          type="button"
          title="Убрать"
          disabled={busy}
          onClick={() => onRemove(item)}
          className="chip animate-pop gap-1.5 bg-[var(--color-brand-tint)] px-3 py-1.5 text-[var(--color-brand)] transition-colors hover:bg-[var(--color-danger-tint)] hover:text-[var(--color-danger)] disabled:opacity-50"
        >
          {item.name}
          <span aria-hidden="true">
            {pending === `remove:${item.id}` ? "…" : "×"}
          </span>
        </button>
      ))}
    </div>
  );
}
