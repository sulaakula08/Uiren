"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { joinSchool, lookupSchool, type RegisterState } from "../actions";

type Found = {
  name: string;
  city: string;
  classGroups: { id: string; name: string }[];
};

const ROLES = [
  { value: "TEACHER", label: "Учитель" },
  { value: "STUDENT", label: "Ученик" },
  { value: "PARENT", label: "Родитель" },
] as const;

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-primary w-full py-3"
      disabled={pending || disabled}
    >
      {pending ? "Создаю аккаунт…" : "Создать аккаунт"}
    </button>
  );
}

export function JoinForm() {
  const [state, action] = useActionState<RegisterState, FormData>(
    joinSchool,
    {},
  );

  const [code, setCode] = useState("");
  const [school, setSchool] = useState<Found | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();
  const [role, setRole] = useState<string>("TEACHER");

  // Школу подтверждаем до заполнения остальной формы: так человек сразу
  // видит, куда именно он попадёт, и не заполняет всё впустую.
  function check() {
    setLookupError(null);
    startChecking(async () => {
      const found = await lookupSchool(code);
      if (!found) {
        setSchool(null);
        setLookupError("Школа с таким кодом не найдена");
        return;
      }
      setSchool(found);
    });
  }

  return (
    <form action={action} className="card space-y-5 p-6">
      <div>
        <label className="label" htmlFor="joinCode">
          Код школы
        </label>
        <div className="flex gap-2">
          <input
            id="joinCode"
            name="joinCode"
            className="input font-mono text-base tracking-[0.2em] uppercase"
            placeholder="ABC123"
            maxLength={8}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setSchool(null);
              setLookupError(null);
            }}
            required
          />
          <button
            type="button"
            className="btn-ghost shrink-0"
            onClick={check}
            disabled={checking || code.trim().length < 4}
          >
            {checking ? "…" : "Проверить"}
          </button>
        </div>

        {lookupError && (
          <p className="animate-pop mt-2 text-sm text-[var(--color-danger)]">
            {lookupError}
          </p>
        )}

        {school && (
          <p className="animate-pop mt-2 rounded-xl bg-[var(--color-brand-tint)] px-3.5 py-2.5 text-sm text-[var(--color-brand)]">
            Школа найдена: <strong>{school.name}</strong>, {school.city}
          </p>
        )}
      </div>

      {school && (
        <div className="animate-rise space-y-5">
          <div>
            <label className="label" htmlFor="role">
              Кто вы в школе
            </label>
            <select
              id="role"
              name="role"
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {role === "STUDENT" && (
            <div className="animate-rise">
              <label className="label" htmlFor="classId">
                Ваш класс
              </label>
              {school.classGroups.length === 0 ? (
                <p className="rounded-xl bg-[var(--color-warn-tint)] px-3.5 py-2.5 text-sm text-[var(--color-warn)]">
                  В школе ещё не созданы классы. Попросите администратора
                  добавить их и вернитесь к регистрации.
                </p>
              ) : (
                <select id="classId" name="classId" className="input">
                  {school.classGroups.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {role === "PARENT" && (
            <div className="animate-rise">
              <label className="label" htmlFor="childEmail">
                Почта аккаунта ребёнка
              </label>
              <input
                id="childEmail"
                name="childEmail"
                type="email"
                className="input"
                placeholder="почта, с которой зарегистрирован ученик"
              />
              <p className="muted mt-1.5 text-xs">
                Ребёнок должен зарегистрироваться первым — по этой почте мы
                свяжем ваши аккаунты.
              </p>
            </div>
          )}

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

            <div>
              <label className="label" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={6}
                className="input"
                autoComplete="new-password"
                placeholder="минимум 6 символов"
                required
              />
            </div>

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
        </div>
      )}

      {state.error && (
        <p className="animate-pop rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <Submit
        disabled={
          !school || (role === "STUDENT" && school.classGroups.length === 0)
        }
      />
    </form>
  );
}
