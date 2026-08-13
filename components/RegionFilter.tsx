"use client";

import {
  useMemo,
  useState,
} from "react";

import { Search } from "lucide-react";

import type {
  PublicValley,
} from "@/lib/valleys";

import {
  ValleyCard,
} from "@/components/ValleyCard";

type RegionFilterProps = {
  initialQuery?: string;
  valleys: PublicValley[];
};

export function RegionFilter({
  initialQuery = "",
  valleys,
}: RegionFilterProps) {
  const [region, setRegion] =
    useState("전체");

  const [query, setQuery] =
    useState(initialQuery);

  /*
   * 실제 등록되어 있는 지역을
   * Supabase 데이터에서 자동 생성
   */
  const regions =
    useMemo(() => {
      const regionList =
        Array.from(
          new Set(
            valleys
              .map(
                (valley) =>
                  valley.region
              )
              .filter(Boolean)
          )
        ).sort();

      return [
        "전체",
        ...regionList,
      ];
    }, [valleys]);

  /*
   * 지역 + 검색어 필터
   */
  const filtered =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      return valleys.filter(
        (valley) => {
          const regionMatch =
            region === "전체" ||
            valley.region === region;

          const searchableText =
            [
              valley.name,
              valley.region,
              valley.city,
              valley.address,
              valley.summary,
              ...(valley.tags ?? []),
            ]
              .join(" ")
              .toLowerCase();

          const queryMatch =
            !normalizedQuery ||
            searchableText.includes(
              normalizedQuery
            );

          return (
            regionMatch &&
            queryMatch
          );
        }
      );
    }, [
      valleys,
      region,
      query,
    ]);

  return (
    <>
      {/* 검색 */}
      <div className="list-search">
        <Search
          size={19}
          aria-hidden="true"
        />

        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          placeholder="계곡명, 지역 검색"
        />
      </div>

      {/* 지역 필터 */}
      <div className="region-tabs">
        {regions.map(
          (item) => (
            <button
              type="button"
              className={
                item === region
                  ? "active"
                  : ""
              }
              onClick={() =>
                setRegion(item)
              }
              key={item}
            >
              {item}
            </button>
          )
        )}
      </div>

      {/* 결과 개수 */}
      <p className="result-count">
        총{" "}
        <strong>
          {filtered.length}
        </strong>
        개의 계곡
      </p>

      {/* 계곡 카드 */}
      {filtered.length > 0 ? (
        <div className="card-grid">
          {filtered.map(
            (valley) => (
              <ValleyCard
                key={valley.id}
                valley={valley}
              />
            )
          )}
        </div>
      ) : (
        <div className="empty-state">
          검색 조건에 맞는 계곡이 없습니다.
        </div>
      )}
    </>
  );
}