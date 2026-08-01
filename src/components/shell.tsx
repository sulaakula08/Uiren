import Link from "next/link";
import { cookies } from "next/headers";
import { logout } from "@/app/actions";
import type { SessionPayload } from "@/lib/session";
import type { Locale, MessageKey, Translator } from "@/lib/i18n";
import { DEFAULT_THEME, THEME_COOKIE, isTheme } from "@/lib/theme";
import { tourFor } from "@/lib/tour-steps";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { IconLogout, IconSettings } from "./icons";
import { Logo } from "./logo";
import { NavLinks, type NavItem } from "./nav-links";
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
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-[var(--color-line)] bg-[var(--color-surface)] p-4 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <Link href="/" className="logo-lockup flex items-center gap-2.5 px-1">
          <Logo className="size-9" title={t("app.name")} />
          <span className="text-[15px] font-semibold tracking-tight">
            {t("app.name")}
          </span>
        </Link>

        <NavLinks items={nav} />

        <div className="mt-auto hidden space-y-3 lg:block">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-xl bg-[var(--color-canvas)] px-3 py-2.5 transition-colors hover:bg-[var(--color-brand-tint)]"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink-2)]">
              {initials(session.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session.fullName}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {t(`role.${session.role}` as MessageKey)}
              </p>
            </div>
            <IconSettings className="size-4 shrink-0 text-[var(--color-muted)]" />
          </Link>

          <ThemeSwitcher current={theme} locale={locale} />

          <div className="flex items-center gap-2">
            <TourButton label={t("tour.replay")} />
            <LocaleSwitcher current={locale} />
            <form action={logout} className="flex-1">
              <button
                type="submit"
                className="btn-ghost w-full px-2.5 py-2 text-xs"
                title={t("nav.logout")}
              >
                <IconLogout className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 lg:hidden">
          <span className="text-sm font-medium">{session.fullName}</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher current={theme} locale={locale} />
            <Link
              href="/settings"
              className="btn-ghost px-2.5 py-2"
              title="Настройки"
            >
              <IconSettings className="size-4" />
            </Link>
            <form action={logout}>
              <button type="submit" className="btn-ghost px-3 py-2 text-xs">
                {t("nav.logout")}
              </button>
            </form>
          </div>
        </div>

        <main className="mx-auto max-w-5xl p-5 lg:p-8">{children}</main>
      </div>

      <Tour steps={tourFor(session.role)} autoStart={!tourDone} />
    </div>
  );
}
