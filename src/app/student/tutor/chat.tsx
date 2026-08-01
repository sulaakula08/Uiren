"use client";

import { useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Объясни, почему при D = 0 корень один",
  "Разбери мою ошибку в последней работе",
  "Дай похожий пример и проверь моё решение",
];

export function TutorChat({
  initialSessionId,
  initialTurns,
}: {
  initialSessionId: string | null;
  initialTurns: Turn[];
}) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;

    setError(null);
    setBusy(true);
    setInput("");
    setTurns((prev) => [
      ...prev,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || "Тьютор недоступен");
      }

      const returnedId = response.headers.get("X-Tutor-Session");
      if (returnedId) setSessionId(returnedId);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Дописываем в последний (пустой) ответ по мере поступления чанков.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setTurns((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось получить ответ");
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col gap-4">
      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-white p-5">
        {turns.length === 0 && (
          <div className="py-8 text-center">
            <p className="muted mb-4">
              Спросите что угодно по школьной программе. Тьютор знает ваш класс
              и ваши последние ошибки.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="btn-ghost text-xs"
                  onClick={() => send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, i) => (
          <div
            key={i}
            className={turn.role === "user" ? "flex justify-end" : "flex"}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                turn.role === "user"
                  ? "bg-[var(--color-brand)] text-white"
                  : "bg-[var(--color-canvas)]"
              }`}
            >
              {turn.content ||
                (busy && i === turns.length - 1 ? "…" : turn.content)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="input"
          placeholder="Ваш вопрос…"
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-primary" disabled={busy || !input.trim()}>
          {busy ? "…" : "Спросить"}
        </button>
      </form>
    </div>
  );
}
