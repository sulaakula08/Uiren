"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { linkFamilyByEmail, unlinkFamily, type FamilyState } from "@/lib/family";

/** Ученик сам подключает родителя — обратная сторона той же связи. */
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

export async function unlinkParent(formData: FormData) {
  const session = await requireRole("STUDENT");

  await unlinkFamily({
    parentId: String(formData.get("parentId") ?? ""),
    studentId: session.userId,
  });

  revalidatePath("/student");
}
