import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Empty, PageHeader } from "@/components/ui";
import { TeachingPicker } from "./picker";

export default async function TeacherSetupPage() {
  const session = await requireRole("TEACHER");
  if (!session.schoolId) return <Empty text="Аккаунт не привязан к школе." />;

  const [subjects, classes, current] = await Promise.all([
    db.subject.findMany({
      where: { schoolId: session.schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.classGroup.findMany({
      where: { schoolId: session.schoolId },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    db.teacherAssignment.findMany({
      where: { teacherId: session.userId },
      select: { subjectId: true, classId: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Что вы преподаёте"
        subtitle="Отметьте предметы и классы — от этого зависит, что вы увидите в заданиях и планах уроков"
      />

      <TeachingPicker
        subjects={subjects}
        classes={classes}
        initialSubjectIds={[...new Set(current.map((x) => x.subjectId))]}
        initialClassIds={[...new Set(current.map((x) => x.classId))]}
      />
    </div>
  );
}
