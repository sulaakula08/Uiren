import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
import { Shell } from "@/components/shell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("PARENT");
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
      nav={[{ href: "/parent", label: t("nav.children"), icon: "child" }]}
    >
      {children}
    </Shell>
  );
}
