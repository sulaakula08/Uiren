import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { loadAccount } from "./account";
import { getSession, type SessionPayload } from "./session";

/** Домашняя страница каждой роли — единая точка правды для редиректов. */
export const HOME_BY_ROLE: Record<Role, string> = {
  ADMIN: "/admin",
  DIRECTOR: "/director",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

/**
 * Требует авторизации. Проверяет, что пользователь всё ещё существует:
 * иначе старый cookie давал бы доступ к интерфейсу удалённого аккаунта.
 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await loadAccount(session.userId);
  // Сессия ссылается на несуществующего пользователя или роль изменилась —
  // сбрасываем cookie через route handler и отправляем на вход.
  if (!user || user.role !== session.role) redirect("/logout");

  return session;
}

/**
 * Требует одну из ролей. Если роль другая — уводит на её домашнюю страницу,
 * а не на 403: пользователь не должен упираться в тупик.
 */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireUser();
  if (!roles.includes(session.role)) redirect(HOME_BY_ROLE[session.role]);
  return session;
}
