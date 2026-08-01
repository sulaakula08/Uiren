"use client";

import { useState } from "react";

/** Код приглашения — главный инструмент администратора, поэтому он вверху. */
export function JoinCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      data-tour="joincode"
      className="card flex flex-wrap items-center justify-between gap-4"
    >
      <div>
        <p className="overline">Код приглашения</p>
        <p className="mt-1.5 font-mono text-3xl font-semibold tracking-[0.22em] text-[var(--color-brand)]">
          {code}
        </p>
        <p className="muted mt-1.5 text-xs">
          По нему учителя, ученики и родители регистрируются сами
        </p>
      </div>

      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? "Скопировано" : "Скопировать"}
      </button>
    </div>
  );
}
