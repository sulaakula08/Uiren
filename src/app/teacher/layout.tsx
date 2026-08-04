import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
import { navFor } from "@/lib/nav";
import { Shell } from "@/components/shell";

/**
 * Проверка работ и генерация планов — это вызов модели с рассуждением, он
 * идёт десятки секунд. Со стандартным лимитом функции запрос обрывался на
 * середине, и учитель видел ошибку вместо разбора.
 */
export const maxDuration = 120;

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("TEACHER");
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
