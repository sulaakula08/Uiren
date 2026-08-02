import Link from "next/link";
import { cookies } from "next/headers";
import type { SessionPayload } from "@/lib/session";
import type { Locale, MessageKey, Translator } from "@/lib/i18n";
import { DEFAULT_THEME, THEME_COOKIE, isTheme } from "@/lib/theme";
import { tourFor } from "@/lib/tour-steps";
import { AppShell, SIDEBAR_COOKIE, SidebarToggle } from "./app-shell";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { IconSettings } from "./icons";
import { Logo } from "./logo";
import { LogoutButton } from "./logout-button";
import { MobileNav } from "./mobile-nav";
import { NavLinks, type NavItem } from "./nav-links";
import { SwipeBack } from "./swipe-back";
import { Tour, TourButton } from "./tour";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function Shell({
  session,
  t,
  locale,
  nav,
  tourDone,
  children,
}: {
  session: SessionPayload;
  t: Translator;
  locale: Locale;
  nav: NavItem[];
  /** Тур уже пройден — тогда он запускается только по кнопке подсказки. */
  tourDone: boolean;
  children: React.ReactNode;
}) {
  const store = await cookies();
  const cookieTheme = store.get(THEME_COOKIE)?.value;
  const theme = isTheme(cookieTheme) ? cookieTheme : DEFAULT_THEME;
  const collapsed = store.get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <AppShell defaultCollapsed={collapsed}>
      {/* На телефоне разделы уехали вниз, поэтому боковая панель скрыта. */}
      <aside className="hidden flex-col gap-6 border-[var(--color-line)] bg-[var(--color-surface)] p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:border-r">
        <div className="sidebar-row flex items-center gap-2">
          <Link
            href="/"
            title={t("app.name")}
            className="logo-lockup sidebar-item flex min-w-0 flex-1 items-center gap-2.5 px-1"
          >
            <Logo className="size-9 shrink-0" title={t("app.name")} />
            <span className="sidebar-wide truncate text-[15px] font-semibold tracking-tight">
              {t("app.name")}
            </span>
          </Link>
          <SidebarToggle
            collapseLabel={t("nav.collapse")}
            expandLabel={t("nav.expand")}
          />
        </div>

        <NavLinks items={nav} />

        <div className="mt-auto space-y-3">
          <Link
            href="/settings"
            title={session.fullName}
            className="sidebar-item flex items-center gap-2.5 rounded-xl bg-[var(--color-canvas)] px-3 py-2.5 transition-colors hover:bg-[var(--color-brand-tint)]"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink-2)]">
              {initials(session.fullName)}
            </div>
            <div className="sidebar-wide min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session.fullName}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {t(`role.${session.role}` as MessageKey)}
              </p>
            </div>
            <IconSettings className="sidebar-wide size-4 shrink-0 text-[var(--color-muted)]" />
          </Link>

          <div className="sidebar-wide">
            <ThemeSwitcher current={theme} locale={locale} />
          </div>

          <div className="sidebar-row flex items-center gap-2">
            <TourButton label={t("tour.replay")} />
            <div className="sidebar-wide">
              <LocaleSwitcher current={locale} />
            </div>
            <LogoutButton
              label={t("nav.logout")}
              className="btn-ghost flex-1 px-2.5 py-2 text-xs"
              iconOnly
            />
          </div>
        </div>
      </aside>

      <div className="has-mobile-nav min-w-0">
        {/* Верхняя строка телефона: кто вошёл, тема и вход в настройки. */}
        {/* Подложка почти непрозрачная: размытие поверх прокрутки на телефоне
            стоит кадров, а разницы на глаз при такой заливке уже нет. */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
          <Link href="/" className="logo-lockup flex items-center gap-2">
            <Logo className="size-7" title={t("app.name")} />
            <span className="text-[15px] font-semibold tracking-tight">
              {t("app.name")}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher current={theme} locale={locale} />
            <Link
              href="/settings"
              className="btn-ghost px-2.5 py-2"
              title="Настройки"
            >
              <IconSettings className="size-4" />
            </Link>
          </div>
        </div>

        <SwipeBack>
          <main className="mx-auto max-w-5xl p-5 lg:p-8">{children}</main>
        </SwipeBack>
      </div>

      {/* Панель вне SwipeBack: внутри трансформируемого блока fixed ломается. */}
      <MobileNav items={nav} />

      <Tour steps={tourFor(session.role)} autoStart={!tourDone} />
    </AppShell>
  );
}
