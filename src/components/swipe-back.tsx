"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Насколько далеко от левого края начинается жест. */
const EDGE = 30;
/** Доля ширины экрана, после которой отпускание считается «назад». */
const THRESHOLD = 0.32;
/** Быстрый флик засчитывается и без порога, px/мс. */
const FLING = 0.45;

/**
 * Свайп от левого края — возврат на предыдущую страницу.
 *
 * Содержимое едет ровно за пальцем: во время жеста transition выключен и
 * позиция ставится напрямую из touchmove. Плавность появляется только при
 * отпускании — либо доводим до конца, либо возвращаем на место.
 *
 * Важно: этот блок трансформируется, поэтому внутри него не должно быть
 * position: fixed — нижняя панель навигации живёт снаружи.
 */
export function SwipeBack({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Только там, где есть касание: телефон, планшет, сенсорный ноутбук.
    // `any-pointer` вместо `pointer` — иначе ноутбук с мышью и тачскрином
    // считается «немым» и жест не включается.
    const touchCapable =
      window.matchMedia("(any-pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
    if (!touchCapable) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let dx = 0;
    let active = false;
    let decided = false;

    const setX = (x: number, animate: boolean) => {
      el.style.transition = animate
        ? "transform .28s cubic-bezier(.22,1,.36,1), opacity .28s ease"
        : "none";
      el.style.transform = x ? `translate3d(${x}px,0,0)` : "";
      // Лёгкое затемнение уходящей страницы — как в мобильных приложениях.
      el.style.opacity = x ? String(1 - Math.min(x / window.innerWidth, 1) * 0.3) : "";
    };

    const reset = () => {
      active = false;
      decided = false;
      dx = 0;
      setX(0, true);
      window.setTimeout(() => {
        if (!active) el.style.transition = "";
      }, 300);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.clientX > EDGE) return;
      if (window.history.length <= 1) return;

      startX = t.clientX;
      startY = t.clientY;
      startT = e.timeStamp;
      active = true;
      decided = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!active) return;
      const t = e.touches[0];
      const deltaX = t.clientX - startX;
      const deltaY = t.clientY - startY;

      // Первые пиксели решают, это горизонтальный жест или обычная прокрутка.
      if (!decided) {
        if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          active = false;
          return;
        }
        decided = true;
      }

      if (deltaX <= 0) {
        dx = 0;
        setX(0, false);
        return;
      }

      // Сопротивление у самого конца, чтобы жест не ощущался «пустым».
      dx = deltaX > window.innerWidth * 0.9 ? window.innerWidth * 0.9 : deltaX;
      e.preventDefault();
      setX(dx, false);
    };

    const onEnd = (e: TouchEvent) => {
      if (!active || !decided) {
        active = false;
        return;
      }
      const elapsed = Math.max(1, e.timeStamp - startT);
      const velocity = dx / elapsed;
      const passed = dx > window.innerWidth * THRESHOLD || velocity > FLING;

      if (passed) {
        setX(window.innerWidth, true);
        window.setTimeout(() => {
          router.back();
          // Стили снимаем после перехода, иначе новая страница приедет сдвинутой.
          window.setTimeout(() => {
            el.style.transition = "";
            el.style.transform = "";
            el.style.opacity = "";
          }, 60);
        }, 200);
        active = false;
        decided = false;
      } else {
        reset();
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", reset);
    };
  }, [router]);

  return (
    <div ref={ref} className="swipe-area">
      {children}
    </div>
  );
}
