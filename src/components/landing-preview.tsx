import { IconSpark } from "@/components/icons";

/**
 * Строки разбора класса — пример на лендинге, не настоящие данные школы.
 *
 * Темы выбраны узнаваемые: директор или родитель должны понять строку с ходу,
 * без объяснений. «Перенос слагаемых» знает учитель математики, «проценты» и
 * «квадратные уравнения» — все.
 */
const TOPICS = [
  { name: "Квадратные уравнения", percent: 86, tone: "bg-[var(--color-brand)]" },
  { name: "Формулы сокращённого умножения", percent: 61, tone: "bg-amber-500" },
  { name: "Проценты и доли", percent: 34, tone: "bg-[var(--color-danger)]" },
];

/**
 * Макет экрана учителя для первого экрана лендинга.
 * Данные вымышленные и подписаны как пример — это иллюстрация интерфейса.
 */
export function LandingPreview() {
  return (
    <div className="surface animate-float overflow-hidden shadow-[var(--shadow-lift)]">
      {/* Шапка окна */}
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface)]/70 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[var(--color-line)]" />
        <span className="size-2.5 rounded-full bg-[var(--color-line)]" />
        <span className="size-2.5 rounded-full bg-[var(--color-line)]" />
        <p className="ml-2 text-xs font-medium text-[var(--color-muted)]">
          Пример разбора · 8«Б» · Алгебра
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
            /* Строка реагирует на курсор: подсвечивается и полоса становится
               толще. Так видно, что это живой интерфейс, а не картинка. */
            <div
              key={topic.name}
              className="group -mx-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-[var(--color-canvas)]"
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm text-[var(--color-ink-2)] transition-colors duration-200 group-hover:text-[var(--color-ink)]">
                  {topic.name}
                </span>
                <span className="text-xs font-medium text-[var(--color-muted)] tabular-nums transition-all duration-200 group-hover:text-[15px] group-hover:font-semibold group-hover:text-[var(--color-ink)]">
                  {topic.percent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line-2)] transition-all duration-200 group-hover:h-3">
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
            13 учеников не умеют выносить общий множитель. Разберите этот шаг на
            доске до контрольной.
          </p>
        </div>
      </div>
    </div>
  );
}
