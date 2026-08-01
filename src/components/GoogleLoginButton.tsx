"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    handleGoogleCallback?: (response: { credential: string }) => Promise<void>;
  }
}

/** Оформление кнопки: считается в браузере, до этого рисовать нечего. */
type Look = { theme: string; width: number };

export default function GoogleLoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [look, setLook] = useState<Look | null>(null);
  const holder = useRef<HTMLDivElement>(null);

  // Тему и ширину нельзя вычислить на сервере: там нет ни <html data-theme>,
  // ни ширины карточки. Поэтому сначала измеряем, и только потом подключаем
  // скрипт Google — иначе он разберёт разметку со значениями по умолчанию.
  useEffect(() => {
    const attr = document.documentElement.dataset.theme;
    const dark =
      attr === "dark" ||
      (attr === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Google принимает ширину от 200 до 400 и не тянется сам.
    const available = holder.current?.offsetWidth ?? 320;
    const width = Math.max(200, Math.min(400, Math.round(available)));

    setLook({ theme: dark ? "filled_black" : "outline", width });
  }, []);

  useEffect(() => {
    // 1. Колбэк должен лежать на window до загрузки скрипта: разметка
    //    ссылается на него по имени через data-callback.
    window.handleGoogleCallback = async (response) => {
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

        // Показываем текст сервера, а не общее «не получилось»: там может быть
        // «сначала зарегистрируйтесь по коду школы» — без этого человек
        // не поймёт, что делать дальше.
        setError(data.error ?? "Не удалось войти через Google");
      } catch {
        setError("Сеть недоступна. Попробуйте ещё раз.");
      }
    };

    // 2. Скрипт — только после того, как оформление посчитано: Google читает
    //    data-атрибуты один раз при загрузке и потом их не перечитывает.
    if (!look) return;

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (!existing) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    return () => {
      // Скрипт при размонтировании не удаляем: Google вешает на него свои
      // обработчики, и повторный вход после возврата на страницу ломается.
      // Снимаем только колбэк.
      delete window.handleGoogleCallback;
    };
  }, [router, look]);

  return (
    <div ref={holder} className="mt-4 flex flex-col items-stretch">
      {/* Пока оформление не посчитано, держим место под кнопку: без этого
          карточка дёргается на высоту кнопки в момент появления. */}
      {!look && <div className="h-10" aria-hidden />}

      {look && (
        <>
          <div
            id="g_id_onload"
            data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
            data-callback="handleGoogleCallback"
            data-auto_prompt="false"
          />
          {/* Кнопку рисует Google — своя вёрстка нарушает их правила
              оформления. Настраивать можно только эти параметры. */}
          <div
            className="g_id_signin flex justify-center"
            data-type="standard"
            data-shape="pill"
            data-theme={look.theme}
            data-text="continue_with"
            data-size="large"
            data-logo_alignment="center"
            data-width={String(look.width)}
          />
        </>
      )}

      {error && (
        <p className="animate-pop mt-3 w-full rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
