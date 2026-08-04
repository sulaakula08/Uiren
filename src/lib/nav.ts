import "server-only";
import type { Role } from "@prisma/client";
import type { Translator } from "./i18n";
import type { NavItem } from "@/components/nav-links";

/**
 * Боковое меню роли — единственный источник правды.
 *
 * Раньше каждый layout держал свой список, а этот файл использовали только
 * страницы вне разделов роли. Списки разъезжались: новый раздел появлялся в
 * одном месте и пропадал в другом. Теперь все layout берут меню отсюда.
 *
 * `tourId` — якорь для обучающего тура. Он живёт рядом с пунктом меню, чтобы
 * шаг тура и пункт нельзя было потерять по отдельности.
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
          tourId: "nav-assignments",
        },
        {
          href: "/teacher/students",
          label: t("nav.students"),
          icon: "people",
          tourId: "nav-students",
        },
        {
          href: "/teacher/lessons",
          label: t("nav.lessons"),
          icon: "plan",
          tourId: "nav-lessons",
        },
        {
          href: "/teacher/messages",
          label: t("nav.messages"),
          icon: "mail",
          tourId: "nav-messages",
        },
        {
          href: "/chat",
          label: t("nav.chat"),
          icon: "chat",
          tourId: "nav-chat",
        },
      ];
    case "STUDENT":
      return [
        { href: "/student", label: t("nav.overview"), icon: "home" },
        {
          href: "/student/grades",
          label: t("nav.grades"),
          icon: "chart",
          tourId: "nav-grades",
        },
        {
          href: "/student/tutor",
          label: t("nav.tutor"),
          icon: "chat",
          tourId: "nav-tutor",
        },
        {
          href: "/chat",
          label: t("nav.chat"),
          icon: "mail",
          tourId: "nav-chat",
        },
      ];
    case "PARENT":
      return [
        { href: "/parent", label: t("nav.children"), icon: "child" },
        {
          href: "/chat",
          label: t("nav.chat"),
          icon: "mail",
          tourId: "nav-chat",
        },
      ];
    case "DIRECTOR":
      return [
        { href: "/director", label: t("nav.overview"), icon: "chart" },
        {
          href: "/director/teachers",
          label: t("director.teachers"),
          icon: "people",
          tourId: "nav-teachers",
        },
      ];
    case "ADMIN":
      return [{ href: "/admin", label: t("nav.school"), icon: "home" }];
  }
}
