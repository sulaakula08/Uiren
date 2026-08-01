"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    handleGoogleCallback?: (response: { credential: string }) => Promise<void>;
  }
}

export default function GoogleLoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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

    // 2. Скрипт добавляем один раз на страницу.
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
  }, [router]);

  return (
    <div className="my-4 flex flex-col items-center justify-center">
      <div
        id="g_id_onload"
        data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        data-callback="handleGoogleCallback"
        data-auto_prompt="false"
      />
      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="outline"
        data-text="signin_with"
        data-size="large"
        data-logo_alignment="left"
      />

      {error && (
        <p className="animate-pop mt-3 w-full rounded-xl bg-[var(--color-danger-tint)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
