"use client";

import { useId, useState } from "react";
import { IconEye, IconEyeOff } from "./icons";

/**
 * Поле пароля с кнопкой «показать».
 *
 * Опечатку в скрытом пароле не видно, а на телефоне с автозаменой она почти
 * неизбежна — поэтому переключатель есть везде, где пароль вводят или задают.
 * Кнопка остаётся в порядке обхода с клавиатуры: это управляющий элемент,
 * а не украшение.
 */
export function PasswordInput({
  name,
  label,
  id,
  autoComplete = "current-password",
  minLength,
  placeholder,
  required = true,
  hint,
  showLabel = "Показать пароль",
  hideLabel = "Скрыть пароль",
}: {
  name: string;
  label: string;
  id?: string;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  showLabel?: string;
  hideLabel?: string;
}) {
  const generated = useId();
  const inputId = id ?? `${generated}-${name}`;
  const hintId = `${inputId}-hint`;
  const [shown, setShown] = useState(false);

  const toggleLabel = shown ? hideLabel : showLabel;

  return (
    <div>
      <label className="label" htmlFor={inputId}>
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={placeholder}
          required={required}
          aria-describedby={hint ? hintId : undefined}
          className="input pr-11"
        />
        <button
          type="button"
          onClick={() => setShown((prev) => !prev)}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-[var(--color-muted)] transition-colors hover:text-[var(--color-brand)] focus-visible:text-[var(--color-brand)] focus-visible:outline-none"
        >
          {shown ? (
            <IconEyeOff className="size-[18px]" />
          ) : (
            <IconEye className="size-[18px]" />
          )}
        </button>
      </div>

      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-[var(--color-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
