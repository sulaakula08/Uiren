import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";
import { readPendingProfile } from "@/lib/google-pending";
import { GoogleSignupForm } from "./form";

export default async function GoogleRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(HOME_BY_ROLE[session.role]);

  const { t } = await searchParams;
  const profile = await readPendingProfile(t);

  if (!profile) {
    return (
      <div className="card p-6 text-center">
        <h1 className="h1">Ссылка устарела</h1>
        <p className="muted mx-auto mt-2 max-w-sm">
          Подтверждение от Google действует 15 минут. Вернитесь на страницу
          входа и нажмите кнопку ещё раз.
        </p>
        <Link href="/login" className="btn-primary mt-6">
          На страницу входа
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <Link href="/login" className="muted mb-4 inline-block text-sm">
        ← Назад
      </Link>
      <h1 className="h1">Ещё один шаг</h1>
      <p className="muted mt-1.5 mb-6">
        Google подтвердил, кто вы. Осталось указать школу и вашу роль в ней.
      </p>

      <div className="card p-6">
        <GoogleSignupForm
          token={t!}
          email={profile.email}
          fullName={profile.fullName}
          defaultJoinCode={process.env.UIREN_DEV_SCHOOL_CODE}
        />
      </div>
    </div>
  );
}
