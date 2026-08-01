import Link from "next/link";
import { logout } from "@/app/actions";
import type { SessionPayload } from "@/lib/session";
import type { Locale, MessageKey, Translator } from "@/lib/i18n";
import { tourFor } from "@/lib/tour-steps";
import { LocaleSwitcher } from "./locale-switcher";
import { IconLogout } from "./icons";
import { NavLinks, type NavItem } from "./nav-links";
import { Tour, TourButton } from "./tour";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Shell({
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
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-[var(--color-line)] bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <Link href="/" className="flex items-center gap-2.5 px-1">
          <div className="grid size-9 place-items-center rounded-xl bg-[var(--color-brand)] text-sm font-semibold text-white">
            U
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            {t("app.name")}
          </span>
        </Link>

        <NavLinks items={nav} />

        <div className="mt-auto hidden space-y-3 lg:block">
          <div className="flex items-center gap-2.5 rounded-xl bg-[var(--color-canvas)] px-3 py-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-[var(--color-ink-2)]">
              {initials(session.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{session.fullName}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {t(`role.${session.role}` as MessageKey)}
              </p>
            </div>
          </div>

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
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white px-4 py-2.5 lg:hidden">
          <span className="text-sm font-medium">{session.fullName}</span>
          <div className="flex items-center gap-2">
            <TourButton label={t("tour.replay")} />
            <LocaleSwitcher current={locale} />
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
