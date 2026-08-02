"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
/** Сколько ждём скрипт Google, прежде чем сказать об этом вслух. */
const LOAD_TIMEOUT = 8000;

type GoogleId = {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

/** Скрипт добавляем один раз на страницу; повторные вызовы — не наша забота. */
function ensureScript() {
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const script = document.createElement("script");
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

/**
 * Ждём, пока Google положит своё API на window.
 *
 * Именно опросом, а не событием `load`: скрипт мог загрузиться раньше — при
 * прошлом заходе на страницу — и его событие уже давно отгремело. Подписка на
 * него в таком случае не срабатывает никогда, и кнопка не появляется вовсе.
 */
function waitForGoogle(signal: AbortSignal): Promise<GoogleId> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (signal.aborted) return;
      const api = window.google?.accounts?.id;
      if (api) return resolve(api);
      if (Date.now() - started > LOAD_TIMEOUT) {
        return reject(new Error("Скрипт Google не загрузился"));
      }
      setTimeout(tick, 80);
    };
    tick();
  });
}

/**
 * Вход через Google.
 *
 * Кнопку рисуем вызовом `renderButton`, а не разметкой с `g_id_signin`.
 * Разметку скрипт Google разбирает ровно один раз — в момент своей загрузки.
 * Если он уже был загружен, ничего не происходит: кнопка не появляется, и
 * никакой ошибки при этом нет. Явный вызов работает при каждом монтировании.
 */
export default function GoogleLoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stalled, setStalled] = useState(false);
  const [ready, setReady] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    const controller = new AbortController();

    // Скрипт начинает грузиться сразу, параллельно с замером оформления:
    // раньше он ждал лишнего кадра, и кнопка появлялась заметно позже страницы.
    ensureScript();

    waitForGoogle(controller.signal)
      .then((api) => {
        if (controller.signal.aborted || !target.current) return;

        api.initialize({
          client_id: clientId,
          callback: async (response) => {
            setError(null);
            try {
              const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });
              const data = await res.json().catch(() => ({}));

              if (res.ok && data.success && data.redirectTo) {
                router.push(data.redirectTo);
                router.refresh();
                return;
              }

              // Показываем текст сервера, а не общее «не получилось»: там может
              // быть «сначала зарегистрируйтесь по коду школы» — без этого
              // человек не поймёт, что делать дальше.
              setError(data.error ?? "Не удалось войти через Google");
            } catch {
              setError("Сеть недоступна. Попробуйте ещё раз.");
            }
          },
        });

        // Тему и ширину читаем прямо здесь: на сервере ни того, ни другого нет.
        const attr = document.documentElement.dataset.theme;
        const dark =
          attr === "dark" ||
          (attr === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        const available = holder.current?.offsetWidth ?? 320;

        target.current.replaceChildren();
        api.renderButton(target.current, {
          type: "standard",
          shape: "pill",
          theme: dark ? "filled_black" : "outline",
          text: "continue_with",
          size: "large",
          logo_alignment: "center",
          // Google принимает ширину от 200 до 400 и сам не тянется.
          width: Math.max(200, Math.min(400, Math.round(available))),
        });
        setReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setStalled(true);
      });

    return () => controller.abort();
  }, [router, clientId]);

  // Ключ не задан — рисовать нечего, и пустая рамка только путает.
  if (!clientId) return null;

  return (
    <div ref={holder} className="mt-4 flex flex-col items-stretch">
      <div ref={target} className="flex justify-center" />

      {/* Место под кнопку держим заранее, иначе карточка дёргается. */}
      {!ready && !stalled && <div className="h-10" aria-hidden />}

      {stalled && (
        <p className="muted text-center text-xs">
          Вход через Google сейчас недоступен — войдите по почте и паролю.
        </p>
      )}

      {error && (
        <p className="animate-pop mt-3 w-full rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
