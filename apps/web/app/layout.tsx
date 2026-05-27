import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduForge 智学工坊",
  description: "基于大模型的个性化资源生成与学习多智能体系统",
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
