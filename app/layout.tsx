import type { Metadata } from "next";
import "./globals.css";
import "../styles/header.css";
import "../styles/home.css";
import "../styles/map.css";
import "../styles/admin.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "엄마랑 아빠랑 | 부모님과 함께 가기 좋은 곳",
    template: "%s | 엄마랑 아빠랑",
  },

  description:
    "부모님과 함께 가기 좋은 여행지, 맛집, 카페, 숙소와 추천코스를 한곳에서 찾아보세요.",

  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
  ),

  openGraph: {
    title: "엄마랑 아빠랑 | 부모님과 함께 가기 좋은 곳",
    description:
      "부모님과 함께하기 좋은 장소와 맛집, 카페, 숙소, 추천코스를 한곳에서 찾아보세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "엄마랑 아빠랑",
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