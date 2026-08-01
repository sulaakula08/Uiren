import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
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
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
