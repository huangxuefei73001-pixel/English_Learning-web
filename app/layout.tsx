import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "English_Learning",
  description:
    "An English-to-Chinese vocabulary learning site with structured explanations, synonym contrast, collocations, examples, favorites, and review reminders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
