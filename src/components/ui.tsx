import type { ErrorNature } from "@prisma/client";
import type { MessageKey, Translator } from "@/lib/i18n";

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  Icon,
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "brand" | "warn";
  Icon?: (props: { className?: string }) => React.ReactNode;
  /** Сдвиг появления, чтобы карточки выезжали по очереди. */
  delay?: number;
}) {
  const valueTone =
    tone === "brand"
      ? "text-[var(--color-brand)]"
      : tone === "warn"
        ? "text-[var(--color-warn)]"
        : "text-[var(--color-ink)]";

  const iconTone =
    tone === "brand"
      ? "bg-[var(--color-brand-tint)] text-[var(--color-brand)]"
      : tone === "warn"
        ? "bg-[var(--color-warn-tint)] text-[var(--color-warn)]"
        : "bg-[var(--color-line-2)] text-[var(--color-muted)]";

  return (
    <div
      className="animate-rise card group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="overline">{label}</p>
        {Icon && (
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${iconTone}`}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p
        className={`mt-3 text-[34px] leading-none font-semibold tracking-tight tabular-nums ${valueTone}`}
      >
        {value}
      </p>
      {hint && <p className="mt-2.5 text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}

/** Цвет чипа сразу показывает, насколько ошибка серьёзная. */
const NATURE_STYLE: Record<ErrorNature, string> = {
  CORRECT: "bg-[var(--color-brand-tint)] text-[var(--color-brand)]",
  CONCEPT_GAP: "bg-[var(--color-danger-tint)] text-[var(--color-danger)]",
  CALCULATION: "bg-[var(--color-warn-tint)] text-[var(--color-warn)]",
  CARELESS: "bg-amber-50 text-amber-700",
  INCOMPLETE: "bg-orange-50 text-orange-700",
  NOT_ATTEMPTED: "bg-[var(--color-line-2)] text-[var(--color-muted)]",
  SUSPECTED_COPY: "bg-purple-50 text-purple-700",
};

export function NatureChip({
  nature,
  t,
}: {
  nature: ErrorNature;
  t: Translator;
}) {
  return (
    <span className={`chip ${NATURE_STYLE[nature]}`}>
      {t(`nature.${nature}` as MessageKey)}
    </span>
  );
}

export function Bar({ percent, tone }: { percent: number; tone?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const color =
    tone ??
    (clamped >= 70
      ? "bg-[var(--color-brand)]"
      : clamped >= 45
        ? "bg-amber-500"
        : "bg-[var(--color-danger)]");

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line-2)]">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/60 px-5 py-12 text-center">
      <p className="muted">{text}</p>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="h2">{title}</h2>
        {subtitle && <p className="muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="muted mt-1.5">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
