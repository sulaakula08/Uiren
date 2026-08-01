import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";
import { Reveal } from "@/components/reveal";
import { LandingPreview } from "@/components/landing-preview";
import {
  IconChart,
  IconChat,
  IconChild,
  IconPlan,
  IconSpark,
  IconTasks,
} from "@/components/icons";

const ROLES = [
  {
    Icon: IconTasks,
    title: "Учителю",
    text: "Задание по теме — за минуту. Проверка всего класса — в одно нажатие. И готовый ответ на вопрос «что разбирать завтра».",
  },
  {
    Icon: IconChat,
    title: "Ученику",
    text: "Не просто «4» или «2», а объяснение, где сломалась мысль. И тьютор, который знает вашу тему и не решает за вас.",
  },
  {
    Icon: IconChart,
    title: "Директору",
    text: "Динамика по предметам и классам, активность учителей и прогноз ЕНТ — без сбора отчётов вручную.",
  },
  {
    Icon: IconChild,
    title: "Родителю",
    text: "Что у ребёнка получается, что проседает и что говорит учитель — на одной странице, без родительских чатов.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Учитель задаёт тему",
    text: "Пишет «квадратные уравнения, 8 класс» — платформа предлагает готовые задания. Оставить, поправить или написать своё.",
  },
  {
    n: "2",
    title: "Ученики решают у себя",
    text: "Каждый работает в своём кабинете и записывает ход решения, а не только ответ. Именно ход и делает проверку осмысленной.",
  },
  {
    n: "3",
    title: "Проверка идёт сама",
    text: "Балл, комментарий ученику и причина каждой ошибки: пробел в понимании, арифметика, невнимательность или списывание.",
  },
  {
    n: "4",
    title: "Понятно, что делать дальше",
    text: "Учитель видит разбор класса и план следующего урока. Ученик — свои пробелы. Директор — картину по школе.",
  },
];

const BEFORE = [
  "Стопка тетрадей на выходные",
  "«Класс написал плохо» — а почему, непонятно",
  "Отчёты собираются вручную под конец четверти",
  "Родители узнают об оценках последними",
];

const AFTER = [
  "Проверка занимает время одной чашки чая",
  "Видно конкретную тему, где посыпался класс",
  "Отчёт по школе собран на текущий день",
  "У родителя тот же экран, что у учителя",
];

const FEATURES = [
  {
    Icon: IconPlan,
    title: "Настройка по шагам",
    text: "После регистрации мастер проведёт по предметам, классам и приглашению учителей. Ничего не нужно настраивать вслепую.",
  },
  {
    Icon: IconChat,
    title: "Обучающий тур",
    text: "При первом входе платформа сама показывает, куда нажимать. Тур можно перезапустить в любой момент.",
  },
  {
    Icon: IconChild,
    title: "Русский и қазақша",
    text: "Интерфейс переключается одной кнопкой. Задания и разборы платформа готовит на выбранном языке.",
  },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect(HOME_BY_ROLE[session.role]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-[var(--color-brand)] text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-transform duration-300 hover:scale-105">
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
        {/* Первый экран: обещание слева, живой макет продукта справа */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="hero-blob animate-drift -top-32 -left-24 size-[420px] bg-[var(--color-brand)]/10"
          />
          <div
            aria-hidden
            className="hero-blob animate-drift top-10 -right-32 size-[380px] bg-amber-300/10"
            style={{ animationDelay: "-6s" }}
          />

          <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-5 pt-16 pb-16 sm:pt-24 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <p className="animate-fade overline">
                Школьная платформа с ИИ
              </p>
              <h1 className="animate-rise mt-4 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-[52px]">
                Проверяет работы и показывает, чего класс{" "}
                <span className="relative text-[var(--color-brand)]">
                  не понял
                  <svg
                    aria-hidden
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1 left-0 h-2.5 w-full text-[var(--color-brand)]/30"
                  >
                    <path
                      d="M2 8c40-5 90-6 196-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p
                className="animate-rise muted mx-auto mt-6 max-w-xl text-base leading-relaxed text-balance lg:mx-0"
                style={{ animationDelay: "90ms" }}
              >
                Uiren берёт на себя проверку домашних работ, планы уроков и
                отчёты. Учитель получает обратно вечера и понятную картину
                класса, ученик — разбор своих ошибок, а не молчаливую оценку.
              </p>

              <div
                className="animate-rise mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
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
            </div>

            <div
              className="animate-rise"
              style={{ animationDelay: "240ms" }}
            >
              <LandingPreview />
            </div>
          </div>
        </section>

        {/* Что меняется в неделе учителя */}
        <section className="border-y border-[var(--color-line)] bg-[var(--color-canvas)]">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <Reveal className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-balance">
                Что меняется в неделе учителя
              </h2>
              <p className="muted mx-auto mt-2 max-w-md">
                Работа остаётся той же. Уходит та её часть, которую никто не
                любит.
              </p>
            </Reveal>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              <Reveal delay={80}>
                <div className="card h-full">
                  <p className="overline text-[var(--color-muted)]">Было</p>
                  <ul className="mt-4 space-y-3">
                    {BEFORE.map((item) => (
                      <li key={item} className="flex gap-3 text-sm">
                        <span
                          aria-hidden
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-line)]"
                        />
                        <span className="text-[var(--color-muted)]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={160}>
                <div className="card h-full border-[var(--color-brand)]/25 bg-gradient-to-b from-[var(--color-brand-tint)]/50 to-white">
                  <p className="overline text-[var(--color-brand)]">Стало</p>
                  <ul className="mt-4 space-y-3">
                    {AFTER.map((item) => (
                      <li key={item} className="flex gap-3 text-sm">
                        <svg
                          aria-hidden
                          viewBox="0 0 20 20"
                          className="mt-0.5 size-4 shrink-0 text-[var(--color-brand)]"
                        >
                          <path
                            d="m5 10.5 3.2 3.2L15 7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-[var(--color-ink-2)]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Кому и зачем */}
        <section className="mx-auto max-w-5xl px-5 py-16">
          <Reveal className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Одна платформа для всей школы
            </h2>
            <p className="muted mx-auto mt-2 max-w-md">
              У каждого свой вход и свой экран — но данные общие, и никто ничего
              не пересылает вручную.
            </p>
          </Reveal>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {ROLES.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="card-link group h-full">
                  <div className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-tint)] text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-3.5 font-semibold">{title}</h3>
                  <p className="muted mt-1.5 leading-relaxed">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Как это работает — четыре шага */}
        <section className="border-y border-[var(--color-line)] bg-[var(--color-canvas)]">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <Reveal className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight">
                Как это работает
              </h2>
              <p className="muted mt-2">
                Четыре шага — от темы урока до понятного вывода
              </p>
            </Reveal>

            <ol className="relative mt-10 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-[var(--color-line)]">
              {STEPS.map((step, i) => (
                <Reveal
                  as="li"
                  key={step.n}
                  delay={i * 90}
                  className="group relative flex gap-5"
                >
                  <span className="z-[1] grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-white text-sm font-semibold text-[var(--color-brand)] shadow-[var(--shadow-soft)] transition-all duration-300 group-hover:border-[var(--color-brand)]/40 group-hover:shadow-[var(--shadow-lift)]">
                    {step.n}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="muted mt-1 leading-relaxed">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Что делает платформу понятной с первого входа */}
        <section className="mx-auto max-w-5xl px-5 py-16">
          <Reveal className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Понятно с первого входа
            </h2>
            <p className="muted mx-auto mt-2 max-w-md">
              Платформу должно быть видно насквозь без обучающего семинара.
            </p>
          </Reveal>

          <div className="mt-9 grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-tint)] text-[var(--color-brand)]">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-3.5 font-semibold">{title}</h3>
                <p className="muted mt-1.5 leading-relaxed">{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Финальный призыв */}
        <section className="relative overflow-hidden border-t border-[var(--color-line)] bg-[var(--color-canvas)]">
          <div
            aria-hidden
            className="hero-blob animate-drift -bottom-40 left-1/2 size-[460px] -translate-x-1/2 bg-[var(--color-brand)]/10"
          />
          <div className="relative mx-auto max-w-5xl px-5 py-20 text-center">
            <Reveal>
              <span className="badge-soft">
                <IconSpark className="size-3.5" />
                Начните со своей школы
              </span>
              <h2 className="mx-auto mt-5 max-w-xl text-3xl font-semibold tracking-tight text-balance">
                Первое задание можно выдать сегодня
              </h2>
              <p className="muted mx-auto mt-3 max-w-md leading-relaxed">
                Создайте школу, получите код приглашения и раздайте его
                коллегам, ученикам и родителям. Дальше платформа проведёт всех
                сама.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/register/school" className="btn-primary px-5 py-3">
                  Зарегистрировать школу
                </Link>
                <Link href="/login" className="btn-ghost px-5 py-3">
                  У меня уже есть аккаунт
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-7 text-xs text-[var(--color-muted)]">
          <span>Uiren — школьная платформа</span>
          <Link
            href="/login"
            className="link-underline hover:text-[var(--color-ink)]"
          >
            Вход для зарегистрированных
          </Link>
        </div>
      </footer>
    </div>
  );
}
