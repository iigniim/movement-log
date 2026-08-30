import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Movement.log",
  description: "트레이너-회원 운동 기록 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
