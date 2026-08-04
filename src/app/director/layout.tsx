import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
import { navFor } from "@/lib/nav";
import { Shell } from "@/components/shell";

/** Прогноз ЕНТ — тот же долгий вызов модели, что и проверка работ у учителя. */
export const maxDuration = 120;

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("DIRECTOR");
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
