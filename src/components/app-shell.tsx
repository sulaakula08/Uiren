"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { IconSidebar } from "./icons";

/** Cookie со свёрнутым меню читается на сервере — панель не «прыгает» при загрузке. */
export const SIDEBAR_COOKIE = "uiren_sidebar";

const MAX_AGE = 60 * 60 * 24 * 365;

const SidebarContext = createContext<{
  collapsed: boolean;
  toggle: () => void;
} | null>(null);

/**
 * Каркас страницы: держит состояние боковой панели и отдаёт его в CSS через
 * data-атрибут. Само меню остаётся серверным — сюда оно приходит как children.
 */
export function AppShell({
  defaultCollapsed,
  children,
}: {
  defaultCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      // Пишем cookie прямо из браузера: перерисовка с сервера ради переключателя
      // интерфейса была бы заметно медленнее самого переключения.
      document.cookie = `${SIDEBAR_COOKIE}=${
        next ? "1" : "0"
      }; path=/; max-age=${MAX_AGE}; samesite=lax`;
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div
        className="app-shell min-h-screen"
        data-collapsed={collapsed ? "true" : "false"}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

/** Кнопка сворачивания. Живёт внутри панели, поэтому доступна в обоих состояниях. */
export function SidebarToggle({
  collapseLabel,
  expandLabel,
}: {
  collapseLabel: string;
  expandLabel: string;
}) {
  const context = useContext(SidebarContext);
  if (!context) return null;

  const { collapsed, toggle } = context;
  const label = collapsed ? expandLabel : collapseLabel;

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      aria-expanded={!collapsed}
      className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
    >
      <IconSidebar
        className={`size-4 transition-transform duration-300 ${
          collapsed ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}
