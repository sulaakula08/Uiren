"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  createAssignment,
  draftAssignment,
  type DraftState,
  type TaskDraft,
} from "./actions";

type Option = { id: string; label: string };

const KINDS = [
  ["HOMEWORK", "Домашняя работа"],
  ["QUIZ", "Тест"],
  ["FORMATIVE", "Формативное оценивание"],
  ["SUMMATIVE", "Суммативное оценивание"],
] as const;

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Генерирую…" : "Сгенерировать через AI"}
    </button>
  );
}

export function AssignmentComposer({
  subjects,
  classes,
}: {
  subjects: Option[];
  classes: Option[];
}) {
  const [state, action] = useActionState<DraftState, FormData>(
    draftAssignment,
    {},
  );
  const [saving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [kind, setKind] = useState<string>("HOMEWORK");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([]);

  // Черновик от модели становится редактируемой формой, а не готовым решением:
  // последнее слово за учителем.
  useEffect(() => {
    if (!state.draft) return;
    setTitle(state.draft.title);
    setDescription(state.draft.description);
    setTasks(state.draft.tasks);
  }, [state.draft]);

  const total = tasks.reduce((sum, task) => sum + (task.points || 0), 0);

  function patchTask(index: number, patch: Partial<TaskDraft>) {
    setTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, ...patch } : task)),
    );
  }

  function save() {
    setSaveError(null);
    startSaving(async () => {
      try {
        await createAssignment({
          subjectId,
          classId,
          kind,
          title,
          description,
          aiGenerated: Boolean(state.draft),
          tasks: tasks.map((task) => ({
            prompt: task.prompt,
            expected: task.expected,
            points: Number(task.points) || 1,
          })),
        });
      } catch (error) {
        // redirect() внутри server action бросает управляющее исключение —
        // его пробрасываем дальше, а не показываем как ошибку.
        if (
          error &&
          typeof error === "object" &&
          "digest" in error &&
          String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw error;
        }
        setSaveError(
          error instanceof Error ? error.message : "Не удалось сохранить",
        );
      }
    });
  }

  return (
    <div className="space-y-5">
      <form action={action} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="subjectId">
              Предмет
            </label>
            <select
              id="subjectId"
              name="subjectId"
              className="input"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="classId">
              Класс
            </label>
            <select
              id="classId"
              name="classId"
              className="input"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="kind">
              Тип работы
            </label>
            <select
              id="kind"
              name="kind"
              className="input"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {KINDS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="count">
              Количество заданий
            </label>
            <input
              id="count"
              name="count"
              type="number"
              min={1}
              max={10}
              defaultValue={4}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="topic">
            Тема
          </label>
          <input
            id="topic"
            name="topic"
            className="input"
            placeholder="Квадратные уравнения: дискриминант"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Пожелания (необязательно)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="input"
            placeholder="Класс слабый, нужно больше заданий на воспроизведение"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="muted text-xs">
            Черновик можно отредактировать перед сохранением
          </p>
          <GenerateButton />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
            {state.error}
          </p>
        )}
      </form>

      {tasks.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="h2">Черновик</h3>
            <span className="chip bg-[var(--color-canvas)] text-[var(--color-muted)]">
              Всего баллов: {total}
            </span>
          </div>

          <div>
            <label className="label" htmlFor="title">
              Название
            </label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="description">
              Описание для учеников
            </label>
            <textarea
              id="description"
              rows={2}
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted)]">
                    Задание {index + 1}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-[var(--color-danger)] hover:underline"
                    onClick={() =>
                      setTasks((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    Удалить
                  </button>
                </div>

                <textarea
                  rows={2}
                  className="input mb-2"
                  value={task.prompt}
                  placeholder="Условие"
                  onChange={(e) => patchTask(index, { prompt: e.target.value })}
                />
                <textarea
                  rows={2}
                  className="input mb-2"
                  value={task.expected}
                  placeholder="Ожидаемый ответ и критерий"
                  onChange={(e) =>
                    patchTask(index, { expected: e.target.value })
                  }
                />
                <div className="flex items-center gap-2">
                  <span className="muted text-xs">Баллы</span>
                  <input
                    type="number"
                    min={1}
                    className="input w-20"
                    value={task.points}
                    onChange={(e) =>
                      patchTask(index, { points: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                setTasks((prev) => [
                  ...prev,
                  { prompt: "", expected: "", points: 2 },
                ])
              }
            >
              Добавить задание
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={save}
              disabled={saving || !title || tasks.length === 0}
            >
              {saving ? "Сохраняю…" : "Сохранить и выдать классу"}
            </button>
          </div>

          {saveError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              {saveError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
