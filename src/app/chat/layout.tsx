import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
import { navFor } from "@/lib/nav";
import { Shell } from "@/components/shell";

/** Переписка доступна учителю, ученику и родителю — меню собирается по роли. */
export default async function ChatLayout({
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
