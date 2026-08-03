import { Fragment } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";
import { Reveal } from "@/components/reveal";
import { Logo, Wordmark } from "@/components/logo";
import { LandingPreview } from "@/components/landing-preview";
import { ErrorNatureViz } from "@/components/error-nature-viz";
import {
  IconChart,
  IconChat,
  IconChild,
  IconPlan,
  IconTasks,
} from "@/components/icons";

/** Заголовок собирается по словам, чтобы появление шло слева направо. */
const HERO_WORDS = [
  "Проверяет",
  "домашние",
  "работы",
  "и",
  "говорит,",
  "что",
  "разбирать",
];

const SUBJECTS = [
  "Алгебра",
  "Геометрия",
  "Физика",
  "Химия",
  "Биология",
  "История Казахстана",
  "Қазақ тілі",
  "Русский язык",
  "English",
  "Информатика",
  "География",
  "Всемирная история",
];

const ROLES = [
  {
    Icon: IconTasks,
    title: "Учителю",
    text: "Задание по теме за минуту. Проверка класса в одно нажатие. КСП и сообщения родителям тут же.",
  },
  {
    Icon: IconChat,
    title: "Ученику",
    text: "Видно, на каком шаге сломалось решение. Тьютор подскажет, но решать будете сами.",
  },
  {
    Icon: IconChart,
    title: "Директору",
    text: "Успеваемость по предметам и классам. Кто из учителей работает в системе. Прогноз по ЕНТ. Собирать вручную не нужно.",
  },
  {
    Icon: IconChild,
    title: "Родителю",
    text: "Оценки, слабые темы и сообщения от учителя на одной странице. Спрашивать в чате, что задали, больше не придётся.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Пишете тему урока",
    text: "Пишете: «квадратные уравнения, 8 класс». Получаете готовые задания. Оставляете как есть или правите под свой класс.",
  },
  {
    n: "02",
    title: "Ученики решают у себя",
    text: "Каждый записывает ход решения, а не только ответ. По одному ответу непонятно, ошибся он в счёте или не понял тему.",
  },
  {
    n: "03",
    title: "Проверка — одно нажатие",
    text: "Балл и комментарий каждому. У каждой ошибки указана причина: не понял тему, ошибся в счёте, был невнимателен, списал.",
  },
  {
    n: "04",
    title: "Видно, что делать дальше",
    text: "Вы получаете разбор класса и заготовку следующего урока. Ученик видит свои слабые темы. Директор видит школу целиком.",
  },
];

/** Прямые утверждения о продукте: подлежащее «Uiren», сказуемое — глагол. */
const DOES = [
  {
    Icon: IconTasks,
    title: "Проверяет работы",
    text: "Весь класс сразу. Каждый ученик получает балл и разбор: на каком шаге он свернул не туда.",
  },
  {
    Icon: IconChart,
    title: "Находит провал в теме",
    text: "13 человек не умеют выносить общий множитель. Вы узнаёте об этом до контрольной, а не после неё.",
  },
  {
    Icon: IconPlan,
    title: "Пишет документы",
    text: "КСП по ГОСО, отчёты по классу и школе, черновики сообщений родителям. Правите и отправляете.",
  },
  {
    Icon: IconChat,
    title: "Отвечает ученику",
    text: "Тьютор знает его класс и его последние ошибки. Подсказывает и задаёт наводящие вопросы. Готовое решение не выдаёт.",
  },
];

const BEFORE = [
  "Воскресенье уходит на тетради",
  "Класс написал СОР плохо, а почему — неясно",
  "Отчёты к концу четверти собираются вручную",
  "Родители узнают об оценках последними",
];

const AFTER = [
  "Проверка занимает одно нажатие",
  "Видно тему, на которой посыпался класс",
  "Отчёт по школе готов на сегодня",
  "Родитель видит то же, что учитель",
];

const FEATURES = [
  {
    Icon: IconPlan,
    title: "Мастер настройки",
    text: "После регистрации платформа проведёт по предметам, классам и приглашению коллег. Занимает минут десять.",
  },
  {
    Icon: IconChat,
    title: "Подсказки при первом входе",
    text: "Платформа показывает, куда нажимать и зачем. Если что-то забылось, тур перезапускается из настроек.",
  },
  {
    Icon: IconChild,
    title: "Русский и қазақша",
    text: "Интерфейс переключается одной кнопкой. Задания и разборы платформа готовит на том языке, который выбрал учитель.",
  },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect(HOME_BY_ROLE[session.role]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[var(--color-surface)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Wordmark />
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
        {/* Первый экран: текст слева, панель продукта справа — без центрирования */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="hero-blob animate-drift -top-40 -left-32 size-[520px] bg-[var(--color-brand)]/12"
          />
          <div
            aria-hidden
            className="hero-blob animate-drift top-20 -right-40 size-[420px] bg-amber-300/12"
            style={{ animationDelay: "-6s" }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pt-20 pb-20 sm:pt-28 lg:grid-cols-[1.1fr_1fr]">
            <div>
              {/* Знак прочерчивается при загрузке — первое, что видит гость. */}
              <Logo className="mb-6 size-14" draw />

              <p className="animate-fade eyebrow">Для школ Казахстана</p>

              <h1 className="display mt-7 max-w-2xl text-[var(--color-ink)]">
                {/* Пробел между span'ами настоящий: иначе заголовок
                    читается скринридером как одно слитное слово. */}
                {HERO_WORDS.map((word, i) => (
                  <Fragment key={`${word}-${i}`}>
                    <span
                      className="animate-word inline-block"
                      style={{ animationDelay: `${i * 65}ms` }}
                    >
                      {word}
                    </span>{" "}
                  </Fragment>
                ))}
                <span
                  className="animate-word relative inline-block text-[var(--color-brand)]"
                  style={{ animationDelay: `${HERO_WORDS.length * 65}ms` }}
                >
                  завтра
                  <svg
                    aria-hidden
                    viewBox="0 0 220 14"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-3 w-full text-[var(--color-brand)]/35"
                  >
                    <path
                      d="M3 9c48-6 108-7 214-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p
                className="animate-rise mt-9 max-w-lg text-[19px] leading-[1.65] text-[var(--color-ink-2)]"
                style={{ animationDelay: "480ms" }}
              >
                Вы задали тему. Ученики решили у себя. Uiren проверил всех и
                написал каждому, где он ошибся. Утром вы открываете разбор и
                видите, что нужно повторить на уроке.
              </p>

              <div
                className="animate-rise mt-9 flex flex-wrap gap-3"
                style={{ animationDelay: "560ms" }}
              >
                <Link
                  href="/register/school"
                  className="btn-primary px-6 py-3.5 text-[15px]"
                >
                  Зарегистрировать школу
                </Link>
                <Link
                  href="/register/join"
                  className="btn-ghost px-6 py-3.5 text-[15px]"
                >
                  У меня есть код школы
                </Link>
              </div>

              <p
                className="animate-fade mt-5 text-[13px] text-[var(--color-muted)]"
                style={{ animationDelay: "640ms" }}
              >
                Регистрация занимает минуту. Начать можно с одного класса.
              </p>
            </div>

            <div
              className="animate-rise parallax-slow"
              style={{ animationDelay: "300ms" }}
            >
              <LandingPreview />
            </div>
          </div>
        </section>

        {/* Лента предметов — движение и охват программы одной строкой */}
        <section className="border-y border-[var(--color-line)] bg-[var(--color-canvas)] py-5">
          <div className="marquee-mask flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
              {[...SUBJECTS, ...SUBJECTS].map((subject, i) => (
                <span
                  key={`${subject}-${i}`}
                  className="shrink-0 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm whitespace-nowrap text-[var(--color-ink-2)]"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Что делает Uiren — прямым текстом, глаголами */}
        <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Что делает Uiren</p>
              <h2 className="display-sm mt-5 text-balance">
                Четыре вещи, которые сейчас делаются руками
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {DOES.map((item, i) => (
                <Reveal key={item.title} delay={i * 80}>
                  <div className="flex gap-4">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-tint)] text-[var(--color-brand)]">
                      <item.Icon className="size-[18px]" />
                    </span>
                    <div>
                      <h3 className="font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <p className="muted mt-1.5 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Было / стало */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Что меняется</p>
            <h2 className="display-sm mt-5 text-balance">
              Что перестаёт отнимать вечера
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal delay={80}>
              <div className="card h-full p-7">
                <p className="text-[13px] font-semibold tracking-[0.16em] text-[var(--color-muted)] uppercase">
                  Было
                </p>
                <ul className="mt-6 space-y-4">
                  {BEFORE.map((item) => (
                    <li key={item} className="flex gap-3.5">
                      <span
                        aria-hidden
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[var(--color-line)]"
                      />
                      <span className="text-[15px] text-[var(--color-muted)]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="card h-full border-[var(--color-brand)]/25 bg-gradient-to-br from-[var(--color-brand-tint)]/60 to-white p-7">
                <p className="text-[13px] font-semibold tracking-[0.16em] text-[var(--color-brand)] uppercase">
                  Стало
                </p>
                <ul className="mt-6 space-y-4">
                  {AFTER.map((item) => (
                    <li key={item} className="flex gap-3.5">
                      <svg
                        aria-hidden
                        viewBox="0 0 20 20"
                        className="mt-1 size-4 shrink-0 text-[var(--color-brand)]"
                      >
                        <path
                          d="m5 10.5 3.2 3.2L15 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-[15px] text-[var(--color-ink-2)]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Главная идея продукта, показанная картинкой */}
        <section className="border-y border-[var(--color-line)] bg-[var(--color-canvas)]">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-[1fr_1.05fr]">
            <Reveal>
              <p className="eyebrow">Разбор ошибок</p>
              <h2 className="display-sm mt-5 text-balance">
                Четыре тройки в журнале. Четыре разные причины
              </h2>
              <p className="muted mt-5 text-[17px]">
                Оценка говорит, что ученик ошибся. Она не говорит почему. Один
                не понял тему, второй понял, но сбился в счёте, третий торопился
                и потерял знак.
              </p>
              <p className="muted mt-3 text-[17px]">
                Учителю нужны три разных действия. Uiren размечает каждую ошибку
                и складывает картину по классу.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <ErrorNatureViz />
            </Reveal>
          </div>
        </section>

        {/* Тёмная полоса: четыре шага крупными цифрами */}
        <section className="night grain relative overflow-hidden">
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <Reveal className="max-w-2xl">
              <p className="eyebrow text-[var(--color-night-muted)]">
                Как это работает
              </p>
              <h2 className="display-sm mt-5 text-white text-balance">
                От темы урока до готового вывода — четыре шага
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 90}>
                  <div className="group border-t border-white/12 pt-6">
                    <span className="numeral block text-[var(--color-night-2)] transition-colors duration-500 group-hover:text-[var(--color-brand)]">
                      {step.n}
                    </span>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-[var(--color-night-muted)]">
                      {step.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Роли */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Кому это нужно</p>
            <h2 className="display-sm mt-5 text-balance">
              Одна платформа для всей школы
            </h2>
            <p className="muted mt-4 text-[17px]">
              У каждого свой вход и свой экран. Данные общие, поэтому никто
              никому ничего не пересылает вручную.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {ROLES.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="card-link group h-full p-7">
                  <div className="grid size-11 place-items-center rounded-xl bg-[var(--color-brand-tint)] text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="muted mt-2">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Почему понятно с первого входа */}
        <section className="border-t border-[var(--color-line)] bg-[var(--color-canvas)]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Как начать</p>
              <h2 className="display-sm mt-5 text-balance">
                Разобраться можно самому, без обучающего семинара
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-10 sm:grid-cols-3">
              {FEATURES.map(({ Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 90}>
                  <div className="border-t border-[var(--color-line)] pt-6">
                    <Icon className="size-6 text-[var(--color-brand)]" />
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="muted mt-2">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Финальный призыв */}
        <section className="night grain relative overflow-hidden">
          <div
            aria-hidden
            className="hero-blob animate-drift -bottom-52 left-1/2 size-[560px] -translate-x-1/2 bg-[var(--color-brand)]/25"
          />
          <div className="relative mx-auto max-w-6xl px-6 py-28 text-center">
            <Reveal>
              <h2 className="display-sm mx-auto max-w-2xl text-white text-balance">
                Попробуйте на одном классе
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-[var(--color-night-muted)]">
                Зарегистрируйте школу и раздайте код коллегам. Поднимать всю
                школу сразу не нужно. Возьмите один класс и посмотрите, что
                получится за две недели.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link
                  href="/register/school"
                  className="btn-primary px-6 py-3.5 text-[15px]"
                >
                  Зарегистрировать школу
                </Link>
                <Link
                  href="/login"
                  className="btn inline-flex border border-white/20 bg-transparent px-6 py-3.5 text-[15px] text-white hover:bg-white/10"
                >
                  У меня уже есть аккаунт
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-[13px] text-[var(--color-muted)]">
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
