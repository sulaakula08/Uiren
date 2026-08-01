import "server-only";
import { db } from "./db";

/** Прошёл ли пользователь обучающий тур. */
export async function isTourDone(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tourDoneAt: true },
  });
  return Boolean(user?.tourDoneAt);
}
