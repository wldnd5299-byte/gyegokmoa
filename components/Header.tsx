"use client";

import Link from "next/link";
import { Gift, Map, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function FlightHeartLogo() {
  return (
    <svg
      className="parent-flight-logo"
      viewBox="0 0 110 62"
      aria-hidden="true"
      focusable="false"
    >
      {/* 참고 이미지처럼: 왼쪽에서 들어와 하트 하단을 교차한 뒤 오른쪽 위로 이어지는 한 줄 */}
      <path
        className="parent-flight-heart-line"
        d="
          M 4 54
          C 20 49, 31 46, 43 43
          C 52 41, 58 38, 62 34
          C 53 30, 47 24, 47 17
          C 47 10, 52 6, 58 6
          C 64 6, 68 10, 70 16
          C 72 10, 76 6, 82 6
          C 88 6, 93 10, 93 17
          C 93 25, 87 33, 78 39
          C 70 44, 61 46, 53 45
          C 66 48, 80 46, 91 40
          C 98 36, 104 31, 108 26
        "
      />

      {/* 참고 이미지처럼 오른쪽 위를 향하는 명확한 비행기 실루엣 */}
      <g
        className="parent-flight-plane"
        transform="translate(94 16) rotate(-21)"
      >
        <path d="
          M 0 7
          L 7 5.8
          L 12.8 0
          L 15.3 0.7
          L 12.4 6
          L 19.7 7.7
          L 19.9 10
          L 12.2 9.5
          L 14.2 15
          L 12.2 16
          L 7 10.3
          L 1 9.6
          Z
        " />
      </g>
    </svg>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="parent-site-header">
      <div className="container parent-header-inner">
        <Link
          href="/"
          className="parent-brand"
          aria-label="엄마랑 아빠랑 홈"
        >
          <div className="parent-brand-text">
            <strong>엄마랑 아빠랑</strong>
            <span>함께한 오늘, 오래도록</span>
          </div>

          <FlightHeartLogo />
        </Link>

        <nav
          className="parent-desktop-nav"
          aria-label="주요 메뉴"
        >
          <Link href="/places?type=attraction">
            가볼만한 곳
          </Link>

          <Link href="/places?type=restaurant">
            맛집
          </Link>

          <Link href="/places?type=cafe">
            카페
          </Link>

          <Link href="/places?type=accommodation">
            숙소
          </Link>

          <Link href="/courses">
            추천코스
          </Link>

          <Link href="/gifts">
            부모님 선물
          </Link>

          <Link
            href="/map"
            className="parent-header-icon-link"
          >
            <Map size={18} />
            <span>지도</span>
          </Link>

          <Link
            href="/search"
            className="parent-header-search"
            aria-label="검색"
          >
            <Search size={21} />
          </Link>
        </nav>

        <button
          type="button"
          className="parent-mobile-menu-button"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? (
            <X size={25} />
          ) : (
            <Menu size={25} />
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="parent-mobile-navigation">
          <nav
            className="container parent-mobile-navigation-inner"
            aria-label="모바일 주요 메뉴"
          >
            <Link href="/places?type=attraction">
              가볼만한 곳
            </Link>

            <Link href="/places?type=restaurant">
              맛집
            </Link>

            <Link href="/places?type=cafe">
              카페
            </Link>

            <Link href="/places?type=accommodation">
              숙소
            </Link>

            <Link href="/courses">
              추천코스
            </Link>

            <Link href="/gifts">
              <Gift size={18} />
              부모님 선물
            </Link>

            <Link href="/map">
              <Map size={18} />
              지도에서 찾기
            </Link>

            <Link href="/search">
              <Search size={18} />
              검색
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
