import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./db";

// Без похожих символов (0/O, 1/I), чтобы код можно было продиктовать вслух.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function draw(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/** Код приглашения школы: по нему сотрудники и семьи заводят аккаунты сами. */
export async function generateJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = draw();
    const taken = await db.school.findUnique({ where: { joinCode: code } });
    if (!taken) return code;
  }
  // Практически недостижимо: 32^6 вариантов. Удлиняем и пробуем ещё раз.
  return draw(8);
}
