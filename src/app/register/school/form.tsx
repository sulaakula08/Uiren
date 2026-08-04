"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { rememberEmail } from "@/lib/remembered";
import { Spinner } from "@/components/loading";
import { PasswordInput } from "@/components/password-input";
import { registerSchool, type RegisterState } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full py-3" disabled={pending}>
      {pending ? (
        <>
          <Spinner className="size-4" />
          Создаю школу…
        </>
      ) : (
        "Создать школу"
      )}
    </button>
  );
}

export function SchoolForm() {
  const [state, action] = useActionState<RegisterState, FormData>(
    registerSchool,
    {},
  );

  return (
    <form
      action={action} className="card space-y-5 p-6"
      onSubmit={(e) => {
        const field = e.currentTarget.elements.namedItem("email");
        if (field instanceof HTMLInputElement) rememberEmail(field.value);
      }}
    >
      <fieldset className="space-y-4">
        <legend className="overline mb-3">Школа</legend>

        <div>
          <label className="label" htmlFor="schoolName">
            Название школы
          </label>
          <input
            id="schoolName"
            name="schoolName"
            className="input"
            placeholder="Школа-гимназия №25"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="city">
            Город
          </label>
          <input
            id="city"
            name="city"
            className="input"
            placeholder="Алматы"
            required
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-[var(--color-line)] pt-5">
        <legend className="overline mb-3">Ваш аккаунт</legend>

        <div>
          <label className="label" htmlFor="fullName">
            Имя и фамилия
          </label>
          <input
            id="fullName"
            name="fullName"
            className="input"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Электронная почта
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            autoComplete="username"
            required
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Пароль"
          minLength={6}
          autoComplete="new-password"
          placeholder="минимум 6 символов"
        />

        <div>
          <label className="label" htmlFor="locale">
            Язык интерфейса
          </label>
          <select id="locale" name="locale" className="input">
            <option value="ru">Русский</option>
            <option value="kk">Қазақша</option>
          </select>
        </div>
      </fieldset>

      {state.error && (
        <p className="animate-pop rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
