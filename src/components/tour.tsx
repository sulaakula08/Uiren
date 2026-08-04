"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { markTourDone } from "@/app/tour-actions";
import type { TourStep } from "@/lib/tour-steps";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const CARD_W = 340;
const GAP = 14;

/**
 * Экраны, где тур не запускается сам.
 *
 * Это пошаговые мастера — они уже ведут человека за руку, и приветственная
 * карточка поверх них только мешает: первое нажатие уходит в закрытие тура,
 * а не в предмет или класс, который человек пытался добавить.
 */
const NO_AUTOSTART = ["/admin/setup", "/teacher/setup", "/register"];

function readRect(target: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Обучающий тур: затемняет экран, вырезает подсвеченный элемент
 * и ведёт пользователя по шагам. Шаги с отсутствующим элементом
 * пропускаются автоматически — тур не упирается в пустой экран.
 */
export function Tour({
  steps,
  autoStart,
}: {
  steps: TourStep[];
  autoStart: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const pathname = usePathname();

  // Небольшая задержка перед автозапуском: страница успевает отрисоваться,
  // и подсветка сразу встаёт на место, а не прыгает.
  useEffect(() => {
    if (!autoStart) return;
    if (NO_AUTOSTART.some((path) => pathname.startsWith(path))) return;
    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, [autoStart, pathname]);

  useEffect(() => {
    const onOpen = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener("uiren:tour", onOpen);
    return () => window.removeEventListener("uiren:tour", onOpen);
  }, []);

  const step = steps[index];

  const sync = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    setRect(readRect(step.target));
  }, [step]);

  // Пропускаем шаги, чей элемент отсутствует на текущей странице.
  useEffect(() => {
    if (!open || !step) return;
    if (!step.target) {
      setRect(null);
      return;
    }

    const el = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    );
    if (!el) {
      if (index < steps.length - 1) setIndex((i) => i + 1);
      else finish();
      return;
    }

    // Ставим подсветку сразу, иначе один шаг она показывает прошлый элемент.
    setRect(readRect(step.target));
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // И уточняем после прокрутки — координаты к этому моменту уже конечные.
    const timer = setTimeout(sync, 320);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, step, steps.length, sync]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [open, sync]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  function finish() {
    setOpen(false);
    setIndex(0);
    void markTourDone();
  }

  function next() {
    if (index < steps.length - 1) setIndex((i) => i + 1);
    else finish();
  }

  if (!open || !step) return null;

  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;

  // Карточка под элементом, а если снизу не помещается — над ним.
  let cardTop = vh / 2 - 110;
  let cardLeft = vw / 2 - CARD_W / 2;

  if (rect) {
    const below = rect.top + rect.height + GAP;
    const fitsBelow = below + 210 < vh;
    cardTop = fitsBelow ? below : Math.max(GAP, rect.top - 210 - GAP);
    cardLeft = Math.min(
      Math.max(GAP, rect.left + rect.width / 2 - CARD_W / 2),
      vw - CARD_W - GAP,
    );
  }

  // Затемнение — четыре панели вокруг подсвеченного элемента, а не одна на
  // весь экран. Раньше поверх подсветки лежала кнопка закрытия во весь экран:
  // первое нажатие по подсвеченному элементу уходило в закрытие тура вместо
  // самого действия, и элемент выглядел «неработающим».
  const shade: React.CSSProperties[] = rect
    ? [
        { top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD) },
        { top: rect.top + rect.height + PAD, left: 0, right: 0, bottom: 0 },
        {
          top: rect.top - PAD,
          left: 0,
          width: Math.max(0, rect.left - PAD),
          height: rect.height + PAD * 2,
        },
        {
          top: rect.top - PAD,
          left: rect.left + rect.width + PAD,
          right: 0,
          height: rect.height + PAD * 2,
        },
      ]
    : [{ inset: 0 }];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
    >
      {shade.map((style, i) => (
        <button
          key={i}
          type="button"
          aria-label="Закрыть тур"
          tabIndex={i === 0 ? 0 : -1}
          className="animate-fade pointer-events-auto fixed cursor-default bg-[rgb(16_24_40_/_0.6)]"
          style={style}
          onClick={finish}
        />
      ))}

      {rect && (
        <div
          className="tour-halo pointer-events-none fixed rounded-xl transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      <div
        key={index}
        className="tour-card pointer-events-auto fixed rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_12px_40px_rgb(16_24_40_/_0.22)]"
        style={{ top: cardTop, left: cardLeft, width: CARD_W }}
      >
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium text-[var(--color-muted)] tabular-nums">
            {index + 1} из {steps.length}
          </span>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-5 bg-[var(--color-brand)]"
                  : i < index
                    ? "w-1.5 bg-[var(--color-brand)]/40"
                    : "w-1.5 bg-[var(--color-line)]"
              }`}
            />
            ))}
          </div>
        </div>

        <h3 className="text-[15px] font-semibold tracking-tight">
          {step.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-2)]">
          {step.text}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            onClick={finish}
          >
            Пропустить
          </button>

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                className="btn-ghost px-3 py-1.5 text-xs"
                onClick={() => setIndex((i) => i - 1)}
              >
                Назад
              </button>
            )}
            <button
              type="button"
              className="btn-primary px-3.5 py-1.5 text-xs"
              onClick={next}
            >
              {index === steps.length - 1 ? "Понятно" : "Далее"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Кнопка повторного запуска тура — живёт в боковой панели. */
export function TourButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      data-tour="help"
      title={label}
      aria-label={label}
      className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
      onClick={() => window.dispatchEvent(new Event("uiren:tour"))}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        className="size-4"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.4" />
        <path d="M12 16.6h.01" />
      </svg>
    </button>
  );
}
