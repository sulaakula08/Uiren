"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { linkFamilyByEmail, unlinkFamily, type FamilyState } from "@/lib/family";

/** Родитель добавляет ребёнка по почте его аккаунта. */
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

export async function unlinkChild(formData: FormData) {
  const session = await requireRole("PARENT");

  await unlinkFamily({
    parentId: session.userId,
    studentId: String(formData.get("studentId") ?? ""),
  });

  revalidatePath("/parent");
}
