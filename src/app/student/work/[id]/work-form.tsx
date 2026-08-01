"use client";

import { useState, useTransition } from "react";
import { submitWork } from "./actions";

type Task = { id: string; prompt: string; points: number };

export function WorkForm({
  assignmentId,
  tasks,
  initial,
  locked,
  labels,
}: {
  assignmentId: string;
  tasks: Task[];
  initial: Record<string, string>;
  locked: boolean;
  labels: { submit: string; submitted: string };
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [busy, start] = useTransition();
  const [done, setDone] = useState(locked);
  const [error, setError] = useState<string | null>(null);

  const filled = tasks.filter((task) => answers[task.id]?.trim()).length;

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <div key={task.id} className="card">
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-sm font-medium">
              {index + 1}. {task.prompt}
            </p>
            <span className="chip shrink-0 bg-[var(--color-canvas)] text-[var(--color-muted)]">
              {task.points} б.
            </span>
          </div>

          <textarea
            rows={4}
            className="input font-mono text-sm"
            placeholder="Запишите решение, а не только ответ — так проверка увидит, где именно ошибка"
            disabled={done}
            value={answers[task.id] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [task.id]: e.target.value }))
            }
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="muted text-sm">
          Заполнено {filled} из {tasks.length}
        </p>
        <button
          className="btn-primary"
          disabled={busy || done || filled === 0}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                await submitWork({ assignmentId, answers });
                setDone(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Не удалось сдать");
              }
            })
          }
        >
          {done ? labels.submitted : busy ? "Отправляю…" : labels.submit}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
