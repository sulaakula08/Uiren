/**
 * Иллюстрация главной идеи продукта: одна и та же тройка бывает разной.
 *
 * Обычный журнал показывает балл. Здесь показано, из чего он сложился —
 * четыре причины ошибки, у каждой своя доля. Это то, чего нет ни в Күнделік,
 * ни в чужом чат-боте, поэтому картинке место на первом экране.
 *
 * Полосы растут при появлении блока (scroll-driven), поэтому в статике
 * страница не выглядит пустой, а при прокрутке оживает.
 */
const REASONS = [
  {
    key: "concept",
    label: "Не понял тему",
    share: 42,
    color: "var(--color-danger)",
    hint: "Взял неверный метод. Объяснять заново.",
  },
  {
    key: "calc",
    label: "Ошибся в счёте",
    share: 27,
    color: "var(--color-warn)",
    hint: "Метод верный. Нужна тренировка.",
  },
  {
    key: "careless",
    label: "Невнимательность",
    share: 21,
    color: "#2e9e6b",
    hint: "Потерял знак, описался.",
  },
  {
    key: "copy",
    label: "Похоже на списывание",
    share: 10,
    color: "var(--color-muted)",
    hint: "Ответ есть, решения нет.",
  },
];

export function ErrorNatureViz() {
  return (
    <div className="card overflow-hidden p-6 sm:p-7">
      <p className="overline">Почему класс ошибся</p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Пример: 24 работы по алгебре, 61 ошибка
      </p>

      {/* Одна общая полоса: сразу видно соотношение причин. */}
      <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-[var(--color-line-2)]">
        {REASONS.map((r, i) => (
          <span
            key={r.key}
            className="nature-seg h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${r.share}%`,
              background: r.color,
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>

      <ul className="mt-6 space-y-3.5">
        {REASONS.map((r, i) => (
          <li
            key={r.key}
            className="nature-row group flex items-start gap-3"
            style={{ animationDelay: `${200 + i * 110}ms` }}
          >
            <span
              className="mt-1.5 size-2.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-150"
              style={{ background: r.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{r.label}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {r.share}%
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {r.hint}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 border-t border-[var(--color-line)] pt-4 text-sm leading-relaxed text-[var(--color-ink-2)]">
        Журнал показал бы четыре тройки. Тут видно, что двоим нужно объяснить
        тему заново, а двое просто торопились.
      </p>
    </div>
  );
}
