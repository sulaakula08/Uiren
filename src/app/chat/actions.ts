"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canMessage } from "@/lib/chat";

export type SendState = { error?: string };

const MAX = 2000;

export async function sendChatMessage(
  _prev: SendState,
  formData: FormData,
): Promise<SendState> {
  const session = await requireUser();
  const to = String(formData.get("to") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "Сообщение пустое" };
  if (body.length > MAX) return { error: `Не длиннее ${MAX} символов` };

  // Право писать проверяем на сервере при каждой отправке: получателя в форме
  // можно подменить, и без этой проверки любой писал бы кому угодно.
  if (!(await canMessage(session.userId, session.role, to))) {
    return { error: "Этому человеку писать нельзя" };
  }

  await db.chatMessage.create({
    data: { senderId: session.userId, recipientId: to, body },
  });

  revalidatePath("/chat");
  return {};
}
