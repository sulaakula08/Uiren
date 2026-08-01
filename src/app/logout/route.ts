import { NextResponse } from "next/server";
import { destroySessionCookie } from "@/lib/session";

/**
 * Сброс сессии через route handler: серверные компоненты не могут
 * удалять cookie во время рендера, поэтому «протухшая» сессия
 * (например, удалённый пользователь) уводится сюда.
 */
export async function GET(request: Request) {
  await destroySessionCookie();
  return NextResponse.redirect(new URL("/login", request.url));
}
