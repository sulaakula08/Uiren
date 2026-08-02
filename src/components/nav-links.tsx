"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICONS, type NavIconName } from "./icons";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  /** Якорь для обучающего тура. */
  tourId?: string;
};

/**
 * Какой пункт меню считать активным.
 *
 * Простая проверка «путь начинается с href» подсвечивала сразу два пункта:
 * на /student/tutor под неё попадали и «Обзор» (/student), и сам тьютор.
 * Побеждает самое длинное совпадение — то есть самый конкретный раздел.
 */
export function activeHref(pathname: string, items: NavItem[]): string | null {
  const matched = items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matched.length === 0) return null;
  return matched.reduce((best, item) =>
    item.href.length > best.href.length ? item : best,
  ).href;
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const current = activeHref(pathname, items);

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = item.href === current;
        const Icon = NAV_ICONS[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={item.tourId}
            aria-current={active ? "page" : undefined}
            title={item.label}
            className={`sidebar-item flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--color-brand-tint)] text-[var(--color-brand)]"
                : "text-[var(--color-ink-2)] hover:bg-[var(--color-canvas)]"
            }`}
          >
            <Icon
              className={
                active
                  ? "text-[var(--color-brand)]"
                  : "text-[var(--color-muted)]"
              }
            />
            {/* В свёрнутой панели остаются только иконки — подпись прячет CSS. */}
            <span className="sidebar-wide truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
