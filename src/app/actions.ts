"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import { destroySessionCookie } from "@/lib/session";

export async function setLocale(formData: FormData) {
  const value = String(formData.get("locale") ?? "");
  if (!isLocale(value)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function logout() {
  await destroySessionCookie();
  redirect("/login");
}
