import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { createSessionCookie } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Вход через Google.
 *
 * Клиент получает ID-токен от кнопки Sign in with Google и присылает его сюда.
 * Токен проверяется на подлинность, после чего выдаётся обычная сессионная
 * cookie Uiren — дальше приложение не различает, как именно вошёл человек.
 *
 * Аккаунты здесь НЕ создаются: у пользователя обязаны быть школа и роль, а
 * Google их не сообщает. Кто это — учитель или ученик, и в какую школу его
 * зачислять, из токена не следует. Регистрация остаётся по коду приглашения,
 * Google — способ входа для уже существующих аккаунтов.
 */
export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Вход через Google не настроен: не задан GOOGLE_CLIENT_ID." },
      { status: 503 },
    );
  }

  let body: { credential?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const credential =
    typeof body.credential === "string" ? body.credential.trim() : "";
  if (!credential) {
    return NextResponse.json({ error: "Токен не передан" }, { status: 400 });
  }

  // Проверяем подпись Google и то, что токен выпущен именно для нашего
  // приложения: без audience чужой сайт мог бы прислать свой валидный токен.
  let googleId: string | undefined;
  let email: string | undefined;
  let emailVerified: boolean | undefined;
  let avatarUrl: string | undefined;

  try {
    const ticket = await new OAuth2Client(clientId).verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    googleId = payload?.sub;
    email = payload?.email?.trim().toLowerCase();
    emailVerified = payload?.email_verified;
    avatarUrl = payload?.picture;
  } catch {
    // Причину наружу не отдаём: она помогает подбирать токены.
    return NextResponse.json(
      { error: "Не удалось проверить вход через Google" },
      { status: 401 },
    );
  }

  if (!googleId || !email) {
    return NextResponse.json(
      { error: "Google не вернул почту аккаунта" },
      { status: 401 },
    );
  }

  // В корпоративных доменах почта бывает неподтверждённой — по такой опознавать
  // человека нельзя: адрес мог быть выдан кому угодно.
  if (emailVerified === false) {
    return NextResponse.json(
      { error: "Почта Google-аккаунта не подтверждена" },
      { status: 401 },
    );
  }

  // Сначала ищем по googleId: почту в Google-аккаунте можно сменить, а sub — нет.
  const user =
    (await db.user.findUnique({ where: { googleId } })) ??
    (await db.user.findUnique({ where: { email } }));

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Аккаунта с такой почтой нет. Сначала зарегистрируйтесь по коду школы.",
        code: "NO_ACCOUNT",
      },
      { status: 404 },
    );
  }

  // Первый вход через Google по существующему аккаунту — привязываем его.
  if (!user.googleId || user.avatarUrl !== avatarUrl) {
    await db.user.update({
      where: { id: user.id },
      data: { googleId, avatarUrl: avatarUrl ?? user.avatarUrl },
    });
  }

  await createSessionCookie({
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    schoolId: user.schoolId,
    locale: user.locale,
  });

  return NextResponse.json({
    success: true,
    redirectTo: HOME_BY_ROLE[user.role],
  });
}
