import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { isTourDone } from "@/lib/tour";
import { Shell } from "@/components/shell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("STUDENT");
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
        { href: "/student", label: t("nav.overview"), icon: "home" },
        {
          href: "/student/tutor",
          label: t("nav.tutor"),
          icon: "chat",
          tourId: "nav-tutor",
        },
      ]}
    >
      {children}
    </Shell>
  );
}
