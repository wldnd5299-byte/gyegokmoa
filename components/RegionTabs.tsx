"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type RegionTabsProps = {
  selectedRegion: string;
  onChange: (region: string) => void;
};

const REGIONS = [
  "전체",
  "서울",
  "경기북부",
  "경기남부",
  "인천",
  "강원",
  "충북",
  "충남",
  "대전",
  "세종",
  "전북",
  "전남",
  "광주",
  "경북",
  "경남",
  "대구",
  "부산",
  "울산",
  "제주",
];

export default function RegionTabs({
  selectedRegion,
  onChange,
}: RegionTabsProps) {
  const scrollRef =
    useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] =
    useState(false);

  const [canScrollRight, setCanScrollRight] =
    useState(false);

  function updateScrollButtons() {
    const element = scrollRef.current;

    if (!element) return;

    setCanScrollLeft(
      element.scrollLeft > 4
    );

    setCanScrollRight(
      element.scrollLeft +
        element.clientWidth <
        element.scrollWidth - 4
    );
  }

  function move(direction: "left" | "right") {
    const element = scrollRef.current;

    if (!element) return;

    const distance =
      Math.max(
        element.clientWidth * 0.65,
        300
      );

    element.scrollBy({
      left:
        direction === "right"
          ? distance
          : -distance,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    updateScrollButtons();

    element.addEventListener(
      "scroll",
      updateScrollButtons,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      updateScrollButtons
    );

    return () => {
      element.removeEventListener(
        "scroll",
        updateScrollButtons
      );

      window.removeEventListener(
        "resize",
        updateScrollButtons
      );
    };
  }, []);

  return (
    <div className="region-tabs-shell">

      {canScrollLeft && (
        <button
          type="button"
          className="region-arrow region-arrow-left"
          onClick={() => move("left")}
          aria-label="이전 지역 보기"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="region-tabs-scroll"
      >
        {REGIONS.map((region) => (
          <button
            key={region}
            type="button"
            className={
              selectedRegion === region
                ? "region-tab active"
                : "region-tab"
            }
            onClick={() =>
              onChange(region)
            }
          >
            {region}
          </button>
        ))}
      </div>

      {canScrollRight && (
        <button
          type="button"
          className="region-arrow region-arrow-right"
          onClick={() => move("right")}
          aria-label="다음 지역 보기"
        >
          <ChevronRight size={20} />
        </button>
      )}

    </div>
  );
}