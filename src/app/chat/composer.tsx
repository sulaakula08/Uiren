"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/loading";
import { sendChatMessage, type SendState } from "./actions";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary shrink-0" disabled={pending}>
      {pending ? <Spinner className="size-4" /> : "Отправить"}
    </button>
  );
}

export function Composer({ to }: { to: string }) {
  const [state, action] = useActionState<SendState, FormData>(
    sendChatMessage,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Очищаем поле только после удачной отправки: иначе при ошибке человек
  // потеряет набранный текст.
  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-4">
      <input type="hidden" name="to" value={to} />
      <div className="flex items-end gap-2">
        <textarea
          name="body"
          rows={2}
          required
          maxLength={2000}
          placeholder="Написать сообщение…"
          className="input resize-none"
          onKeyDown={(e) => {
            // Enter отправляет, Shift+Enter — перенос строки.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <SendButton />
      </div>
      {state.error && (
        <p className="animate-pop mt-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
    </form>
  );
}
