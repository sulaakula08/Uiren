"use client";

import { useTransition } from "react";
import { Spinner } from "@/components/loading";
import { decideLateRequest } from "../actions";

type Request = {
  id: string;
  reason: string;
  studentName: string;
  createdAt: string;
};

/** Просьбы сдать после срока. Показываются только пока не решены. */
export function LateRequests({ requests }: { requests: Request[] }) {
  const [busy, start] = useTransition();

  if (requests.length === 0) return null;

  return (
    <section className="card border-[var(--color-warn)]/30">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="h2">Просят открыть сдачу</h2>
        <span className="chip bg-[var(--color-warn-tint)] text-[var(--color-warn)]">
          {requests.length}
        </span>
      </div>
      <p className="muted mb-4 text-sm">
        Срок прошёл. Эти ученики просят разрешить сдать работу.
      </p>

      <ul className="space-y-3">
        {requests.map((r) => (
          <li
            key={r.id}
            className="animate-rise rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.studentName}</p>
                <p className="muted mt-0.5 text-xs">{r.createdAt}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={busy}
                  onClick={() => start(() => decideLateRequest(r.id, false))}
                >
                  Отказать
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => start(() => decideLateRequest(r.id, true))}
                >
                  {busy ? <Spinner className="size-4" /> : "Открыть сдачу"}
                </button>
              </div>
            </div>

            <p className="mt-2.5 rounded-lg bg-[var(--color-canvas)] px-3 py-2 text-sm">
              {r.reason}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
