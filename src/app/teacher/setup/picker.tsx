"use client";

import { useState, useTransition } from "react";
import { saveTeaching } from "./actions";

type Item = { id: string; name: string };

function Toggle({
  item,
  checked,
  onToggle,
}: {
  item: Item;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`chip border transition-all duration-150 ${
        checked
          ? "border-[var(--color-brand)] bg-[var(--color-brand-tint)] text-[var(--color-brand)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-2)] hover:border-[var(--color-brand)]/40"
      }`}
    >
      {item.name}
    </button>
  );
}

export function TeachingPicker({
  subjects,
  classes,
  initialSubjectIds,
  initialClassIds,
}: {
  subjects: Item[];
  classes: Item[];
  initialSubjectIds: string[];
  initialClassIds: string[];
}) {
  const [subjectIds, setSubjectIds] = useState<string[]>(initialSubjectIds);
  const [classIds, setClassIds] = useState<string[]>(initialClassIds);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (
    list: string[],
    setList: (v: string[]) => void,
    id: string,
  ) =>
    setList(
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );

  const ready = subjectIds.length > 0 && classIds.length > 0;

  return (
    <div className="space-y-4">
      <div className="card animate-rise">
        <p className="label">Какие предметы вы ведёте</p>
        {subjects.length === 0 ? (
          <p className="muted text-sm">
            В школе ещё не добавлены предметы — попросите администратора
            завершить настройку.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Toggle
                key={s.id}
                item={s}
                checked={subjectIds.includes(s.id)}
                onToggle={() => toggle(subjectIds, setSubjectIds, s.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card animate-rise" style={{ animationDelay: "80ms" }}>
        <p className="label">В каких классах</p>
        {classes.length === 0 ? (
          <p className="muted text-sm">
            В школе ещё не добавлены классы — попросите администратора
            завершить настройку.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <Toggle
                key={c.id}
                item={c}
                checked={classIds.includes(c.id)}
                onToggle={() => toggle(classIds, setClassIds, c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="animate-pop rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="muted text-xs">
          {ready
            ? `Выбрано: ${subjectIds.length} предмет(ов) × ${classIds.length} класс(ов)`
            : "Отметьте предметы и классы"}
        </p>
        <button
          className="btn-primary"
          disabled={!ready || busy}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                await saveTeaching({ subjectIds, classIds });
              } catch (e) {
                if (
                  e &&
                  typeof e === "object" &&
                  "digest" in e &&
                  String((e as { digest?: string }).digest).startsWith(
                    "NEXT_REDIRECT",
                  )
                ) {
                  throw e;
                }
                setError(e instanceof Error ? e.message : "Не удалось сохранить");
              }
            })
          }
        >
          {busy ? "Сохраняю…" : "Сохранить и продолжить"}
        </button>
      </div>
    </div>
  );
}
