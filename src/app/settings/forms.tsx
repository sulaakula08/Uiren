"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  changePassword,
  updateProfile,
  type SettingsState,
} from "./actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Сохраняем…" : label}
    </button>
  );
}

/** Один стиль для обоих исходов — зелёный при успехе, красный при ошибке. */
function Notice({ state }: { state: SettingsState }) {
  if (!state.error && !state.ok) return null;
  const error = Boolean(state.error);
  return (
    <p
      role="status"
      className={`animate-pop rounded-xl px-3.5 py-2.5 text-sm ${
        error
          ? "bg-[var(--color-danger-tint)] text-[var(--color-danger)]"
          : "bg-[var(--color-brand-tint)] text-[var(--color-brand)]"
      }`}
    >
      {state.error ?? state.ok}
    </p>
  );
}

export function ProfileForm({
  fullName,
  email,
  locale,
}: {
  fullName: string;
  email: string;
  locale: string;
}) {
  const [state, action] = useActionState<SettingsState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">
            Имя и фамилия
          </label>
          <input
            id="fullName"
            name="fullName"
            defaultValue={fullName}
            required
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Электронная почта
          </label>
          <input
            id="email"
            value={email}
            disabled
            className="input"
            aria-describedby="email-hint"
          />
          <p
            id="email-hint"
            className="mt-1.5 text-xs text-[var(--color-muted)]"
          >
            Почта — логин для входа, её меняет администратор школы
          </p>
        </div>
      </div>

      <div className="max-w-xs">
        <label className="label" htmlFor="locale">
          Язык интерфейса
        </label>
        <select
          id="locale"
          name="locale"
          defaultValue={locale}
          className="input"
        >
          <option value="ru">Русский</option>
          <option value="kk">Қазақша</option>
        </select>
      </div>

      <Notice state={state} />
      <Submit label="Сохранить профиль" />
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<SettingsState, FormData>(
    changePassword,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div className="max-w-xs">
        <label className="label" htmlFor="current">
          Текущий пароль
        </label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>

      <div className="grid max-w-lg gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="next">
            Новый пароль
          </label>
          <input
            id="next"
            name="next"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="repeat">
            Повторите новый
          </label>
          <input
            id="repeat"
            name="repeat"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="input"
          />
        </div>
      </div>

      <Notice state={state} />
      <Submit label="Изменить пароль" />
    </form>
  );
}
