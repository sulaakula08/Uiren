import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
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
      nav={[
        { href: "/teacher", label: t("nav.overview"), icon: "home" },
        {
          href: "/teacher/assignments",
          label: t("nav.assignments"),
          icon: "tasks",
          tourId: "nav-assignments",
        },
        {
          href: "/teacher/lessons",
          label: t("nav.lessons"),
          icon: "plan",
          tourId: "nav-lessons",
        },
        {
          href: "/teacher/messages",
          label: t("nav.messages"),
          icon: "mail",
          tourId: "nav-messages",
        },
      ]}
    >
      {children}
    </Shell>
  );
}
