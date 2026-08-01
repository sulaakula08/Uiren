import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
import { navFor } from "@/lib/nav";
import { Shell } from "@/components/shell";

/** Настройки доступны любой роли, поэтому меню собирается по роли из сессии. */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const [{ t, locale }, tourDone] = await Promise.all([
    getT(),
    isTourDone(session.userId),
  ]);

  return (
    <Shell
      session={session}
      t={t}
      locale={locale}
      tourDone={tourDone}
      nav={navFor(session.role, t)}
    >
      {children}
    </Shell>
  );
}
