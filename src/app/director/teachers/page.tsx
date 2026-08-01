import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { Bar, Empty } from "@/components/ui";

export default async function TeachersPage() {
  const session = await requireRole("DIRECTOR");
  const { t } = await getT();

  if (!session.schoolId) return <Empty text="Аккаунт не привязан к школе." />;

  const teachers = await db.user.findMany({
    where: { schoolId: session.schoolId, role: "TEACHER" },
    orderBy: { fullName: "asc" },
    include: {
      assignments: { include: { subject: true, class: true } },
      createdWork: { select: { id: true } },
    },
  });

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const rows = await Promise.all(
    teachers.map(async (teacher) => {
      const [logs, findings, reviewed] = await Promise.all([
        db.aiLog.aggregate({
          where: { userId: teacher.id, ok: true, createdAt: { gte: since } },
          _sum: { minutesSaved: true },
          _count: { _all: true },
        }),
        db.finding.findMany({
          where: { submission: { assignment: { authorId: teacher.id } } },
          select: { points: true, maxPoints: true },
        }),
        db.submission.count({
          where: {
            assignment: { authorId: teacher.id },
            status: { in: ["AI_REVIEWED", "TEACHER_APPROVED"] },
          },
        }),
      ]);

      const possible = findings.reduce((sum, f) => sum + f.maxPoints, 0);
      const earned = findings.reduce((sum, f) => sum + f.points, 0);

      return {
        teacher,
        hours: Math.round(((logs._sum.minutesSaved ?? 0) / 60) * 10) / 10,
        operations: logs._count._all,
        reviewed,
        mastery: possible === 0 ? null : Math.round((earned / possible) * 100),
      };
    }),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h1">{t("director.teachers")}</h1>
        <p className="muted mt-1.5">
          Активность в системе и динамика классов
        </p>
      </header>

      {rows.length === 0 ? (
        <Empty text={t("common.empty")} />
      ) : (
        <div className="space-y-3">
          {rows.map(({ teacher, hours, operations, reviewed, mastery }) => (
            <div key={teacher.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{teacher.fullName}</p>
                  <p className="muted mt-0.5 text-xs">
                    {[
                      ...new Set(
                        teacher.assignments.map((a) => a.subject.name),
                      ),
                    ].join(", ") || "предмет не назначен"}
                    {" · "}
                    {[
                      ...new Set(teacher.assignments.map((a) => a.class.name)),
                    ].join(", ") || "классы не назначены"}
                  </p>
                </div>

                <div className="flex gap-6 text-right">
                  <div>
                    <p className="label mb-0.5">Часов</p>
                    <p className="text-lg font-semibold text-[var(--color-brand)]">
                      {hours}
                    </p>
                  </div>
                  <div>
                    <p className="label mb-0.5">Операций</p>
                    <p className="text-lg font-semibold">{operations}</p>
                  </div>
                  <div>
                    <p className="label mb-0.5">Проверено</p>
                    <p className="text-lg font-semibold">{reviewed}</p>
                  </div>
                </div>
              </div>

              {mastery !== null && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="muted">Усвоение в классах учителя</span>
                    <span className="font-medium">{mastery}%</span>
                  </div>
                  <Bar percent={mastery} />
                </div>
              )}

              {operations === 0 && (
                <p className="mt-3 rounded-xl bg-[var(--color-warn-tint)] px-3 py-2 text-xs text-[var(--color-warn)]">
                  Пока не пользуется системой
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
