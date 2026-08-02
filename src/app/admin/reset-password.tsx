"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetUserPassword, type ResetState } from "./actions";

function Submit({ requested }: { requested: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-3 py-1.5 text-xs ${requested ? "btn-primary" : "btn-ghost"}`}
    >
      {pending ? "Сбрасываю…" : "Сбросить пароль"}
    </button>
  );
}

/**
 * Сброс пароля пользователю.
 *
 * Новый пароль показывается один раз, прямо здесь: передать его человеку —
 * задача администратора, и хранить его в переписке или в базе в открытом виде
 * не нужно ни секунды.
 */
export function ResetPasswordButton({
  userId,
  requested,
}: {
  userId: string;
  /** Человек сам попросил сброс — подсвечиваем кнопку. */
  requested: boolean;
}) {
  const [state, action] = useActionState<ResetState, FormData>(
    resetUserPassword,
    {},
  );

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={action}>
        <input type="hidden" name="userId" value={userId} />
        <Submit requested={requested} />
      </form>

      {state.error && (
        <p className="text-xs text-[var(--color-danger)]">{state.error}</p>
      )}

      {state.password && (
        <div className="animate-pop rounded-xl bg-[var(--color-brand-tint)] px-3 py-2 text-right">
          <p className="text-xs text-[var(--color-brand)]">
            Временный пароль для {state.name}
          </p>
          <p className="font-mono text-sm font-semibold tracking-wider text-[var(--color-brand)]">
            {state.password}
          </p>
          <p className="muted mt-0.5 text-[11px]">
            Показывается один раз — передайте лично
          </p>
        </div>
      )}
    </div>
  );
}
