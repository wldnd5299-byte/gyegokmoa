import Link from "next/link";

import {
  FileText,
  Info,
  Map,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-area">
          <Link
            href="/"
            className="footer-brand"
            aria-label="계곡모아 홈"
          >
            <span className="footer-brand-mark">
              <Map
                size={20}
                aria-hidden="true"
              />
            </span>

            <strong>계곡모아</strong>
          </Link>

          <p>
            대한민국의 아름다운 계곡을
            쉽고 편리하게 찾아보세요.
          </p>
        </div>

        <nav
          className="footer-links"
          aria-label="하단 메뉴"
        >
          <Link href="/#search">
            <Search size={15} aria-hidden="true" />
            계곡 검색
          </Link>

          <Link href="/map">
            <MapPin size={15} aria-hidden="true" />
            지도에서 찾기
          </Link>

          <Link href="/about">
            <Info size={15} aria-hidden="true" />
            서비스 소개
          </Link>

          <Link href="/correction">
            <FileText size={15} aria-hidden="true" />
            정보 수정 요청
          </Link>

          <Link href="/privacy">
            <ShieldCheck size={15} aria-hidden="true" />
            개인정보처리방침
          </Link>
        </nav>
      </div>

      <div className="container footer-notice">
        <p>
          계곡의 수위, 출입 가능 여부,
          주차 및 편의시설 정보는 현장
          상황에 따라 달라질 수 있습니다.
          방문 전 최신 정보를 확인해 주세요.
        </p>
      </div>

      <div className="container copyright">
        © 2026 계곡모아. All rights reserved.
      </div>
    </footer>
  );
}