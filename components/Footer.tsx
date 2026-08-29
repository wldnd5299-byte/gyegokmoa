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
            aria-label="엄마랑 아빠랑 홈"
          >
            <span className="footer-brand-mark">
              <Map
                size={20}
                aria-hidden="true"
              />
            </span>

            <strong>
              엄마랑 아빠랑
            </strong>
          </Link>

          <p>
            부모님과 함께 가기 좋은 장소와
            따뜻한 하루 코스를
            쉽고 편리하게 찾아보세요.
          </p>
        </div>

        <nav
          className="footer-links"
          aria-label="하단 메뉴"
        >
          <Link href="/search">
            <Search
              size={15}
              aria-hidden="true"
            />
            장소 검색
          </Link>

          <Link href="/map">
            <MapPin
              size={15}
              aria-hidden="true"
            />
            지도에서 찾기
          </Link>

          <Link href="/courses">
            <Map
              size={15}
              aria-hidden="true"
            />
            추천코스
          </Link>

          <Link href="/about">
            <Info
              size={15}
              aria-hidden="true"
            />
            서비스 소개
          </Link>

          <Link href="/correction">
            <FileText
              size={15}
              aria-hidden="true"
            />
            정보 수정 요청
          </Link>

          <Link href="/privacy">
            <ShieldCheck
              size={15}
              aria-hidden="true"
            />
            개인정보처리방침
          </Link>
        </nav>
      </div>

      <div className="container footer-notice">
        <p>
          장소의 운영시간, 이용 가능 여부,
          주차 및 편의시설 등의 정보는
          현장 상황에 따라 달라질 수 있습니다.
          방문 전 최신 정보를 확인해 주세요.
        </p>
      </div>

      <div className="container copyright">
        © 2026 엄마랑 아빠랑. All rights reserved.
      </div>
    </footer>
  );
}