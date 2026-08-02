import "server-only";
import type { Role } from "@prisma/client";
import type { Translator } from "./i18n";
import type { NavItem } from "@/components/nav-links";

/**
 * Боковое меню для роли. Нужно страницам вне разделов роли — например
 * настройкам, которые открываются у всех, но должны показывать «своё» меню.
 */
export function navFor(role: Role, t: Translator): NavItem[] {
  switch (role) {
    case "TEACHER":
      return [
        { href: "/teacher", label: t("nav.overview"), icon: "home" },
        {
          href: "/teacher/assignments",
          label: t("nav.assignments"),
          icon: "tasks",
        },
        { href: "/teacher/lessons", label: t("nav.lessons"), icon: "plan" },
        { href: "/teacher/messages", label: t("nav.messages"), icon: "mail" },
        { href: "/chat", label: "Переписка", icon: "chat" },
      ];
    case "STUDENT":
      return [
        { href: "/student", label: t("nav.overview"), icon: "home" },
        { href: "/student/tutor", label: t("nav.tutor"), icon: "chat" },
        { href: "/chat", label: "Переписка", icon: "mail" },
      ];
    case "PARENT":
      return [
        { href: "/parent", label: t("nav.children"), icon: "child" },
        { href: "/chat", label: "Переписка", icon: "mail" },
      ];
    case "DIRECTOR":
      return [
        { href: "/director", label: t("nav.overview"), icon: "chart" },
        {
          href: "/director/teachers",
          label: t("director.teachers"),
          icon: "people",
        },
      ];
    case "ADMIN":
      return [{ href: "/admin", label: t("nav.school"), icon: "home" }];
  }
}
