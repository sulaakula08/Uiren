"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { JOURNALS, JOURNAL_LABELS } from "@/lib/journal";
import { setJournal, type AdminState } from "./actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ghost" disabled={pending}>
      {pending ? "Сохраняю…" : label}
    </button>
  );
}

/**
 * Выбор журнала.
 *
 * Раньше форма молча перезагружала страницу, и понять, сохранилось ли что-то,
 * было невозможно — со стороны это выглядело как неработающая кнопка.
 */
export function JournalForm({
  current,
  saveLabel,
}: {
  current: string;
  saveLabel: string;
}) {
  const [state, action] = useActionState<AdminState, FormData>(setJournal, {});

  return (
    <form action={action}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <select name="journal" defaultValue={current} className="input">
            {JOURNALS.map((value) => (
              <option key={value} value={value}>
                {JOURNAL_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <Submit label={saveLabel} />
      </div>

      <p className="muted mt-2 text-xs">
        От выбора зависит формат выгрузки оценок: на странице проверенной работы
        учитель скачивает файл сразу под этот журнал. Автоматического обмена нет
        — открытых API у журналов не существует, и пароль учителя от госсистемы
        платформа не спрашивает. Если журнал не выбран, учителю предлагаются все
        форматы на выбор.
      </p>

      {(state.ok || state.error) && (
        <p
          role="status"
          className={`animate-pop mt-3 rounded-xl px-3.5 py-2.5 text-sm ${
            state.error
              ? "bg-[var(--color-danger-tint)] text-[var(--color-danger)]"
              : "bg-[var(--color-brand-tint)] text-[var(--color-brand)]"
          }`}
        >
          {state.error ?? state.ok}
        </p>
      )}
    </form>
  );
}
