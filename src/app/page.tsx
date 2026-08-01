import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";
import {
  IconChart,
  IconChat,
  IconChild,
  IconPlan,
  IconTasks,
} from "@/components/icons";

const ROLES = [
  {
    Icon: IconTasks,
    title: "Учителю",
    text: "Составить задание по теме, проверить сданные работы и увидеть, где именно класс не понял материал.",
  },
  {
    Icon: IconChat,
    title: "Ученику",
    text: "Сдавать работы, видеть разбор своих ошибок и спрашивать тьютора, который знает вашу программу.",
  },
  {
    Icon: IconChart,
    title: "Директору",
    text: "Динамика по предметам и классам, активность учителей, прогноз результатов ЕНТ.",
  },
  {
    Icon: IconChild,
    title: "Родителю",
    text: "Оценки ребёнка, над чем ему стоит поработать, и сообщения от учителей.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Учитель создаёт задание",
    text: "Пишет тему — платформа предлагает готовые задания. Их можно исправить или написать свои.",
  },
  {
    n: "2",
    title: "Ученики сдают работы",
    text: "Каждый решает у себя в кабинете и записывает ход решения, а не только ответ.",
  },
  {
    n: "3",
    title: "Проверка за одно нажатие",
    text: "Работы проверяются автоматически: балл, комментарий ученику и причина каждой ошибки.",
  },
  {
    n: "4",
    title: "Понятно, что делать дальше",
    text: "Учитель видит разбор класса и план на следующий урок, ученик — свои пробелы, директор — картину по школе.",
  },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect(HOME_BY_ROLE[session.role]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-[var(--color-brand)] text-sm font-semibold text-white">
              U
            </div>
            <span className="font-semibold tracking-tight">Uiren</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Войти
            </Link>
            <Link href="/register" className="btn-primary">
              Начать
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Обещание в одном экране: что это и для кого */}
        <section className="mx-auto max-w-5xl px-5 pt-16 pb-14 text-center sm:pt-24">
          <p className="animate-fade overline">Школьная платформа</p>
          <h1 className="animate-rise mx-auto mt-4 max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-[52px]">
            Проверяет работы и показывает, чего класс{" "}
            <span className="text-[var(--color-brand)]">не понял</span>
          </h1>
          <p
            className="animate-rise muted mx-auto mt-5 max-w-xl text-base text-balance"
            style={{ animationDelay: "90ms" }}
          >
            Uiren берёт на себя проверку домашних работ, планы уроков и отчёты.
            Учитель получает время и понятную картину класса, ученик — разбор
            своих ошибок.
          </p>

          <div
            className="animate-rise mt-8 flex flex-wrap justify-center gap-3"
            style={{ animationDelay: "180ms" }}
          >
            <Link href="/register/school" className="btn-primary px-5 py-3">
              Зарегистрировать школу
            </Link>
            <Link href="/register/join" className="btn-ghost px-5 py-3">
              У меня есть код школы
            </Link>
          </div>

          <p
            className="animate-fade mt-4 text-xs text-[var(--color-muted)]"
            style={{ animationDelay: "260ms" }}
          >
            Регистрация занимает минуту. Обучение встроено в интерфейс.
          </p>
        </section>

        {/* Кому и зачем */}
        <section className="border-y border-[var(--color-line)] bg-[var(--color-canvas)]">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <h2 className="text-center text-2xl font-semibold tracking-tight">
              Одна платформа для всей школы
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ROLES.map(({ Icon, title, text }, i) => (
                <div
                  key={title}
                  className="animate-rise card"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-tint)] text-[var(--color-brand)]">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-3.5 font-semibold">{title}</h3>
                  <p className="muted mt-1.5">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Как это работает — четыре шага */}
        <section className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Как это работает
          </h2>
          <p className="muted mt-2 text-center">
            Четыре шага — от задания до понятного вывода
          </p>

          <ol className="relative mt-10 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-[var(--color-line)]">
            {STEPS.map((step, i) => (
              <li
                key={step.n}
                className="animate-rise relative flex gap-5"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="z-[1] grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-white text-sm font-semibold text-[var(--color-brand)]">
                  {step.n}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="muted mt-1">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Что делает платформу понятной с первого входа */}
        <section className="border-t border-[var(--color-line)] bg-[var(--color-canvas)]">
          <div className="mx-auto grid max-w-5xl gap-4 px-5 py-14 sm:grid-cols-3">
            {[
              {
                Icon: IconPlan,
                title: "Пошаговая настройка",
                text: "После регистрации мастер проведёт по предметам, классам и приглашению учителей.",
              },
              {
                Icon: IconChat,
                title: "Обучающий тур",
                text: "При первом входе платформа сама покажет, куда нажимать. Тур можно повторить в любой момент.",
              },
              {
                Icon: IconChild,
                title: "Русский и казахский",
                text: "Интерфейс переключается одной кнопкой, тексты платформа готовит на выбранном языке.",
              },
            ].map(({ Icon, title, text }, i) => (
              <div
                key={title}
                className="animate-rise"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <Icon className="size-5 text-[var(--color-brand)]" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="muted mt-1.5">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Начните со своей школы
          </h2>
          <p className="muted mx-auto mt-2 max-w-md">
            Создайте школу, получите код приглашения и раздайте его коллегам,
            ученикам и родителям.
          </p>
          <Link
            href="/register/school"
            className="btn-primary mt-6 px-5 py-3"
          >
            Зарегистрировать школу
          </Link>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-[var(--color-muted)]">
          <span>Uiren — школьная платформа</span>
          <Link href="/login" className="hover:text-[var(--color-ink)]">
            Вход для зарегистрированных
          </Link>
        </div>
      </footer>
    </div>
  );
}
