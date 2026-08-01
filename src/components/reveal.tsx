type RevealProps = {
  children: React.ReactNode;
  /** Задержка внутри группы — карточки появляются по очереди. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
};

/**
 * Появление блока при прокрутке.
 *
 * Реализовано на CSS (`animation-timeline: view()`), без JS: серверный компонент,
 * ничего не гидрируется. Там, где scroll-driven анимации не поддерживаются,
 * блок просто проигрывает появление один раз при загрузке — контент виден
 * всегда, даже если JS не выполнился. Подробности в `.reveal` в globals.css.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  return (
    <Tag
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
