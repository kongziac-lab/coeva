import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({ weight: ["400", "500", "700", "900"], subsets: ["latin"], variable: "--font-sans", display: "swap" });
const notoSerifKr = Noto_Serif_KR({ weight: ["700", "900"], subsets: ["latin"], variable: "--font-serif", display: "swap" });
const ibmPlexMono = IBM_Plex_Mono({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "K-강의평가", template: "%s · K-강의평가" },
  description: "계명대학교 한국어학당 현장 강의평가 운영 시스템",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${notoSerifKr.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
