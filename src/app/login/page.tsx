import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(HOME_BY_ROLE[session.role]);

  const { t, locale } = await getT();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-canvas)] px-5 py-10">
      <div className="animate-rise w-full max-w-[400px]">
        <Link
          href="/"
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="grid size-12 place-items-center rounded-2xl bg-[var(--color-brand)] text-lg font-semibold text-[var(--color-on-brand)] shadow-[var(--shadow-soft)]">
            U
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {t("app.name")}
          </h1>
          <p className="muted mt-1">{t("app.tagline")}</p>
        </Link>

        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="h2">{t("auth.title")}</h2>
            <LocaleSwitcher current={locale} />
          </div>

          <LoginForm
            labels={{
              email: t("auth.email"),
              password: t("auth.password"),
              submit: t("auth.submit"),
              error: t("auth.error"),
            }}
          />
        </div>

        <p className="muted mt-5 text-center text-sm">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-medium text-[var(--color-brand)] hover:underline"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}
