import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "K-강의평가", template: "%s · K-강의평가" },
  description: "계명대학교 한국어학당 현장 강의평가 운영 시스템",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
