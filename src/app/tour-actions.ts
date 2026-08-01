"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** Тур показывается один раз; повторный запуск — по кнопке подсказки. */
export async function markTourDone() {
  const session = await requireUser();
  await db.user.update({
    where: { id: session.userId },
    data: { tourDoneAt: new Date() },
  });
}
