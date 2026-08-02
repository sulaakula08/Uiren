"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  acceptFamilyLink,
  linkFamilyByEmail,
  removeFamilyLink,
  type FamilyState,
} from "@/lib/family";

/** Ученик сам зовёт родителя — обратная сторона той же связи. */
export async function linkParent(
  _prev: FamilyState,
  formData: FormData,
): Promise<FamilyState> {
  const session = await requireRole("STUDENT");

  const result = await linkFamilyByEmail({
    selfId: session.userId,
    schoolId: session.schoolId,
    email: String(formData.get("parentEmail") ?? ""),
    counterpartRole: "PARENT",
  });

  if (result.ok) revalidatePath("/student");
  return result;
}

/**
 * Подтверждение запроса от родителя. Ключевая проверка всей схемы: доступ к
 * оценкам открывает именно ученик, а не тот, кто знает его почту.
 */
export async function acceptParent(formData: FormData) {
  const session = await requireRole("STUDENT");

  await acceptFamilyLink({
    linkId: String(formData.get("linkId") ?? ""),
    selfId: session.userId,
  });

  revalidatePath("/student");
}

export async function unlinkParent(formData: FormData) {
  const session = await requireRole("STUDENT");

  await removeFamilyLink({
    linkId: String(formData.get("linkId") ?? ""),
    selfId: session.userId,
  });

  revalidatePath("/student");
}
