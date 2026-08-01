import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Empty, PageHeader } from "@/components/ui";
import { SetupWizard } from "./wizard";

export default async function SetupPage() {
  const session = await requireRole("ADMIN");
  if (!session.schoolId) return <Empty text="Аккаунт не привязан к школе." />;

  const school = await db.school.findUnique({
    where: { id: session.schoolId },
    include: {
      subjects: { orderBy: { name: "asc" }, select: { id: true, name: true } },
      classGroups: {
        orderBy: [{ grade: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      },
    },
  });

  if (!school) return <Empty text="Школа не найдена." />;

  return (
    <div>
      <PageHeader
        title="Настройка школы"
        subtitle={`${school.name}, ${school.city} — три шага, чтобы начать работу`}
      />

      <SetupWizard
        initialStep={school.setupStep}
        subjects={school.subjects}
        classes={school.classGroups}
        joinCode={school.joinCode}
        schoolName={school.name}
      />
    </div>
  );
}
