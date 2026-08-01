import "server-only";
import { SignJWT, jwtVerify } from "jose";

/**
 * Короткоживущий пропуск между «Google подтвердил личность» и «человек выбрал
 * роль и школу».
 *
 * Профиль нельзя просто передать через URL: тогда кто угодно подставил бы
 * чужую почту и завёл аккаунт на неё. Поэтому данные подписываются тем же
 * секретом, что и сессия, и живут 15 минут — этого хватает заполнить форму.
 */
const TTL = "15m";

export type PendingProfile = {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
};

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET не задан.");
  }
  return new TextEncoder().encode(secret);
}

export async function signPendingProfile(
  profile: PendingProfile,
): Promise<string> {
  return new SignJWT({ ...profile, kind: "google-pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(key());
}

export async function readPendingProfile(
  token: string | undefined,
): Promise<PendingProfile | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    // Проверяем назначение токена: сессионный сюда подставить не должно выйти.
    if (payload.kind !== "google-pending") return null;
    const { googleId, email, fullName, avatarUrl } = payload as Record<
      string,
      unknown
    >;
    if (typeof googleId !== "string" || typeof email !== "string") return null;
    return {
      googleId,
      email,
      fullName: typeof fullName === "string" ? fullName : email.split("@")[0],
      avatarUrl: typeof avatarUrl === "string" ? avatarUrl : undefined,
    };
  } catch {
    return null;
  }
}
