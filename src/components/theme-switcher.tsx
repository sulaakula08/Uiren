import { setTheme } from "@/app/actions";
import { THEMES, type Theme } from "@/lib/theme";
import { IconMonitor, IconMoon, IconSun } from "./icons";

const OPTIONS: Record<
  Theme,
  { Icon: typeof IconSun; label: string; labelKk: string }
> = {
  light: { Icon: IconSun, label: "Светлая", labelKk: "Жарық" },
  dark: { Icon: IconMoon, label: "Тёмная", labelKk: "Қараңғы" },
  system: { Icon: IconMonitor, label: "Как в системе", labelKk: "Жүйедегідей" },
};

/**
 * Переключатель темы. Обычная форма с server action: работает и без JS,
 * а тема сохраняется в cookie, поэтому переживает перезагрузку и новые вкладки.
 */
export function ThemeSwitcher({
  current,
  variant = "compact",
  locale = "ru",
}: {
  current: Theme;
  /** compact — три иконки в ряд, cards — крупные карточки для страницы настроек. */
  variant?: "compact" | "cards";
  locale?: string;
}) {
  if (variant === "cards") {
    return (
      <form action={setTheme} className="grid gap-3 sm:grid-cols-3">
        {THEMES.map((theme) => {
          const { Icon, label, labelKk } = OPTIONS[theme];
          const active = theme === current;
          return (
            <button
              key={theme}
              type="submit"
              name="theme"
              value={theme}
              aria-pressed={active}
              className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] ${
                active
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-tint)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)]"
              }`}
            >
              <span
                className={`grid size-10 place-items-center rounded-xl ${
                  active
                    ? "bg-[var(--color-brand)] text-[var(--color-on-brand)]"
                    : "bg-[var(--color-line-2)] text-[var(--color-muted)]"
                }`}
              >
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">
                {locale === "kk" ? labelKk : label}
              </span>
            </button>
          );
        })}
      </form>
    );
  }

  return (
    <form
      action={setTheme}
      className="flex rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-0.5"
    >
      {THEMES.map((theme) => {
        const { Icon, label, labelKk } = OPTIONS[theme];
        const active = theme === current;
        return (
          <button
            key={theme}
            type="submit"
            name="theme"
            value={theme}
            aria-pressed={active}
            title={locale === "kk" ? labelKk : label}
            className={`rounded-md p-1.5 transition-colors ${
              active
                ? "bg-[var(--color-brand)] text-[var(--color-on-brand)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-canvas)]"
            }`}
          >
            <Icon className="size-4" />
            <span className="sr-only">
              {locale === "kk" ? labelKk : label}
            </span>
          </button>
        );
      })}
    </form>
  );
}
