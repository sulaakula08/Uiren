import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { Empty, PageHeader, SectionHeader } from "@/components/ui";
import type { MessageKey } from "@/lib/i18n";
import { setJournal } from "./actions";
import { JoinCodeCard } from "./join-code-card";
import { UserForm } from "./user-form";

const JOURNALS = [
  ["KUNDELIK", "Kundelik"],
  ["BILIMCLASS", "BilimClass"],
  ["EDUMARK", "EduMark.kz"],
  ["NONE", "Без интеграции"],
] as const;

export default async function AdminPage() {
  const session = await requireRole("ADMIN");
  const { t } = await getT();

  if (!session.schoolId) return <Empty text="Аккаунт не привязан к школе." />;

  const [school, users, counts, subjects, classes] = await Promise.all([
    db.school.findUnique({ where: { id: session.schoolId } }),
    db.user.findMany({
      where: { schoolId: session.schoolId },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    }),
    db.user.groupBy({
      by: ["role"],
      where: { schoolId: session.schoolId },
      _count: { _all: true },
    }),
    db.subject.count({ where: { schoolId: session.schoolId } }),
    db.classGroup.count({ where: { schoolId: session.schoolId } }),
  ]);

  if (!school) return <Empty text="Школа не найдена." />;

  const setupIncomplete = subjects === 0 || classes === 0;

  return (
    <div>
      <PageHeader
        title={t("admin.title")}
        subtitle={`${school.name}, ${school.city}`}
      />

      {setupIncomplete && (
        <div className="animate-rise mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-warn)]/25 bg-[var(--color-warn-tint)] px-5 py-4">
          <div>
            <p className="font-medium text-[var(--color-warn)]">
              Настройка не завершена
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-warn)]/85">
              Пока нет {subjects === 0 ? "предметов" : "классов"} — учителя и
              ученики не смогут начать работу.
            </p>
          </div>
          <Link href="/admin/setup" className="btn-primary">
            Продолжить настройку
          </Link>
        </div>
      )}

      <JoinCodeCard code={school.joinCode} />

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="card py-4">
          <p className="overline">Предметы</p>
          <p className="mt-1.5 text-2xl font-semibold">{subjects}</p>
        </div>
        <div className="card py-4">
          <p className="overline">Классы</p>
          <p className="mt-1.5 text-2xl font-semibold">{classes}</p>
        </div>
        {counts
          .filter((c) => c.role !== "ADMIN")
          .slice(0, 2)
          .map((c) => (
            <div key={c.role} className="card py-4">
              <p className="overline">{t(`role.${c.role}` as MessageKey)}</p>
              <p className="mt-1.5 text-2xl font-semibold">{c._count._all}</p>
            </div>
          ))}
      </div>

      <section className="card mt-8">
        <SectionHeader
          title={t("admin.journal")}
          subtitle={t("admin.journalHint")}
        />
        <form action={setJournal} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <select
              name="journal"
              defaultValue={school.journal}
              className="input"
            >
              {JOURNALS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-ghost">
            {t("common.save")}
          </button>
        </form>
      </section>

      <section className="mt-8" data-tour="people">
        <SectionHeader
          title={t("nav.people")}
          subtitle="Все, кто присоединился по коду школы"
        />

        {users.length <= 1 ? (
          <Empty text="Пока в школе только вы. Отправьте код приглашения коллегам." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-canvas)] text-left">
                <tr className="text-xs tracking-wide text-[var(--color-muted)] uppercase">
                  <th className="px-4 py-2.5 font-medium">
                    {t("admin.fullName")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">{t("auth.email")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("admin.role")}</th>
                  <th className="px-4 py-2.5 font-medium">Язык</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-[var(--color-line-2)]"
                  >
                    <td className="px-4 py-2.5 font-medium">{user.fullName}</td>
                    <td className="px-4 py-2.5 text-[var(--color-muted)]">
                      {user.email}
                    </td>
                    <td className="px-4 py-2.5">
                      {t(`role.${user.role}` as MessageKey)}
                    </td>
                    <td className="px-4 py-2.5 uppercase">{user.locale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader
          title={t("admin.addUser")}
          subtitle="Обычно достаточно кода приглашения — этот способ на случай, если человеку нужен готовый аккаунт"
        />
        <UserForm />
      </section>
    </div>
  );
}
