/**
 * Почты, которыми уже входили с этого устройства.
 *
 * Пароли здесь не хранятся и храниться не будут. Чтобы подставить пароль в
 * поле, его нужно уметь прочитать — то есть держать в обратимом виде. В базе
 * у нас лежат bcrypt-хеши именно для того, чтобы это было невозможно, и
 * заводить рядом второе, читаемое хранилище означало бы обнулить смысл первого.
 *
 * Пароли умеет подставлять менеджер паролей браузера: он шифрует их ключом
 * системы, спрашивает разрешение и не отдаёт странице. Наша задача — не мешать
 * ему, а взять на себя то, что безопасно: помнить сами адреса.
 */
const KEY = "uiren:emails";
const LIMIT = 5;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    // Испорченное или недоступное хранилище не должно ломать вход.
    return [];
  }
}

export function rememberedEmails(): string[] {
  return read();
}

/** Последняя использованная почта — ею поле заполняется сразу. */
export function lastEmail(): string {
  return read()[0] ?? "";
}

export function rememberEmail(email: string) {
  const value = email.trim().toLowerCase();
  if (!value.includes("@")) return;
  try {
    const next = [value, ...read().filter((e) => e !== value)].slice(0, LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Приватный режим или запрет на хранилище — просто не запоминаем.
  }
}

/** Убрать почту: вход не удался либо человек сам её удалил из списка. */
export function forgetEmail(email: string) {
  const value = email.trim().toLowerCase();
  try {
    const next = read().filter((e) => e !== value);
    if (next.length === 0) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ничего не делаем: список — удобство, а не источник правды.
  }
}
