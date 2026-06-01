import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduForge 智学工坊",
  description: "面向高校课程学习场景的个性化 AI 学习平台",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
