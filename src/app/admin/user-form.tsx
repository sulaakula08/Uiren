"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createUser, type AdminState } from "./actions";

const ROLES = [
  ["TEACHER", "Учитель"],
  ["STUDENT", "Ученик"],
  ["PARENT", "Родитель"],
  ["DIRECTOR", "Директор"],
  ["ADMIN", "Администратор"],
] as const;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Создаю…" : "Создать"}
    </button>
  );
}

export function UserForm() {
  const [state, action] = useActionState<AdminState, FormData>(createUser, {});

  return (
    <form action={action} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="u-name">
            ФИО
          </label>
          <input id="u-name" name="fullName" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="u-email">
            Электронная почта
          </label>
          <input
            id="u-email"
            name="email"
            type="email"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="u-role">
            Роль
          </label>
          <select id="u-role" name="role" className="input">
            {ROLES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="u-locale">
            Язык интерфейса
          </label>
          <select id="u-locale" name="locale" className="input">
            <option value="ru">Русский</option>
            <option value="kk">Қазақша</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="u-password">
            Временный пароль
          </label>
          <input
            id="u-password"
            name="password"
            type="text"
            minLength={6}
            className="input"
            placeholder="минимум 6 символов"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="muted text-xs">
          Пароль передайте пользователю лично — система его не рассылает.
        </p>
        <Submit />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {state.ok}
        </p>
      )}
    </form>
  );
}
