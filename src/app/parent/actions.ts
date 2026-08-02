"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  acceptFamilyLink,
  linkFamilyByEmail,
  removeFamilyLink,
  type FamilyState,
} from "@/lib/family";

/** Родитель отправляет запрос ребёнку по почте его аккаунта. */
export async function linkChild(
  _prev: FamilyState,
  formData: FormData,
): Promise<FamilyState> {
  const session = await requireRole("PARENT");

  const result = await linkFamilyByEmail({
    selfId: session.userId,
    schoolId: session.schoolId,
    email: String(formData.get("childEmail") ?? ""),
    counterpartRole: "STUDENT",
  });

  if (result.ok) revalidatePath("/parent");
  return result;
}

/** Подтверждение запроса, который прислал ученик. */
export async function acceptChild(formData: FormData) {
  const session = await requireRole("PARENT");

  await acceptFamilyLink({
    linkId: String(formData.get("linkId") ?? ""),
    selfId: session.userId,
  });

  revalidatePath("/parent");
}

/** Отвязать ребёнка, отклонить его запрос или отозвать свой — одно действие. */
export async function unlinkChild(formData: FormData) {
  const session = await requireRole("PARENT");

  await removeFamilyLink({
    linkId: String(formData.get("linkId") ?? ""),
    selfId: session.userId,
  });

  revalidatePath("/parent");
}
