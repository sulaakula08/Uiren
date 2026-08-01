"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { draftMessage, sendMessage, type MessageState } from "./actions";

type Student = { id: string; name: string; hasParent: boolean };

function Draft() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Пишу черновик…" : "Составить через AI"}
    </button>
  );
}

export function MessageComposer({ students }: { students: Student[] }) {
  const [state, action] = useActionState<MessageState, FormData>(
    draftMessage,
    {},
  );

  const [subjectLine, setSubjectLine] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  useEffect(() => {
    if (!state.draft) return;
    setSubjectLine(state.draft.subjectLine);
    setBody(state.draft.body);
    setSent(false);
    setSendError(null);
  }, [state.draft]);

  const selected = students.find((s) => s.id === state.draft?.studentId);

  return (
    <div className="space-y-5">
      <form action={action} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="msg-student">
              Ученик
            </label>
            <select id="msg-student" name="studentId" className="input">
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.hasParent ? "" : " (родитель не привязан)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="msg-tone">
              Тональность
            </label>
            <select id="msg-tone" name="tone" className="input">
              <option value="neutral">Нейтральная</option>
              <option value="praise">Похвала</option>
              <option value="concern">Обеспокоенность</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="msg-situation">
            Ситуация
          </label>
          <textarea
            id="msg-situation"
            name="situation"
            rows={3}
            className="input"
            placeholder="Третью неделю не сдаёт домашние работы по математике, на уроке отвечает верно"
            required
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="muted text-xs">
            Черновик можно отредактировать перед отправкой
          </p>
          <Draft />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
            {state.error}
          </p>
        )}
      </form>

      {state.draft && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="h2">Черновик</h3>
            {selected && (
              <span className="muted text-xs">Для родителя: {selected.name}</span>
            )}
          </div>

          <div>
            <label className="label" htmlFor="msg-subject">
              Тема
            </label>
            <input
              id="msg-subject"
              className="input"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="msg-body">
              Текст
            </label>
            <textarea
              id="msg-body"
              rows={7}
              className="input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="muted text-xs">Отправится только по вашему нажатию</p>
            <button
              className="btn-primary"
              disabled={sending || sent || !body.trim()}
              onClick={() =>
                startSending(async () => {
                  setSendError(null);
                  try {
                    await sendMessage({
                      studentId: state.draft!.studentId,
                      subjectLine,
                      body,
                    });
                    setSent(true);
                  } catch (e) {
                    setSendError(
                      e instanceof Error ? e.message : "Не удалось отправить",
                    );
                  }
                })
              }
            >
              {sent ? "Отправлено" : sending ? "Отправляю…" : "Отправить"}
            </button>
          </div>

          {sendError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              {sendError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
