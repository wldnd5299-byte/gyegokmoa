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
      <path
        className="parent-flight-heart-line"
        d="M5 43 C15 37, 23 34, 31 34 C24 29, 20 23, 21 17 C22 10, 28 7, 33 11 C36 13, 38 16, 39 19 C40 16, 42 13, 45 11 C50 7, 56 10, 57 17 C58 24, 53 30, 47 34 C55 35, 63 32, 70 24"
      />
      <g className="parent-flight-plane" transform="translate(67 16) rotate(-16)">
        <path d="M0 4.6 9.8 0 7.1 4.2 11.6 6.1 10.5 8.2 5.8 6.6 3.1 10.7 1.7 10.1 2.9 5.7 0 4.6Z" />
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
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="parent-site-header">
      <div className="container parent-header-inner">
        <Link href="/" className="parent-brand" aria-label="엄마랑 아빠랑 홈">
          <div className="parent-brand-text">
            <strong>엄마랑 아빠랑</strong>
            <span>함께한 오늘, 오래도록</span>
          </div>
          <FlightHeartLogo />
        </Link>

        <nav className="parent-desktop-nav" aria-label="주요 메뉴">
          <Link href="/places?type=attraction">가볼만한 곳</Link>
          <Link href="/places?type=restaurant">맛집</Link>
          <Link href="/places?type=cafe">카페</Link>
          <Link href="/places?type=accommodation">숙소</Link>
          <Link href="/courses">추천코스</Link>
          <Link href="/gifts">부모님 선물</Link>

          <Link href="/map" className="parent-header-icon-link">
            <Map size={18} />
            <span>지도</span>
          </Link>

          <Link href="/search" className="parent-header-search" aria-label="검색">
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
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {menuOpen && (
        <div className="parent-mobile-navigation">
          <nav className="container parent-mobile-navigation-inner" aria-label="모바일 주요 메뉴">
            <Link href="/places?type=attraction">가볼만한 곳</Link>
            <Link href="/places?type=restaurant">맛집</Link>
            <Link href="/places?type=cafe">카페</Link>
            <Link href="/places?type=accommodation">숙소</Link>
            <Link href="/courses">추천코스</Link>
            <Link href="/gifts"><Gift size={18} />부모님 선물</Link>
            <Link href="/map"><Map size={18} />지도에서 찾기</Link>
            <Link href="/search"><Search size={18} />검색</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
