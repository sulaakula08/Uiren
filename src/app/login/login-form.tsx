"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PasswordInput } from "@/components/password-input";
import { Spinner } from "@/components/loading";
import {
  forgetEmail,
  lastEmail,
  rememberEmail,
  rememberedEmails,
} from "@/lib/remembered";
import { login, type LoginState } from "./actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner className="size-4" />
          Входим…
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function LoginForm({
  labels,
}: {
  labels: { email: string; password: string; submit: string; error: string };
}) {
  const [state, action] = useActionState<LoginState, FormData>(login, {});
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const attempted = useRef<string>("");

  // Читаем список после монтирования: на сервере localStorage нет, а разное
  // значение на сервере и в браузере ломает гидратацию.
  useEffect(() => {
    setSaved(rememberedEmails());
    setEmail(lastEmail());
  }, []);

  // Вход не удался — убираем адрес из списка, чтобы опечатка не осталась в нём
  // навсегда и не подставлялась при каждом заходе.
  useEffect(() => {
    if (state.error && attempted.current) {
      forgetEmail(attempted.current);
      setSaved(rememberedEmails());
    }
  }, [state]);

  const others = saved.filter((e) => e !== email);

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={() => {
        attempted.current = email;
        rememberEmail(email);
      }}
    >
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          // Свой список подсказок, помимо того, что предлагает браузер.
          list="uiren-saved-emails"
        />
        {saved.length > 0 && (
          <datalist id="uiren-saved-emails">
            {saved.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        )}
      </div>

      <PasswordInput
        id="password"
        name="password"
        label={labels.password}
        autoComplete="current-password"
      />

      {/* Быстрое переключение между аккаунтами на общем компьютере. */}
      {others.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[var(--color-muted)]">Ещё:</span>
          {others.map((e) => (
            <span key={e} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => setEmail(e)}
                className="rounded-l-full border border-[var(--color-line)] py-1 pr-1.5 pl-2.5 text-xs text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                {e}
              </button>
              <button
                type="button"
                aria-label={`Забыть ${e}`}
                title="Убрать из списка"
                onClick={() => {
                  forgetEmail(e);
                  setSaved(rememberedEmails());
                }}
                className="rounded-r-full border border-l-0 border-[var(--color-line)] px-1.5 py-1 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {state.error && (
        <p className="animate-pop rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {labels.error}
        </p>
      )}

      <Submit label={labels.submit} />
    </form>
  );
}
