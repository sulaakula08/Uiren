"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type State = { ok?: string; error?: string };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary shrink-0" disabled={pending}>
      {pending ? "Связываю…" : label}
    </button>
  );
}

/**
 * Привязка второго участника семьи по почте. Одна форма на обе стороны:
 * родитель добавляет ребёнка, ученик — родителя, действие приходит снаружи.
 */
export function FamilyLinkForm({
  action,
  name,
  label,
  placeholder,
  hint,
  submitLabel,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  name: string;
  label: string;
  placeholder: string;
  hint: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<State, FormData>(action, {});

  return (
    <form action={formAction} className="card">
      <label className="label" htmlFor={name}>
        {label}
      </label>

      <div className="flex flex-wrap gap-2">
        <input
          id={name}
          name={name}
          type="email"
          required
          placeholder={placeholder}
          className="input min-w-48 flex-1"
        />
        <Submit label={submitLabel} />
      </div>

      <p className="muted mt-2 text-xs">{hint}</p>

      {(state.error || state.ok) && (
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
