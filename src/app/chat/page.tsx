import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listContacts, openThread, canMessage } from "@/lib/chat";
import { Empty, PageHeader } from "@/components/ui";
import { Composer } from "./composer";

function time(d: Date) {
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await requireUser();
  const { with: otherId } = await searchParams;

  const contacts = await listContacts(session.userId, session.role);

  // Открывать можно только разрешённую ветку — id в адресе легко подменить.
  const allowed = otherId
    ? await canMessage(session.userId, session.role, otherId)
    : false;

  const other = allowed
    ? await db.user.findUnique({
        where: { id: otherId },
        select: { id: true, fullName: true },
      })
    : null;

  const messages = other ? await openThread(session.userId, other.id) : [];
  const active = contacts.find((c) => c.id === otherId);

  return (
    <div>
      <PageHeader
        title="Сообщения"
        subtitle={
          session.role === "STUDENT"
            ? "Личная переписка с учителями. Родители её не видят."
            : session.role === "PARENT"
              ? "Переписка с учителями вашего ребёнка"
              : "Переписка с учениками и их родителями"
        }
      />

      {contacts.length === 0 ? (
        <Empty text="Пока не с кем переписываться. Собеседники появятся, когда будут назначены классы и предметы." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Список собеседников */}
          <aside className="space-y-1.5">
            {contacts.map((c) => {
              const isActive = c.id === otherId;
              return (
                <Link
                  key={c.id}
                  href={`/chat?with=${c.id}`}
                  className={`block rounded-xl border px-3.5 py-2.5 transition-colors ${
                    isActive
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-tint)]"
                      : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-canvas)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{c.fullName}</p>
                    {c.unread > 0 && (
                      <span className="chip shrink-0 bg-[var(--color-brand)] text-[var(--color-on-brand)]">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="muted mt-0.5 truncate text-xs">{c.relation}</p>
                </Link>
              );
            })}
          </aside>

          {/* Ветка */}
          <section className="card flex min-h-[420px] flex-col">
            {!other ? (
              <div className="m-auto text-center">
                <p className="muted">Выберите собеседника слева</p>
              </div>
            ) : (
              <>
                <div className="border-b border-[var(--color-line)] pb-3">
                  <p className="font-medium">{other.fullName}</p>
                  {active && (
                    <p className="muted text-xs">{active.relation}</p>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto py-4">
                  {messages.length === 0 && (
                    <p className="muted py-8 text-center text-sm">
                      Сообщений пока нет. Напишите первым.
                    </p>
                  )}
                  {messages.map((m) => {
                    const mine = m.senderId === session.userId;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`animate-pop max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                            mine
                              ? "bg-[var(--color-brand)] text-[var(--color-on-brand)]"
                              : "bg-[var(--color-canvas)] text-[var(--color-ink)]"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                          <p
                            className={`mt-1 text-[11px] ${
                              mine ? "opacity-70" : "text-[var(--color-muted)]"
                            }`}
                          >
                            {time(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Composer to={other.id} />
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
