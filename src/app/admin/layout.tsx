import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
import { Shell } from "@/components/shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("ADMIN");
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
        { href: "/admin", label: t("nav.school"), icon: "home" },
        {
          href: "/admin/setup",
          label: "Настройка",
          icon: "plan",
          tourId: "setup",
        },
      ]}
    >
      {children}
    </Shell>
  );
}
