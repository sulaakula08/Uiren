"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Минимальный кусок Google Identity Services, который мы реально используем. */
type GoogleId = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, string | number>,
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleId;
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/**
 * Кнопка «Войти через Google».
 *
 * Google рисует кнопку сам — свою вёрстку подставлять нельзя, это нарушает
 * их правила оформления. Токен из callback уходит на /api/auth/google, где
 * проверяется подпись; сюда возвращается только адрес для перехода.
 */
export function GoogleButton({ clientId }: { clientId: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const onCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setError("Google не вернул токен. Попробуйте ещё раз.");
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error ?? "Не удалось войти через Google");
          setBusy(false);
          return;
        }

        // refresh() нужен, чтобы серверные страницы увидели новую cookie.
        router.replace(data.redirectTo ?? "/");
        router.refresh();
      } catch {
        setError("Сеть недоступна. Попробуйте ещё раз.");
        setBusy(false);
      }
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google || !holder.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: onCredential,
      });
      window.google.accounts.id.renderButton(holder.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        logo_alignment: "center",
        width: 320,
      });
    };

    if (window.google) {
      render();
      return () => {
        cancelled = true;
      };
    }

    // Скрипт грузим сами, а не через next/script: так проще дождаться готовности.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    script.addEventListener("error", () =>
      setError("Не удалось загрузить Google. Проверьте соединение."),
    );

    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
    };
  }, [clientId, onCredential]);

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--color-line)]" />
        <span className="text-xs text-[var(--color-muted)]">или</span>
        <span className="h-px flex-1 bg-[var(--color-line)]" />
      </div>

      <div
        ref={holder}
        aria-busy={busy}
        className={`flex justify-center transition-opacity ${busy ? "pointer-events-none opacity-50" : ""}`}
      />

      {error && (
        <p className="animate-pop mt-3 rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
