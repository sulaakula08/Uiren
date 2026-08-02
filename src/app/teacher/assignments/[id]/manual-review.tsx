"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/loading";
import { gradeManually } from "../actions";

type Task = { id: string; prompt: string; points: number };

/**
 * Ручная проверка. Раскрывается по кнопке, чтобы не загромождать список работ
 * тем, что нужно не всегда — но при этом видно ответы ученика, без них
 * оценивать невозможно.
 */
export function ManualReview({
  submissionId,
  tasks,
  answers,
  initialScores,
  initialComments,
}: {
  submissionId: string;
  tasks: Task[];
  answers: Record<string, string>;
  initialScores: Record<string, number>;
  initialComments: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [comments, setComments] =
    useState<Record<string, string>>(initialComments);
  const [feedback, setFeedback] = useState("");
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = tasks.reduce((sum, t) => sum + (scores[t.id] ?? 0), 0);
  const max = tasks.reduce((sum, t) => sum + t.points, 0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost mt-3 px-2.5 py-1 text-xs"
      >
        Проверить вручную
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">Ручная проверка</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[var(--color-muted)] hover:underline"
        >
          Свернуть
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((task, i) => (
          <div
            key={task.id}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
          >
            <p className="text-xs font-medium text-[var(--color-muted)]">
              Задание {i + 1} · максимум {task.points}
            </p>
            <p className="mt-1 text-sm">{task.prompt}</p>

            <p className="mt-2 text-xs font-medium text-[var(--color-muted)]">
              Ответ ученика
            </p>
            <p className="mt-1 rounded-md bg-[var(--color-canvas)] px-2.5 py-2 text-sm whitespace-pre-wrap">
              {answers[task.id]?.trim() || "— пусто —"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="text-xs" htmlFor={`score-${task.id}`}>
                Балл
              </label>
              <input
                id={`score-${task.id}`}
                type="number"
                min={0}
                max={task.points}
                value={scores[task.id] ?? 0}
                onChange={(e) =>
                  setScores({ ...scores, [task.id]: Number(e.target.value) })
                }
                className="input w-16 px-2 py-1 text-xs"
              />
              <input
                aria-label={`Комментарий к заданию ${i + 1}`}
                placeholder="Комментарий (необязательно)"
                value={comments[task.id] ?? ""}
                onChange={(e) =>
                  setComments({ ...comments, [task.id]: e.target.value })
                }
                className="input flex-1 px-2.5 py-1 text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="label" htmlFor={`fb-${submissionId}`}>
          Комментарий ученику ко всей работе
        </label>
        <textarea
          id={`fb-${submissionId}`}
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="input"
          placeholder="Что получилось, над чем поработать"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Итог: <span className="font-semibold">{total}</span> из {max}
        </p>
        <button
          type="button"
          className="btn-primary px-3 py-1.5 text-xs"
          disabled={busy}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                await gradeManually(submissionId, scores, comments, feedback);
                setOpen(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Не удалось сохранить");
              }
            })
          }
        >
          {busy ? (
            <>
              <Spinner className="size-3.5" />
              Сохраняю…
            </>
          ) : (
            "Сохранить оценку"
          )}
        </button>
      </div>

      {error && (
        <p className="animate-pop mt-2 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
