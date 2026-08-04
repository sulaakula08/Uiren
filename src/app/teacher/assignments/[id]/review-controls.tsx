"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/loading";
import {
  approveSubmission,
  reviewAllPending,
  reviewSubmission,
} from "../actions";

export function ReviewAllButton({
  assignmentId,
  pending,
  label,
}: {
  assignmentId: string;
  pending: number;
  label: string;
}) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (pending === 0) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="btn-primary"
        disabled={busy}
        onClick={() =>
          start(async () => {
            setError(null);
            try {
              await reviewAllPending(assignmentId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось");
            }
          })
        }
      >
        {busy ? (
          <>
            <Spinner />
            Проверяю {pending}…
          </>
        ) : (
          `${label} (${pending})`
        )}
      </button>
      {error && (
        <span className="text-xs text-[var(--color-danger)]">{error}</span>
      )}
    </div>
  );
}

export function ReviewOneButton({
  submissionId,
  label,
}: {
  submissionId: string;
  label: string;
}) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        className="btn-ghost"
        disabled={busy}
        onClick={() =>
          start(async () => {
            setError(null);
            try {
              await reviewSubmission(submissionId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось");
            }
          })
        }
      >
        {busy ? (
          <>
            <Spinner className="size-4" />
            Проверяю…
          </>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="mt-1 max-w-48 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

export function ApproveControl({
  submissionId,
  suggested,
  max,
  label,
}: {
  submissionId: string;
  suggested: number;
  max: number;
  label: string;
}) {
  const [score, setScore] = useState(suggested);
  const [busy, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={max}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        className="input w-20"
      />
      <button
        className="btn-primary"
        disabled={busy}
        onClick={() => start(() => approveSubmission(submissionId, score))}
      >
        {busy ? <Spinner className="size-4" /> : label}
      </button>
    </div>
  );
}
