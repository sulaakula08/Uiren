import { Fragment } from "react";

/**
 * Минимальная разметка в ответах модели.
 *
 * Полноценный markdown здесь не нужен и вреден: чем больше синтаксиса мы
 * поддерживаем, тем охотнее модель его использует, а всё неподдержанное
 * ученик видит сырыми символами. Поэтому договорённость узкая — **жирный**
 * и списки через «- », — и она же прописана в системном промпте.
 */
function inline(text: string, keyPrefix: string) {
  // Делим по **…**, нечётные части — выделенные.
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold">
        {part}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
    ),
  );
}

export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="my-1.5 space-y-1 pl-4">
        {list.map((item, i) => (
          <li key={i} className="list-disc marker:text-[var(--color-muted)]">
            {inline(item, `${key}-${i}`)}
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((line, i) => {
    const item = line.match(/^\s*[-•]\s+(.*)$/);
    if (item) {
      list.push(item[1]);
      return;
    }
    flushList(`list-${i}`);
    if (line.trim() === "") {
      blocks.push(<div key={`gap-${i}`} className="h-2" />);
      return;
    }
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {inline(line, `p-${i}`)}
      </p>,
    );
  });
  flushList("list-end");

  return <>{blocks}</>;
}
