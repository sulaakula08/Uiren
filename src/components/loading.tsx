/**
 * Индикаторы ожидания.
 *
 * Раньше кнопки на время работы показывали просто «…» — это читалось как
 * заглушка или сбой, особенно когда проверка работы занимает десяток секунд.
 * Крутящийся индикатор рядом с текстом сразу говорит: идёт работа, не завис.
 */
export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Серый прямоугольник на месте будущего содержимого. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

/** Заглушка карточки-показателя: та же сетка, что у настоящей. */
export function SkeletonStat() {
  return (
    <div className="card">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-16" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

/** Заглушка строки списка. */
export function SkeletonRow() {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-1.5 w-full" />
    </div>
  );
}

/**
 * Каркас страницы на время загрузки: заголовок, показатели, список.
 * Повторяет реальную раскладку, чтобы содержимое не «прыгало» при появлении.
 */
export function PageSkeleton({
  stats = 4,
  rows = 4,
}: {
  stats?: number;
  rows?: number;
}) {
  return (
    <div className="animate-fade" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем данные…</span>

      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-80" />

      {stats > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-3 md:grid-cols-2">
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
