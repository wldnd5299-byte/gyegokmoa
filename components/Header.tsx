"use client";

import Link from "next/link";
import {
  Gift,
  Map,
  Menu,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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

        {/* 브랜드 */}
        <Link
          href="/"
          className="parent-brand"
          aria-label="엄마랑 아빠랑 홈"
        >
          <div className="parent-brand-text">
            <strong>엄마랑 아빠랑</strong>
            <span>부모님과 함께 더 행복한 시간</span>
          </div>

          <div
            className="parent-brand-symbol"
            aria-hidden="true"
          >
            <span className="parent-symbol-head parent-symbol-head-one" />
            <span className="parent-symbol-head parent-symbol-head-two" />
            <span className="parent-symbol-line parent-symbol-line-one" />
            <span className="parent-symbol-line parent-symbol-line-two" />
          </div>
        </Link>

        {/* PC 메뉴 */}
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

        {/* 모바일 버튼 */}
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

      {/* 모바일 메뉴 */}
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