import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rubik Solver",
  description: "3x3 Rubik Solver",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}