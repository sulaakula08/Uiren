import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";

export default async function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect(HOME_BY_ROLE[session.role]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)]">
      <header className="border-b border-[var(--color-line)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-[var(--color-brand)] text-sm font-semibold text-white">
              U
            </div>
            <span className="font-semibold tracking-tight">Uiren</span>
          </Link>
          <Link href="/login" className="btn-ghost">
            Войти
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
