"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICONS } from "./icons";
import { activeHref, type NavItem } from "./nav-links";

/**
 * Нижняя панель навигации для телефона.
 *
 * Наверху разделы были горизонтальным списком с прокруткой — до них далеко
 * тянуться большим пальцем, и активный раздел мог оказаться за краем экрана.
 * Внизу всё в зоне пальца, а подсветка активного пункта переезжает плавно.
 */
export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const current = activeHref(pathname, items);

  return (
    <nav className="mobile-nav lg:hidden">
      {items.map((item) => {
        const active = item.href === current;
        const Icon = NAV_ICONS[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="mobile-nav-item"
            data-active={active}
          >
            <span className="mobile-nav-icon">
              <Icon className="size-[22px]" />
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
