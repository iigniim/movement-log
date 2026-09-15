import type { Metadata } from "next";
import "./globals.css";
// TEMP DEBUG - remove after diagnosis
import { TempDebugBanner } from "./temp-debug-banner";

export const metadata: Metadata = {
  title: "Movement.log",
  description: "트레이너-회원 운동 기록 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <TempDebugBanner />
        {children}
      </body>
    </html>
  );
}
