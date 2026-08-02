import "server-only";
import { loadAccount } from "./account";

/**
 * Прошёл ли пользователь обучающий тур.
 *
 * Профиль берём из общего кеша запроса — макет всё равно только что прочитал
 * эту же строку ради проверки роли, второй раз ходить в базу незачем.
 */
export async function isTourDone(userId: string): Promise<boolean> {
  const user = await loadAccount(userId);
  return Boolean(user?.tourDoneAt);
}
