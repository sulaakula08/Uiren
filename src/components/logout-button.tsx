"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { logout } from "@/app/actions";
import { IconLogout } from "./icons";

function Confirm({ cancel }: { cancel: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="button"
        className="btn-ghost flex-1"
        disabled={pending}
        onClick={(e) => e.currentTarget.closest("dialog")?.close()}
      >
        {cancel}
      </button>
      <button type="submit" className="btn-danger flex-1" disabled={pending}>
        {pending ? "Выходим…" : "Выйти"}
      </button>
    </>
  );
}

/**
 * Выход с подтверждением.
 *
 * Раньше выход происходил по одному нажатию — на телефоне кнопка стоит рядом
 * с навигацией, и промахнуться легко. Диалог нативный (<dialog>): даёт
 * закрытие по Esc, фокус-ловушку и подложку без внешних библиотек.
 */
export function LogoutButton({
  label,
  className = "btn-ghost",
  iconOnly = false,
  title,
}: {
  label: string;
  className?: string;
  iconOnly?: boolean;
  title?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      {/*
       * Кнопка — обычный submit внутри формы выхода. Пока диалога нет (сервер,
       * выключенный JS), нажатие просто отправляет форму и выход происходит.
       * Когда диалог смонтирован — перехватываем и спрашиваем подтверждение.
       * display: contents, чтобы обёртка не влияла на раскладку панели.
       */}
      <form action={logout} className="contents">
        <button
          type="submit"
          className={className}
          title={title ?? label}
          onClick={(e) => {
            const dialog = ref.current;
            if (!dialog) return;
            e.preventDefault();
            dialog.showModal();
          }}
        >
          <IconLogout className="size-4" />
          {!iconOnly && label}
        </button>
      </form>

      {/* Диалог рендерим только после монтирования: showModal есть лишь в браузере. */}
      {mounted && (
        <dialog
          ref={ref}
          className="uiren-dialog"
          onClick={(e) => {
            // Клик по подложке (вне карточки) закрывает диалог.
            if (e.target === ref.current) ref.current?.close();
          }}
        >
          <div className="w-[min(92vw,360px)] p-5">
            <h2 className="text-[17px] font-semibold tracking-tight">
              Выйти из аккаунта?
            </h2>
            <p className="muted mt-2">
              Придётся снова ввести почту и пароль. Несохранённые черновики
              останутся на месте.
            </p>
            <form action={logout} className="mt-5 flex gap-2.5">
              <Confirm cancel="Остаться" />
            </form>
          </div>
        </dialog>
      )}
    </>
  );
}
