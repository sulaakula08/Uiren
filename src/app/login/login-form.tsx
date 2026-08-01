"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}

export function LoginForm({
  labels,
}: {
  labels: { email: string; password: string; submit: string; error: string };
}) {
  const [state, action] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          {labels.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>

      {state.error && (
        <p className="animate-pop rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {labels.error}
        </p>
      )}

      <Submit label={labels.submit} />
    </form>
  );
}
