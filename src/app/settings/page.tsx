import { cookies } from "next/headers";
import Link from "next/link";
import { requireUser, HOME_BY_ROLE } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/locale";
import { DEFAULT_THEME, THEME_COOKIE, isTheme } from "@/lib/theme";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { PageHeader } from "@/components/ui";
import {
  IconChild,
  IconLogout,
  IconPalette,
  IconShield,
} from "@/components/icons";
import { logout } from "@/app/actions";
import { replayTour } from "./actions";
import { PasswordForm, ProfileForm } from "./forms";

/** Раздел настроек: заголовок с иконкой слева, содержимое справа. */
function Section({
  Icon,
  title,
  subtitle,
  children,
}: {
  Icon: typeof IconPalette;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-rise border-t border-[var(--color-line)] pt-8 first:border-0 first:pt-0">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-tint)] text-[var(--color-brand)]">
              <Icon className="size-[18px]" />
            </span>
            <h2 className="text-[17px] font-semibold tracking-tight">
              {title}
            </h2>
          </div>
          <p className="muted mt-2">{subtitle}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export default async function SettingsPage() {
  const session = await requireUser();
  const { t } = await getT();

  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      email: true,
      fullName: true,
      locale: true,
      createdAt: true,
      school: { select: { name: true, city: true, joinCode: true } },
    },
  });
  if (!user) return null;

  const joined = user.createdAt.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Настройки"
        subtitle="Профиль, внешний вид и безопасность аккаунта"
        action={
          <Link href={HOME_BY_ROLE[session.role]} className="btn-ghost">
            ← Назад
          </Link>
        }
      />

      <div className="space-y-8">
        <Section
          Icon={IconChild}
          title="Профиль"
          subtitle="Как вас видят коллеги, ученики и родители"
        >
          <ProfileForm
            fullName={user.fullName}
            email={user.email}
            locale={user.locale}
          />
        </Section>

        <Section
          Icon={IconPalette}
          title="Внешний вид"
          subtitle="Тема применяется сразу и запоминается на этом устройстве"
        >
          <ThemeSwitcher
            current={theme}
            variant="cards"
            locale={user.locale}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Обучающий тур</p>
              <p className="muted mt-0.5">
                Пройти подсказки по интерфейсу заново
              </p>
            </div>
            <form action={replayTour}>
              <button type="submit" className="btn-ghost">
                Показать снова
              </button>
            </form>
          </div>
        </Section>

        <Section
          Icon={IconShield}
          title="Безопасность"
          subtitle="Смена пароля требует подтверждения текущим"
        >
          <PasswordForm />
        </Section>

        <Section
          Icon={IconLogout}
          title="Аккаунт"
          subtitle="Данные вашей учётной записи в школе"
        >
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2">
            {[
              { k: "Роль", v: t(`role.${session.role}`) },
              { k: "Школа", v: user.school?.name ?? "—" },
              { k: "Город", v: user.school?.city ?? "—" },
              { k: "В платформе с", v: joined },
            ].map(({ k, v }) => (
              <div key={k} className="bg-[var(--color-surface)] px-4 py-3.5">
                <dt className="text-xs text-[var(--color-muted)]">{k}</dt>
                <dd className="mt-1 text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <form action={logout} className="mt-4">
            <button type="submit" className="btn-danger">
              <IconLogout className="size-4" />
              Выйти из аккаунта
            </button>
          </form>
        </Section>
      </div>
    </div>
  );
}
