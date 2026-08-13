import type { Metadata } from "next";
import "./globals.css";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "계곡모아 | 대한민국 계곡 정보",
    template: "%s | 계곡모아",
  },

  description:
    "전국 계곡의 위치, 전화번호, 주차, 화장실, 물놀이 정보를 한곳에서 확인하세요.",

  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
  ),

  openGraph: {
    title: "계곡모아 | 대한민국 계곡 정보",
    description:
      "전국 계곡의 위치와 방문 정보를 한곳에서 확인하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "계곡모아",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Header />

        {children}

        <Footer />
      </body>
    </html>
  );
}