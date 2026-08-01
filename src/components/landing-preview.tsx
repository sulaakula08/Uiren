import { IconSpark } from "@/components/icons";

/** Строки разбора класса — пример на лендинге, не настоящие данные школы. */
const TOPICS = [
  { name: "Линейные уравнения", percent: 86, tone: "bg-[var(--color-brand)]" },
  { name: "Раскрытие скобок", percent: 61, tone: "bg-amber-500" },
  { name: "Перенос слагаемых", percent: 34, tone: "bg-[var(--color-danger)]" },
];

/**
 * Макет экрана учителя для первого экрана лендинга.
 * Данные вымышленные и подписаны как пример — это иллюстрация интерфейса.
 */
export function LandingPreview() {
  return (
    <div className="surface animate-float overflow-hidden shadow-[var(--shadow-lift)]">
      {/* Шапка окна */}
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] bg-white/70 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[var(--color-line)]" />
        <span className="size-2.5 rounded-full bg-[var(--color-line)]" />
        <span className="size-2.5 rounded-full bg-[var(--color-line)]" />
        <p className="ml-2 text-xs font-medium text-[var(--color-muted)]">
          Пример разбора · 7«Б» · Алгебра
        </p>
      </div>

      <div className="space-y-5 p-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="overline">Работы проверены</p>
            <p className="mt-1.5 text-[28px] leading-none font-semibold tracking-tight">
              24 из 24
            </p>
          </div>
          <span className="badge-soft">
            <IconSpark className="size-3.5" />
            за 40 секунд
          </span>
        </div>

        <div className="space-y-3">
          {TOPICS.map((topic, i) => (
            <div key={topic.name}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm text-[var(--color-ink-2)]">
                  {topic.name}
                </span>
                <span className="text-xs font-medium text-[var(--color-muted)] tabular-nums">
                  {topic.percent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line-2)]">
                <div
                  className={`animate-grow h-full rounded-full ${topic.tone}`}
                  style={{
                    width: `${topic.percent}%`,
                    animationDelay: `${350 + i * 160}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--color-brand)]/20 bg-[var(--color-brand-tint)]/60 p-3.5">
          <p className="text-xs leading-relaxed text-[var(--color-brand-dark)]">
            <span className="font-semibold">Вывод для урока: </span>
            13 учеников теряют знак при переносе слагаемого. Разберите этот шаг
            на доске до новой темы.
          </p>
        </div>
      </div>
    </div>
  );
}
