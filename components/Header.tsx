"use client";

import Link from "next/link";
import { Gift, Map, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function FlightHeartLogo() {
  return (
    <svg
      className="parent-flight-logo"
      viewBox="0 0 78 52"
      aria-hidden="true"
      focusable="false"
    >
      {/* 하트 아래 연결 간격을 좁힌 비행 경로 */}
      <path
        className="parent-flight-heart-line"
        d="M5 43
           C15 37, 25 35, 35 35
           C27 29, 23 23, 24 17
           C25 10, 30 7, 35 11
           C37.5 13, 39 15.5, 39 18.5
           C39 15.5, 40.5 13, 43 11
           C48 7, 53 10, 54 17
           C55 23, 51 29, 43 35
           C52 35, 61 32, 68 25"
      />

      {/* 오른쪽을 향하는 비행기 - 이전보다 크게 */}
      <g
        className="parent-flight-plane"
        transform="translate(64 18) scale(1.32)"
      >
        <path d="M0 5.2 12.5 1.1 10.1 5.2 15.2 7.1 14.2 9.2 8.8 7.5 5.9 12.2 4.3 11.4 5.8 6.7 0 5.2Z" />
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
