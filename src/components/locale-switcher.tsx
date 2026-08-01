import { setLocale } from "@/app/actions";
import { LOCALES, type Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = { ru: "Рус", kk: "Қаз" };

export function LocaleSwitcher({ current }: { current: Locale }) {
  return (
    <form action={setLocale} className="flex rounded-lg border bg-[var(--color-surface)] p-0.5">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="submit"
          name="locale"
          value={locale}
          aria-current={locale === current}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            locale === current
              ? "bg-[var(--color-brand)] text-[var(--color-on-brand)]"
              : "text-[var(--color-muted)] hover:bg-[var(--color-canvas)]"
          }`}
        >
          {LABELS[locale]}
        </button>
      ))}
    </form>
  );
}
