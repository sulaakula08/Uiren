import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
import { Shell } from "@/components/shell";

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
      nav={[
        { href: "/director", label: t("nav.overview"), icon: "chart" },
        {
          href: "/director/teachers",
          label: t("director.teachers"),
          icon: "people",
          tourId: "nav-teachers",
        },
      ]}
    >
      {children}
    </Shell>
  );
}
