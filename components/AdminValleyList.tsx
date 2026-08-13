"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  MapPinned,
  Pencil,
  Search,
} from "lucide-react";

import DeleteValleyButton from "@/components/DeleteValleyButton";

type AdminValley = {
  id: string;
  name: string;
  slug: string;
  region: string;
  city: string;

  address: string | null;
  summary: string | null;

  image_url: string | null;

  latitude: number | null;
  longitude: number | null;

  is_published: boolean;

  created_at: string | null;
};

type AdminValleyListProps = {
  valleys: AdminValley[];
};

function getMissingItems(
  valley: AdminValley
) {
  const missing: string[] = [];

  if (!valley.name?.trim()) {
    missing.push("계곡명");
  }

  if (!valley.slug?.trim()) {
    missing.push("영문 식별자");
  }

  if (!valley.region?.trim()) {
    missing.push("지역");
  }

  if (!valley.city?.trim()) {
    missing.push("시·군");
  }

  if (!valley.address?.trim()) {
    missing.push("주소");
  }

  if (!valley.summary?.trim()) {
    missing.push("간단 소개");
  }

  if (!valley.image_url?.trim()) {
    missing.push("대표사진");
  }

  if (
    typeof valley.latitude !==
      "number" ||
    !Number.isFinite(
      valley.latitude
    )
  ) {
    missing.push("위도");
  }

  if (
    typeof valley.longitude !==
      "number" ||
    !Number.isFinite(
      valley.longitude
    )
  ) {
    missing.push("경도");
  }

  return missing;
}

export default function AdminValleyList({
  valleys,
}: AdminValleyListProps) {
  const [query, setQuery] =
    useState("");

  const [region, setRegion] =
    useState("전체");

  const [status, setStatus] =
    useState("전체");

  const [readyStatus, setReadyStatus] =
    useState("전체");

  const [imageStatus, setImageStatus] =
    useState("전체");

  const publishedCount =
    valleys.filter(
      (valley) =>
        valley.is_published
    ).length;

  const unpublishedCount =
    valleys.length -
    publishedCount;

  const readyCount =
    valleys.filter(
      (valley) =>
        getMissingItems(
          valley
        ).length === 0
    ).length;

  const needsWorkCount =
    valleys.length -
    readyCount;

  const imageRegisteredCount =
    valleys.filter(
      (valley) =>
        Boolean(
          valley.image_url?.trim()
        )
    ).length;

  const imageMissingCount =
    valleys.length -
    imageRegisteredCount;

  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          valleys
            .map(
              (valley) =>
                valley.region
            )
            .filter(Boolean)
        )
      ).sort(),
    [valleys]
  );

  const filteredValleys =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      return valleys.filter(
        (valley) => {
          const missingItems =
            getMissingItems(
              valley
            );

          const isReady =
            missingItems.length ===
            0;

          const matchesQuery =
            !normalizedQuery ||
            [
              valley.name,
              valley.slug,
              valley.region,
              valley.city,
              valley.address ??
                "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                normalizedQuery
              );

          const matchesRegion =
            region === "전체" ||
            valley.region ===
              region;

          const matchesStatus =
            status === "전체" ||
            (status === "공개"
              ? valley.is_published
              : !valley.is_published);

          const matchesReady =
            readyStatus ===
              "전체" ||
            (readyStatus ===
            "준비완료"
              ? isReady
              : !isReady);

          const hasImage =
            Boolean(
              valley.image_url?.trim()
            );

          const matchesImage =
            imageStatus ===
              "전체" ||
            (imageStatus ===
            "등록완료"
              ? hasImage
              : !hasImage);

          return (
            matchesQuery &&
            matchesRegion &&
            matchesStatus &&
            matchesReady &&
            matchesImage
          );
        }
      );
    }, [
      valleys,
      query,
      region,
      status,
      readyStatus,
      imageStatus,
    ]);

  function resetFilters() {
    setQuery("");
    setRegion("전체");
    setStatus("전체");
    setReadyStatus("전체");
    setImageStatus("전체");
  }

  return (
    <section className="admin-list-section">
      <div className="admin-form-heading">
        <div>
          <h2>
            등록된 계곡 관리
          </h2>

          <p>
            공개 준비 상태와 등록 정보를
            확인하고 관리할 수 있습니다.
          </p>
        </div>

        <span>
          총 {valleys.length}개
        </span>
      </div>

      {/* 통계 */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span>
            전체 계곡
          </span>

          <strong>
            {valleys.length}
          </strong>
        </div>

        <div className="admin-stat-card is-published">
          <span>
            공개
          </span>

          <strong>
            {publishedCount}
          </strong>
        </div>

        <div className="admin-stat-card is-unpublished">
          <span>
            비공개
          </span>

          <strong>
            {unpublishedCount}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>
            공개 준비 완료
          </span>

          <strong>
            {readyCount}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>
            정보 보완 필요
          </span>

          <strong>
            {needsWorkCount}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>
            사진 등록 완료
          </span>

          <strong>
            {imageRegisteredCount}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>
            사진 미등록
          </span>

          <strong>
            {imageMissingCount}
          </strong>
        </div>
      </div>

      {/* 검색/필터 */}
      <div className="admin-filter-panel">
        <div className="admin-filter-search">
          <Search
            size={18}
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
            placeholder="계곡명, 지역, 시·군, 주소 검색"
          />
        </div>

        <select
          value={region}
          onChange={(event) =>
            setRegion(
              event.target.value
            )
          }
        >
          <option value="전체">
            전체 지역
          </option>

          {regions.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
        >
          <option value="전체">
            전체 상태
          </option>

          <option value="공개">
            공개
          </option>

          <option value="비공개">
            비공개
          </option>
        </select>

        <select
          value={readyStatus}
          onChange={(event) =>
            setReadyStatus(
              event.target.value
            )
          }
        >
          <option value="전체">
            전체 준비상태
          </option>

          <option value="준비완료">
            공개 준비 완료
          </option>

          <option value="보완필요">
            정보 보완 필요
          </option>
        </select>

        <select
          value={imageStatus}
          onChange={(event) =>
            setImageStatus(
              event.target.value
            )
          }
        >
          <option value="전체">
            전체 사진상태
          </option>

          <option value="등록완료">
            사진 등록 완료
          </option>

          <option value="미등록">
            사진 미등록
          </option>
        </select>

        <button
          type="button"
          className="admin-filter-reset"
          onClick={
            resetFilters
          }
        >
          초기화
        </button>
      </div>

      <div className="admin-filter-result">
        조건에 맞는 계곡{" "}
        <strong>
          {filteredValleys.length}
        </strong>
        개
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <button
          type="button"
          className="admin-filter-reset"
          onClick={() =>
            setImageStatus("전체")
          }
          style={{
            background:
              imageStatus === "전체"
                ? "#07866c"
                : undefined,
            color:
              imageStatus === "전체"
                ? "#ffffff"
                : undefined,
          }}
        >
          전체 사진 보기
        </button>

        <button
          type="button"
          className="admin-filter-reset"
          onClick={() =>
            setImageStatus("미등록")
          }
          style={{
            background:
              imageStatus === "미등록"
                ? "#07866c"
                : undefined,
            color:
              imageStatus === "미등록"
                ? "#ffffff"
                : undefined,
          }}
        >
          사진 미등록만 보기 ({imageMissingCount})
        </button>
      </div>

      {filteredValleys.length ===
      0 ? (
        <div className="admin-list-empty">
          조건에 맞는 계곡이
          없습니다.
        </div>
      ) : (
        <div className="admin-valley-list">
          {filteredValleys.map(
            (valley) => {
              const missingItems =
                getMissingItems(
                  valley
                );

              const isReady =
                missingItems.length ===
                0;

              const hasCoordinates =
                typeof valley.latitude ===
                  "number" &&
                typeof valley.longitude ===
                  "number";

              const createdDate =
                valley.created_at
                  ? new Intl.DateTimeFormat(
                      "ko-KR",
                      {
                        year:
                          "numeric",
                        month:
                          "2-digit",
                        day:
                          "2-digit",
                      }
                    ).format(
                      new Date(
                        valley.created_at
                      )
                    )
                  : "등록일 확인 필요";

              return (
                <article
                  key={valley.id}
                  className="admin-valley-item"
                >
                  {/* 사진 */}
                  <div className="admin-valley-image">
                    {valley.image_url ? (
                      <img
                        src={
                          valley.image_url
                        }
                        alt={
                          valley.name
                        }
                      />
                    ) : (
                      <div>
                        사진 없음
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="admin-valley-info">
                    <div>
                      <h3>
                        {
                          valley.name
                        }
                      </h3>

                      <p>
                        {
                          valley.region
                        }{" "}
                        ·{" "}
                        {
                          valley.city
                        }
                      </p>
                    </div>

                    <small>
                      {
                        valley.slug
                      }
                    </small>

                    <div className="admin-valley-meta">
                      <span>
                        <MapPinned
                          size={14}
                          aria-hidden="true"
                        />

                        {hasCoordinates
                          ? "지도 좌표 등록됨"
                          : "지도 좌표 없음"}
                      </span>

                      <span>
                        <CalendarDays
                          size={14}
                          aria-hidden="true"
                        />

                        {
                          createdDate
                        }
                      </span>
                    </div>

                    {isReady ? (
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "6px",
                          marginTop:
                            "10px",
                          color:
                            "#07866c",
                          fontSize:
                            "13px",
                          fontWeight:
                            800,
                        }}
                      >
                        <CheckCircle2
                          size={16}
                          aria-hidden="true"
                        />

                        공개 준비 완료
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop:
                            "10px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "6px",
                            color:
                              "#b36b00",
                            fontSize:
                              "13px",
                            fontWeight:
                              800,
                          }}
                        >
                          <AlertTriangle
                            size={16}
                            aria-hidden="true"
                          />

                          정보 보완 필요
                        </div>

                        <small
                          style={{
                            display:
                              "block",
                            marginTop:
                              "5px",
                            color:
                              "#8a6a3b",
                          }}
                        >
                          누락:{" "}
                          {missingItems.join(
                            ", "
                          )}
                        </small>
                      </div>
                    )}
                  </div>

                  {/* 공개상태 */}
                  <div className="admin-valley-status">
                    <span
                      className={
                        valley.is_published
                          ? "is-published"
                          : "is-unpublished"
                      }
                    >
                      {valley.is_published
                        ? "공개"
                        : "비공개"}
                    </span>
                  </div>

                  {/* 관리버튼 */}
                  <div className="admin-valley-actions">
                    <Link
                      href={`/admin/valleys/${valley.id}/preview`}
                      className="admin-action-button"
                    >
                      <Eye
                        size={16}
                        aria-hidden="true"
                      />
                      미리보기
                    </Link>

                    <Link
                      href={`/admin/valleys/${valley.id}/edit`}
                      className="admin-action-button"
                    >
                      <Pencil
                        size={16}
                        aria-hidden="true"
                      />
                      수정
                    </Link>

                    <form
                      action="/api/admin/valleys/toggle-publish"
                      method="post"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={
                          valley.id
                        }
                      />

                      <button
                        type="submit"
                        className="admin-action-button"
                        disabled={
                          !valley.is_published &&
                          !isReady
                        }
                        title={
                          !valley.is_published &&
                          !isReady
                            ? `먼저 보완해 주세요: ${missingItems.join(
                                ", "
                              )}`
                            : undefined
                        }
                        style={
                          !valley.is_published &&
                          !isReady
                            ? {
                                opacity:
                                  0.45,
                                cursor:
                                  "not-allowed",
                              }
                            : undefined
                        }
                      >
                        {valley.is_published ? (
                          <>
                            <EyeOff
                              size={16}
                              aria-hidden="true"
                            />
                            비공개
                          </>
                        ) : (
                          <>
                            <Eye
                              size={16}
                              aria-hidden="true"
                            />
                            공개
                          </>
                        )}
                      </button>
                    </form>

                    <DeleteValleyButton
                      id={
                        valley.id
                      }
                      name={
                        valley.name
                      }
                    />
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}