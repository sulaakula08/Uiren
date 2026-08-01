import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale } from "@/lib/locale";
import { DEFAULT_THEME, THEME_COOKIE, isTheme } from "@/lib/theme";
import { LogoGradient } from "@/components/logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uiren — школьная платформа",
  description:
    "Задания и проверка работ, планы уроков, аналитика класса и школы, AI-тьютор для учеников.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  // Тема проставляется на сервере — страница приходит уже в нужных цветах.
  return (
    <html lang={locale} data-theme={theme}>
      <body>
        <LogoGradient />
        {children}
      </body>
    </html>
  );
}
