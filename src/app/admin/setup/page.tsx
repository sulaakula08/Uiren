import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { Empty, PageHeader, SectionHeader } from "@/components/ui";
import { JournalForm } from "../journal-form";
import { UserForm } from "../user-form";
import { SetupWizard } from "./wizard";

export default async function SetupPage() {
  const session = await requireRole("ADMIN");
  const { t } = await getT();
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

      {/*
        Журнал и ручное создание аккаунта переехали сюда с главной панели.
        Оба нужны в лучшем случае один раз, а на панели занимали столько же
        места, сколько код приглашения и список людей — то, ради чего туда и
        заходят каждый день.
      */}
      <div className="mt-12 border-t border-[var(--color-line)] pt-8">
        <SectionHeader
          title="Остальное"
          subtitle="Настраивается один раз и дальше не нужно"
        />

        <div className="space-y-8">
          <div>
            <p className="mb-2 text-sm font-medium">{t("admin.journal")}</p>
            <JournalForm
              current={school.journal}
              saveLabel={t("common.save")}
            />
          </div>

          <div>
            <p className="text-sm font-medium">{t("admin.addUser")}</p>
            <p className="muted mt-0.5 mb-3 text-sm">
              Обычно достаточно кода приглашения — этот способ на случай, если
              человеку нужен готовый аккаунт
            </p>
            <UserForm />
          </div>
        </div>
      </div>
    </div>
  );
}
