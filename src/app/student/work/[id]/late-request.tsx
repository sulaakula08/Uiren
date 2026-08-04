"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/loading";
import { ACCESS_TEXT } from "@/lib/deadline";
import { requestLateAccess, type LateRequestState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? (
        <>
          <Spinner className="size-4" />
          Отправляю…
        </>
      ) : (
        "Отправить запрос"
      )}
    </button>
  );
}

/** Экран вместо формы сдачи, когда срок прошёл. */
export function LateNotice({
  assignmentId,
  reason,
  dueAt,
}: {
  assignmentId: string;
  reason: "BLOCKED" | "NEEDS_REQUEST" | "REQUEST_PENDING" | "REQUEST_DECLINED";
  dueAt: string;
}) {
  const [state, action] = useActionState<LateRequestState, FormData>(
    requestLateAccess,
    {},
  );
  const copy = ACCESS_TEXT[reason];
  const sent = Boolean(state.ok);

  return (
    <div className="card border-[var(--color-warn)]/30 bg-[var(--color-warn-tint)]/40">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--color-warn-tint)] text-[var(--color-warn)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            className="size-[18px]"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5V12l3 2" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-medium">{copy.title}</p>
          <p className="muted mt-1">{copy.text}</p>
          <p className="muted mt-1 text-xs">Срок был до {dueAt}</p>
        </div>
      </div>

      {reason === "NEEDS_REQUEST" && !sent && (
        <form action={action} className="mt-4 space-y-3">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <textarea
            name="reason"
            rows={2}
            required
            minLength={5}
            maxLength={500}
            className="input"
            placeholder="Например: болел, справка есть у классного руководителя"
          />
          {state.error && (
            <p className="animate-pop text-sm text-[var(--color-danger)]">
              {state.error}
            </p>
          )}
          <Submit />
        </form>
      )}

      {sent && (
        <p className="animate-pop mt-4 rounded-xl bg-[var(--color-brand-tint)] px-3.5 py-2.5 text-sm text-[var(--color-brand)]">
          {state.ok}
        </p>
      )}
    </div>
  );
}
