"use client";

import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/rich-text";
import { Spinner } from "@/components/loading";

type Turn = { role: "user" | "assistant"; content: string };

/**
 * Ровное появление текста.
 *
 * Модель присылает ответ рывками: то полстроки разом, то пауза. Если рисовать
 * чанки как приходят, текст дёргается. Здесь цель хранится отдельно, а на
 * экран буквы выпускаются равномерно по кадрам — читается спокойнее, при этом
 * отставание само сходит на нет, когда поток обгоняет вывод.
 */
function useSmoothText(target: string, enabled: boolean) {
  const [shown, setShown] = useState(target);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setShown(target);
      return;
    }
    if (shown === target) return;

    // Не отстаём слишком сильно: чем больше очередь, тем быстрее печатаем.
    const step = () => {
      setShown((current) => {
        if (current.length >= target.length) return target;
        const behind = target.length - current.length;
        const chars = Math.max(2, Math.ceil(behind / 12));
        return target.slice(0, current.length + chars);
      });
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, enabled, shown]);

  return enabled ? shown : target;
}

/** Три точки, пока ответ ещё не начал приходить. */
function Typing() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Печатает">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-[var(--color-muted)]"
          style={{
            animation: "uiren-blink 1.2s ease-in-out infinite",
            animationDelay: `${i * 160}ms`,
          }}
        />
      ))}
    </span>
  );
}

const SUGGESTIONS = [
  "Объясни, почему при D = 0 корень один",
  "Разбери мою ошибку в последней работе",
  "Дай похожий пример и проверь моё решение",
];

function Bubble({ turn, streaming }: { turn: Turn; streaming: boolean }) {
  const text = useSmoothText(turn.content, streaming);
  const mine = turn.role === "user";

  return (
    <div className={mine ? "flex justify-end" : "flex"}>
      <div
        className={`animate-pop max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
          mine
            ? "bg-[var(--color-brand)] text-[var(--color-on-brand)] whitespace-pre-wrap"
            : "bg-[var(--color-canvas)]"
        }`}
      >
        {mine ? (
          turn.content
        ) : text ? (
          <RichText text={text} />
        ) : (
          <Typing />
        )}
      </div>
    </div>
  );
}

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
        throw new Error(text || "Uiren AI недоступен");
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
      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-[var(--color-surface)] p-5">
        {turns.length === 0 && (
          <div className="py-8 text-center">
            <p className="muted mb-4">
              Спросите что угодно по школьной программе. Uiren AI знает ваш класс
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
          <Bubble
            key={i}
            turn={turn}
            streaming={busy && i === turns.length - 1}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="animate-pop rounded-lg bg-[var(--color-danger-tint)] px-3 py-2 text-sm text-[var(--color-danger)]">
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
          {busy ? <Spinner className="size-4" /> : "Спросить"}
        </button>
      </form>
    </div>
  );
}
