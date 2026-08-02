import {
  FORMATS,
  JOURNAL_LABELS,
  isExportTarget,
  type ExportTarget,
  type Journal,
} from "@/lib/journal";

const TARGETS = Object.keys(FORMATS) as ExportTarget[];

/**
 * Выгрузка оценок за работу.
 *
 * Обычные ссылки, а не форма: браузеру нужно просто скачать файл. Поэтому и
 * клиентского кода здесь нет — раскрытие остальных форматов делает <details>.
 */
export function ExportGrades({
  assignmentId,
  journal,
  graded,
}: {
  assignmentId: string;
  /** Что выбрано в панели школы. NONE — школа не определилась. */
  journal: Journal;
  /** Сколько сданных работ попадёт в файл. */
  graded: number;
}) {
  const href = (target: ExportTarget) =>
    `/teacher/assignments/${assignmentId}/export?journal=${target}`;

  if (graded === 0) {
    return (
      <p className="muted text-sm">
        Выгрузка появится, когда ученики сдадут работы.
      </p>
    );
  }

  const chosen = isExportTarget(journal) ? journal : null;
  const others = TARGETS.filter((t) => t !== chosen);

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Перенести оценки в журнал</p>
          <p className="muted mt-0.5 text-sm">
            {chosen
              ? `Файл в формате ${JOURNAL_LABELS[chosen]} — ${FORMATS[chosen].hint}`
              : "Школа не выбрала журнал — скачайте в нужном формате"}
          </p>
        </div>

        {chosen && (
          <a href={href(chosen)} download className="btn-primary shrink-0">
            Скачать для {JOURNAL_LABELS[chosen]}
          </a>
        )}
      </div>

      {chosen ? (
        <details className="mt-3">
          <summary className="muted cursor-pointer text-xs">
            Другой формат
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {others.map((target) => (
              <a
                key={target}
                href={href(target)}
                download
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                {JOURNAL_LABELS[target]}
              </a>
            ))}
          </div>
        </details>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {TARGETS.map((target) => (
            <a
              key={target}
              href={href(target)}
              download
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              {JOURNAL_LABELS[target]}
            </a>
          ))}
        </div>
      )}

      <p className="muted mt-3 text-xs">
        {graded} работ в файле. Оценка — учительская, если она есть, иначе
        предложенная AI. Черновики не выгружаются.
      </p>
    </div>
  );
}
