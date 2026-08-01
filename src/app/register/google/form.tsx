"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  completeGoogleSignup,
  lookupSchoolClasses,
  type GoogleRegisterState,
} from "./actions";

type School = Awaited<ReturnType<typeof lookupSchoolClasses>>;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Создаём аккаунт…" : "Завершить регистрацию"}
    </button>
  );
}

export function GoogleSignupForm({
  token,
  email,
  fullName,
  defaultJoinCode,
}: {
  token: string;
  email: string;
  fullName: string;
  /** Подсказка для демо: код уже вписан, чтобы не искать его вручную. */
  defaultJoinCode?: string;
}) {
  const [state, action] = useActionState<GoogleRegisterState, FormData>(
    completeGoogleSignup,
    {},
  );
  const [role, setRole] = useState("STUDENT");
  const [joinCode, setJoinCode] = useState(defaultJoinCode ?? "");
  const [school, setSchool] = useState<School>(null);
  const [checked, setChecked] = useState(false);
  const [pending, startTransition] = useTransition();

  const check = () => {
    startTransition(async () => {
      setSchool(await lookupSchoolClasses(joinCode));
      setChecked(true);
    });
  };

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-3">
        <p className="text-sm font-medium">{fullName}</p>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">{email}</p>
        <p className="mt-2 text-xs text-[var(--color-brand)]">
          Личность подтверждена Google — пароль придумывать не нужно
        </p>
      </div>

      <div>
        <label className="label" htmlFor="joinCode">
          Код школы
        </label>
        <div className="flex gap-2">
          <input
            id="joinCode"
            name="joinCode"
            required
            placeholder="ABC123"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setChecked(false);
            }}
            className="input"
          />
          <button
            type="button"
            onClick={check}
            disabled={pending || joinCode.trim().length < 4}
            className="btn-ghost shrink-0"
          >
            {pending ? "…" : "Проверить"}
          </button>
        </div>
        {checked && school && (
          <p className="mt-1.5 text-xs text-[var(--color-brand)]">
            Школа найдена: {school.name}, {school.city}
          </p>
        )}
        {checked && !school && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">
            Школа с таким кодом не найдена
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="role">
          Кто вы в школе
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input"
        >
          <option value="TEACHER">Учитель</option>
          <option value="STUDENT">Ученик</option>
          <option value="PARENT">Родитель</option>
        </select>
      </div>

      {role === "STUDENT" && (
        <div>
          <label className="label" htmlFor="classId">
            Ваш класс
          </label>
          {school && school.classGroups.length > 0 ? (
            <select id="classId" name="classId" className="input" required>
              {school.classGroups.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="muted">
              Сначала введите код школы и нажмите «Проверить»
            </p>
          )}
        </div>
      )}

      {role === "PARENT" && (
        <div>
          <label className="label" htmlFor="childEmail">
            Почта аккаунта ребёнка
          </label>
          <input
            id="childEmail"
            name="childEmail"
            type="email"
            required
            className="input"
          />
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
            Ребёнок должен быть уже зарегистрирован в этой школе
          </p>
        </div>
      )}

      <div>
        <label className="label" htmlFor="locale">
          Язык интерфейса
        </label>
        <select id="locale" name="locale" className="input" defaultValue="ru">
          <option value="ru">Русский</option>
          <option value="kk">Қазақша</option>
        </select>
      </div>

      {state.error && (
        <p className="animate-pop rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
