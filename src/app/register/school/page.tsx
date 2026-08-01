import Link from "next/link";
import { SchoolForm } from "./form";

export default function RegisterSchoolPage() {
  return (
    <div className="animate-rise">
      <Link
        href="/register"
        className="text-xs text-[var(--color-muted)] hover:underline"
      >
        ← Назад
      </Link>

      <div className="mt-2 mb-6">
        <h1 className="h1">Регистрация школы</h1>
        <p className="muted mt-1.5">
          Вы станете администратором и получите код приглашения для коллег
        </p>
      </div>

      <SchoolForm />
    </div>
  );
}
