import type { ReactNode } from "react";

export default function WordLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <>{children}</>;
}
