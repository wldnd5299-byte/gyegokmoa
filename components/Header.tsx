"use client";

import Link from "next/link";

import {
  Map,
  Menu,
  Search,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function Header() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const pathname = usePathname();

  // 페이지 이동 시 모바일 메뉴 자동 닫기
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // ESC 키로 메뉴 닫기
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <header className="site-header">
      <div className="container header-inner">

        {/* 로고 */}
        <Link
          href="/"
          className="brand"
          aria-label="계곡모아 홈"
        >
          <span className="brand-mark">
            <Map
              size={21}
              aria-hidden="true"
            />
          </span>

          <span>
            계곡모아
          </span>
        </Link>


        {/* PC 메뉴 */}
        <nav
          className="desktop-nav"
          aria-label="주요 메뉴"
        >
          <Link href="/#search">
            계곡 검색
          </Link>

          <Link href="/map">
            지도에서 찾기
          </Link>
        </nav>


        {/* 모바일 메뉴 버튼 */}
        <button
          type="button"
          className="mobile-menu"
          aria-label={
            menuOpen
              ? "메뉴 닫기"
              : "메뉴 열기"
          }
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() =>
            setMenuOpen(
              (current) => !current
            )
          }
        >
          {menuOpen ? (
            <X
              size={25}
              aria-hidden="true"
            />
          ) : (
            <Menu
              size={25}
              aria-hidden="true"
            />
          )}
        </button>
      </div>


      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="mobile-navigation"
        >
          <nav
            className="container mobile-navigation-inner"
            aria-label="모바일 주요 메뉴"
          >
            <Link
              href="/#search"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              <Search
                size={19}
                aria-hidden="true"
              />

              <div>
                <strong>
                  계곡 검색
                </strong>

                <span>
                  이름이나 지역으로
                  계곡을 찾아보세요.
                </span>
              </div>
            </Link>

            <Link
              href="/map"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              <Map
                size={19}
                aria-hidden="true"
              />

              <div>
                <strong>
                  지도에서 찾기
                </strong>

                <span>
                  지도에서 전국 계곡의
                  위치를 확인하세요.
                </span>
              </div>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}