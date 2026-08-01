/**
 * Знак Uiren: «U» с искрой внутри.
 *
 * Нарисован вектором, а не картинкой: логотип нужен размером от 20 до 120 px,
 * должен быть чётким на любом экране, иметь прозрачный фон (иначе в тёмной теме
 * получается белый прямоугольник) и уметь анимироваться.
 *
 * Градиент лежит в одном общем `<defs>` (см. LogoGradient в layout) — поэтому
 * здесь только ссылка `url(#uiren-grad)`, без дублирования id на странице.
 */
export function Logo({
  className = "",
  /** Дуга «U» прочерчивается при появлении — для первого экрана и входа. */
  draw = false,
  title,
}: {
  className?: string;
  draw?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      {title && <title>{title}</title>}

      {/* Чаша «U». pathLength=100 позволяет анимировать обводку
          независимо от реальной длины кривой. */}
      <path
        d="M19 15V34a13 13 0 0 0 26 0V15"
        stroke="url(#uiren-grad)"
        strokeWidth="9"
        strokeLinecap="round"
        pathLength={100}
        className={draw ? "logo-draw" : undefined}
      />

      {/* Хвостик искры — короткий изгиб к центру чаши. */}
      <path
        d="M32 30c0 5-3 6-3 10"
        stroke="url(#uiren-grad)"
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Искра. Мерцает медленно, чтобы не отвлекать от текста. */}
      <path
        className="logo-spark"
        d="M32 13c1.1 6.3 2.6 7.8 8.5 9-5.9 1.2-7.4 2.7-8.5 9-1.1-6.3-2.6-7.8-8.5-9 5.9-1.2 7.4-2.7 8.5-9Z"
        fill="url(#uiren-grad)"
      />
    </svg>
  );
}

/**
 * Единственное определение градиента на страницу. Рендерится в layout,
 * все экземпляры Logo ссылаются на него по id.
 */
export function LogoGradient() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: "absolute" }}
    >
      <defs>
        <linearGradient id="uiren-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1f5ff0" />
          <stop offset="100%" stopColor="#24c8f5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Знак + слово — для шапки, входа и регистрации. */
export function Wordmark({
  className = "",
  markClass = "size-8",
  draw = false,
}: {
  className?: string;
  markClass?: string;
  draw?: boolean;
}) {
  return (
    <span className={`logo-lockup inline-flex items-center gap-2.5 ${className}`}>
      <Logo className={markClass} draw={draw} title="Uiren" />
      <span className="text-[17px] font-semibold tracking-[-0.02em]">
        Uiren
      </span>
    </span>
  );
}
