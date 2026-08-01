import Link from "next/link";
import { IconPeople, IconPlan } from "@/components/icons";

const OPTIONS = [
  {
    href: "/register/school",
    Icon: IconPlan,
    title: "Я регистрирую школу",
    text: "Создать школу и стать её администратором. Получите код приглашения для коллег.",
    cta: "Создать школу",
  },
  {
    href: "/register/join",
    Icon: IconPeople,
    title: "У меня есть код школы",
    text: "Присоединиться как учитель, ученик или родитель. Код выдаёт администратор школы.",
    cta: "Ввести код",
  },
];

export default function RegisterChoicePage() {
  return (
    <div>
      <div className="animate-rise text-center">
        <h1 className="h1">Регистрация</h1>
        <p className="muted mt-1.5">Выберите, что вам ближе</p>
      </div>

      <div className="mt-7 space-y-3">
        {OPTIONS.map(({ href, Icon, title, text, cta }, i) => (
          <Link
            key={href}
            href={href}
            className="card-link animate-rise flex items-start gap-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-tint)] text-[var(--color-brand)]">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold">{title}</h2>
              <p className="muted mt-1">{text}</p>
              <span className="mt-2.5 inline-block text-sm font-medium text-[var(--color-brand)]">
                {cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="muted mt-6 text-center text-xs">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-[var(--color-brand)] hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
