import Link from "next/link";
import { JoinForm } from "./form";

export default function RegisterJoinPage() {
  return (
    <div className="animate-rise">
      <Link
        href="/register"
        className="text-xs text-[var(--color-muted)] hover:underline"
      >
        ← Назад
      </Link>

      <div className="mt-2 mb-6">
        <h1 className="h1">Присоединиться к школе</h1>
        <p className="muted mt-1.5">
          Код из шести символов выдаёт администратор школы
        </p>
      </div>

      <JoinForm />
    </div>
  );
}
