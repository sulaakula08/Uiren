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

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        // Точное совпадение для корня раздела, префикс — для вложенных страниц.
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = NAV_ICONS[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={item.tourId}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
