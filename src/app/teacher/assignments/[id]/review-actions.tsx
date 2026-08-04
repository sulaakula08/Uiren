"use client";

import { useState } from "react";
import { ManualReview } from "./manual-review";
import { ApproveControl, ReviewOneButton } from "./review-controls";

type Task = { id: string; prompt: string; points: number };

/**
 * Действия над одной работой: проверить через AI, проверить вручную,
 * утвердить балл.
 *
 * Собраны в один ряд намеренно. Раньше кнопка проверки стояла справа сверху, а
 * «проверить вручную» — слева снизу под именем ученика: два способа сделать
 * одно и то же оказывались в разных углах карточки, и связь между ними
 * не читалась.
 */
export function ReviewActions({
  submissionId,
  status,
  aiScore,
  maxScore,
  tasks,
  answers,
  initialScores,
  reviewLabel,
  approveLabel,
}: {
  submissionId: string;
  status: string;
  aiScore: number | null;
  maxScore: number;
  tasks: Task[];
  answers: Record<string, string>;
  initialScores: Record<string, number>;
  reviewLabel: string;
  approveLabel: string;
}) {
  const [manual, setManual] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status === "SUBMITTED" && (
          <ReviewOneButton submissionId={submissionId} label={reviewLabel} />
        )}

        {status === "AI_REVIEWED" && (
          <ApproveControl
            submissionId={submissionId}
            suggested={aiScore ?? 0}
            max={maxScore}
            label={approveLabel}
          />
        )}

        <button
          type="button"
          onClick={() => setManual((v) => !v)}
          className="btn-ghost"
          aria-expanded={manual}
        >
          {manual ? "Свернуть" : "Проверить вручную"}
        </button>
      </div>

      <ManualReview
        submissionId={submissionId}
        tasks={tasks}
        answers={answers}
        initialScores={initialScores}
        open={manual}
        onClose={() => setManual(false)}
      />
    </>
  );
}
