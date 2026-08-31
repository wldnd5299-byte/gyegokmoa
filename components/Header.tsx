"use client";

import Link from "next/link";
import { Gift, Map, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function FlightHeartLogo() {
  return (
    <svg
      className="parent-flight-logo parent-landscape-logo"
      viewBox="0 0 96 56"
      aria-hidden="true"
      focusable="false"
    >
      {/* 산 능선 */}
      <path
        className="parent-landscape-mountain"
        d="M8 35 C20 27 30 17 41 8 C44 5.5 47 5.5 50 8 C59 17 68 27 86 35"
      />

      {/* 해 */}
      <circle
        className="parent-landscape-sun"
        cx="76"
        cy="17"
        r="7.5"
      />

      {/* 아래쪽 길/강 - 참고 이미지처럼 두 개의 부드러운 곡선 */}
      <path
        className="parent-landscape-road parent-landscape-road-left"
        d="M5 43 C22 46 37 41 52 44"
      />
      <path
        className="parent-landscape-road parent-landscape-road-right"
        d="M35 49 C47 54 66 51 91 47"
      />
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
