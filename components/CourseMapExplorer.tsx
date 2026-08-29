"use client";

import Link from "next/link";

import {
  Coffee,
  Hotel,
  MapPin,
  Route,
  Search,
  Utensils,
  X,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import KakaoMap, {
  type MapFocusLocation,
  type MapPlace,
  type MapPlaceType,
} from "@/components/KakaoMap";

import {
  REGION_SEARCH_ITEMS,
  type RegionSearchItem,
} from "@/data/korea-regions";

import type {
  CourseWithPlaces,
} from "@/lib/courses";

type CourseMapExplorerProps = {
  courses: CourseWithPlaces[];
};

type SearchSuggestion =
  | {
      kind: "region";
      label: string;
      meta: string;
      region: RegionSearchItem;
    }
  | {
      kind: "address";
      label: string;
      meta: string;
      region: RegionSearchItem | null;
    };

function normalizeSearchText(
  value: string
) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(
      /서울특별시/g,
      "서울"
    )
    .replace(
      /부산광역시/g,
      "부산"
    )
    .replace(
      /대구광역시/g,
      "대구"
    )
    .replace(
      /인천광역시/g,
      "인천"
    )
    .replace(
      /광주광역시/g,
      "광주"
    )
    .replace(
      /대전광역시/g,
      "대전"
    )
    .replace(
      /울산광역시/g,
      "울산"
    )
    .replace(
      /세종특별자치시/g,
      "세종"
    )
    .replace(
      /경기도/g,
      "경기"
    )
    .replace(
      /강원특별자치도|강원도/g,
      "강원"
    )
    .replace(
      /충청북도/g,
      "충북"
    )
    .replace(
      /충청남도/g,
      "충남"
    )
    .replace(
      /전북특별자치도|전라북도/g,
      "전북"
    )
    .replace(
      /전라남도/g,
      "전남"
    )
    .replace(
      /경상북도/g,
      "경북"
    )
    .replace(
      /경상남도/g,
      "경남"
    )
    .replace(
      /제주특별자치도|제주도/g,
      "제주"
    );
}

function compactRegionText(
  value: string
) {
  return normalizeSearchText(
    value
  );
}

function getTypeLabel(
  type: string
) {
  switch (type) {
    case "attraction":
      return "가볼만한 곳";

    case "restaurant":
      return "맛집";

    case "cafe":
      return "카페";

    case "accommodation":
      return "숙소";

    default:
      return "";
  }
}

function StopIcon({
  type,
}: {
  type: string;
}) {
  if (
    type ===
    "restaurant"
  ) {
    return (
      <Utensils
        size={14}
      />
    );
  }

  if (
    type === "cafe"
  ) {
    return (
      <Coffee
        size={14}
      />
    );
  }

  if (
    type ===
    "accommodation"
  ) {
    return (
      <Hotel
        size={14}
      />
    );
  }

  return (
    <MapPin
      size={14}
    />
  );
}

function getAdministrativeAreaLabel(
  address: string
) {
  const parts =
    address
      .trim()
      .split(/\s+/)
      .filter(
        Boolean
      );

  if (
    parts.length <=
    3
  ) {
    return parts.join(
      " "
    );
  }

  const districtIndex =
    parts.findIndex(
      (
        part,
        index
      ) =>
        index >= 1 &&
        /(읍|면|동)$/.test(
          part
        )
    );

  if (
    districtIndex >=
    0
  ) {
    return parts
      .slice(
        0,
        districtIndex +
          1
      )
      .join(" ");
  }

  return parts
    .slice(
      0,
      3
    )
    .join(" ");
}

function findRegionItemForAddress(
  address: string
) {
  const normalizedAddress =
    normalizeSearchText(
      address
    );

  const matches =
    REGION_SEARCH_ITEMS
      .filter(
        (
          item
        ) =>
          Boolean(
            item.city
          )
      )
      .filter(
        (
          item
        ) => {
          const province =
            normalizeSearchText(
              item.province
            );

          const city =
            normalizeSearchText(
              item.city ||
                ""
            );

          return (
            normalizedAddress.includes(
              province
            ) &&
            normalizedAddress.includes(
              city
            )
          );
        }
      );

  return (
    matches[0] ||
    null
  );
}

function getCourseSearchText(
  course: CourseWithPlaces
) {
  const placeText =
    course.places
      .map(
        ({
          place,
        }) =>
          [
            place.name,
            place.region,
            place.city,
            place.address,
          ]
            .filter(
              Boolean
            )
            .join(" ")
      )
      .join(" ");

  return normalizeSearchText(
    [
      course.title,

      course.region,

      course.city ||
        "",

      course.summary,

      placeText,
    ].join(" ")
  );
}

export default function CourseMapExplorer({
  courses,
}: CourseMapExplorerProps) {
  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    appliedSearch,
    setAppliedSearch,
  ] =
    useState("");

  const [
    searchOpen,
    setSearchOpen,
  ] =
    useState(
      false
    );

  const [
    selectedRegion,
    setSelectedRegion,
  ] =
    useState<RegionSearchItem | null>(
      null
    );

  const [
    freeRegionSearch,
    setFreeRegionSearch,
  ] =
    useState("");

  const [
    addressSuggestions,
    setAddressSuggestions,
  ] =
    useState<
      SearchSuggestion[]
    >([]);

  const [
    selectedCourseId,
    setSelectedCourseId,
  ] =
    useState<
      number | null
    >(null);

  const addressRequestRef =
    useRef(
      0
    );

  /*
   * 모바일에서 코스를 직접 선택하면
   * 아래 지도까지 자연스럽게 이동합니다.
   */
  const mapSectionRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const searchableCourses =
    useMemo(
      () => {
        return courses.map(
          (
            course
          ) => ({
            course,

            searchableText:
              getCourseSearchText(
                course
              ),
          })
        );
      },
      [
        courses,
      ]
    );

  /*
   * 읍·면·동 자동완성
   */
  useEffect(() => {
    const input =
      searchInput.trim();

    if (
      !input ||
      input.length <
        2
    ) {
      setAddressSuggestions(
        []
      );

      return;
    }

    const requestId =
      ++addressRequestRef.current;

    const timer =
      window.setTimeout(
        () => {
          const kakao =
            (
              window as any
            ).kakao;

          if (
            !kakao
              ?.maps
              ?.services
              ?.Geocoder
          ) {
            setAddressSuggestions(
              []
            );

            return;
          }

          const geocoder =
            new kakao.maps.services.Geocoder();

          const keyword =
            input.trim();

          const candidates =
            new Set<string>();

          candidates.add(
            keyword
          );

          const compact =
            compactRegionText(
              keyword
            );

          if (
            !/(읍|면|동)$/.test(
              compact
            )
          ) {
            candidates.add(
              `${keyword}읍`
            );

            candidates.add(
              `${keyword}면`
            );

            candidates.add(
              `${keyword}동`
            );
          }

          const searches =
            Array.from(
              candidates
            ).map(
              (
                candidate
              ) =>
                new Promise<
                  SearchSuggestion[]
                >(
                  (
                    resolve
                  ) => {
                    geocoder.addressSearch(
                      candidate,

                      (
                        result: any[],
                        status: any
                      ) => {
                        if (
                          status !==
                            kakao
                              .maps
                              .services
                              .Status
                              .OK ||
                          !result
                            ?.length
                        ) {
                          resolve(
                            []
                          );

                          return;
                        }

                        resolve(
                          result
                            .slice(
                              0,
                              5
                            )
                            .map(
                              (
                                item
                              ) => {
                                const rawAddress =
                                  item.address_name ||
                                  item
                                    .address
                                    ?.address_name ||
                                  candidate;

                                return {
                                  kind:
                                    "address" as const,

                                  label:
                                    getAdministrativeAreaLabel(
                                      rawAddress
                                    ),

                                  meta:
                                    "읍·면·동",

                                  region:
                                    findRegionItemForAddress(
                                      rawAddress
                                    ),
                                };
                              }
                            )
                        );
                      },

                      {
                        analyze_type:
                          kakao
                            .maps
                            .services
                            .AnalyzeType
                            ?.SIMILAR ||
                          "SIMILAR",

                        size:
                          10,
                      }
                    );
                  }
                )
            );

          Promise.all(
            searches
          ).then(
            (
              groups
            ) => {
              if (
                requestId !==
                addressRequestRef
                  .current
              ) {
                return;
              }

              const unique =
                new Map<
                  string,
                  SearchSuggestion
                >();

              groups
                .flat()
                .forEach(
                  (
                    item
                  ) => {
                    unique.set(
                      item.label,
                      item
                    );
                  }
                );

              setAddressSuggestions(
                Array.from(
                  unique.values()
                ).slice(
                  0,
                  6
                )
              );
            }
          );
        },
        220
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    searchInput,
  ]);

  /*
   * 지역 자동완성
   */
  const suggestions =
    useMemo<
      SearchSuggestion[]
    >(
      () => {
        const input =
          searchInput.trim();

        if (
          !input
        ) {
          return [];
        }

        const normalized =
          normalizeSearchText(
            input
          );

        const regionSuggestions =
          REGION_SEARCH_ITEMS
            .map(
              (
                region
              ) => {
                const aliases =
                  region.aliases.map(
                    (
                      alias
                    ) =>
                      normalizeSearchText(
                        alias
                      )
                  );

                let score =
                  99;

                if (
                  aliases.some(
                    (
                      alias
                    ) =>
                      alias ===
                      normalized
                  )
                ) {
                  score =
                    0;
                } else if (
                  aliases.some(
                    (
                      alias
                    ) =>
                      alias.startsWith(
                        normalized
                      )
                  )
                ) {
                  score =
                    1;
                } else if (
                  aliases.some(
                    (
                      alias
                    ) =>
                      alias.includes(
                        normalized
                      )
                  )
                ) {
                  score =
                    2;
                } else {
                  return null;
                }

                return {
                  region,
                  score,
                };
              }
            )
            .filter(
              (
                item
              ): item is {
                region: RegionSearchItem;
                score: number;
              } =>
                item !==
                null
            )
            .sort(
              (
                a,
                b
              ) =>
                a.score -
                  b.score ||
                a.region.label.localeCompare(
                  b.region
                    .label,
                  "ko"
                )
            )
            .slice(
              0,
              6
            )
            .map(
              ({
                region,
              }) => ({
                kind:
                  "region" as const,

                label:
                  region.label,

                meta:
                  region.city
                    ? "시·군·구"
                    : "시·도",

                region,
              })
            );

        const unique =
          new Map<
            string,
            SearchSuggestion
          >();

        [
          ...regionSuggestions,
          ...addressSuggestions,
        ].forEach(
          (
            suggestion
          ) => {
            unique.set(
              suggestion.label,
              suggestion
            );
          }
        );

        return Array.from(
          unique.values()
        ).slice(
          0,
          10
        );
      },
      [
        searchInput,
        addressSuggestions,
      ]
    );

  /*
   * 추천코스 검색
   */
  const filteredCourses =
    useMemo(
      () => {
        if (
          !appliedSearch
        ) {
          return [];
        }

        const target =
          normalizeSearchText(
            appliedSearch
          );

        return searchableCourses
          .filter(
            ({
              searchableText,
            }) => {
              if (
                selectedRegion
              ) {
                const province =
                  normalizeSearchText(
                    selectedRegion.province
                  );

                const city =
                  normalizeSearchText(
                    selectedRegion.city ||
                      ""
                  );

                const hasProvince =
                  searchableText.includes(
                    province
                  );

                const hasCity =
                  !city ||
                  searchableText.includes(
                    city
                  );

                if (
                  freeRegionSearch
                ) {
                  const freeTarget =
                    normalizeSearchText(
                      freeRegionSearch
                    );

                  return (
                    hasProvince &&
                    hasCity &&
                    searchableText.includes(
                      freeTarget
                    )
                  );
                }

                return (
                  hasProvince &&
                  hasCity
                );
              }

              return searchableText.includes(
                target
              );
            }
          )
          .map(
            ({
              course,
            }) =>
              course
          );
      },
      [
        courses,
        searchableCourses,
        appliedSearch,
        selectedRegion,
        freeRegionSearch,
      ]
    );

  /*
   * 검색 결과가 바뀌면
   * 첫 번째 추천코스 선택
   */
  useEffect(() => {
    if (
      filteredCourses.length ===
      0
    ) {
      setSelectedCourseId(
        null
      );

      return;
    }

    const exists =
      filteredCourses.some(
        (
          course
        ) =>
          course.id ===
          selectedCourseId
      );

    if (
      !exists
    ) {
      setSelectedCourseId(
        filteredCourses[0]
          .id
      );
    }
  }, [
    filteredCourses,
    selectedCourseId,
  ]);

  const selectedCourse =
    useMemo(
      () => {
        if (
          selectedCourseId ===
          null
        ) {
          return null;
        }

        return (
          filteredCourses.find(
            (
              course
            ) =>
              course.id ===
              selectedCourseId
          ) ||
          null
        );
      },
      [
        filteredCourses,
        selectedCourseId,
      ]
    );

  /*
   * 선택한 코스 장소를
   * stop_order 순서 그대로
   * KakaoMap에 전달
   */
  const mapPlaces =
    useMemo<
      MapPlace[]
    >(
      () => {
        if (
          !selectedCourse
        ) {
          return [];
        }

        return selectedCourse.places
          .filter(
            ({
              place,
            }) =>
              typeof place.latitude ===
                "number" &&
              typeof place.longitude ===
                "number"
          )
          .map(
            ({
              place,
            }) => ({
              id:
                place.id,

              name:
                place.name,

              slug:
                place.slug,

              place_type:
                place.place_type as MapPlaceType,

              latitude:
                place.latitude as number,

              longitude:
                place.longitude as number,

              driving_latitude:
                place.driving_latitude,

              driving_longitude:
                place.driving_longitude,
            })
          );
      },
      [
        selectedCourse,
      ]
    );

  const mapFocusLocation:
    MapFocusLocation | null =
    freeRegionSearch
      ? {
          key:
            `course-free-${freeRegionSearch}`,

          address:
            freeRegionSearch,

          level:
            6,
        }
      : selectedRegion
        ? {
            key:
              `course-${selectedRegion.key}`,

            address:
              selectedRegion.label,

            latitude:
              selectedRegion.latitude,

            longitude:
              selectedRegion.longitude,

            level:
              selectedRegion.level,
          }
        : null;

  function applyGeneralSearch(
    value: string
  ) {
    const next =
      value.trim();

    setSearchInput(
      next
    );

    setAppliedSearch(
      next
    );

    setSelectedRegion(
      null
    );

    setFreeRegionSearch(
      next
    );

    setSearchOpen(
      false
    );
  }

  function applyRegionSearch(
    region: RegionSearchItem
  ) {
    setSearchInput(
      region.label
    );

    setAppliedSearch(
      region.label
    );

    setSelectedRegion(
      region
    );

    setFreeRegionSearch(
      ""
    );

    setSearchOpen(
      false
    );
  }

  function applyAddressSearch(
    suggestion: Extract<
      SearchSuggestion,
      {
        kind:
          "address";
      }
    >
  ) {
    setSearchInput(
      suggestion.label
    );

    setAppliedSearch(
      suggestion.label
    );

    setSelectedRegion(
      suggestion.region
    );

    setFreeRegionSearch(
      suggestion.label
    );

    setSearchOpen(
      false
    );
  }

  function clearSearch() {
    setSearchInput(
      ""
    );

    setAppliedSearch(
      ""
    );

    setSelectedRegion(
      null
    );

    setFreeRegionSearch(
      ""
    );

    setSearchOpen(
      false
    );

    setAddressSuggestions(
      []
    );
  }

  function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    const input =
      searchInput.trim();

    if (
      !input
    ) {
      clearSearch();

      return;
    }

    const normalized =
      normalizeSearchText(
        input
      );

    const exactSuggestion =
      suggestions.find(
        (
          suggestion
        ) =>
          normalizeSearchText(
            suggestion.label
          ) ===
          normalized
      );

    if (
      exactSuggestion
        ?.kind ===
      "address"
    ) {
      applyAddressSearch(
        exactSuggestion
      );

      return;
    }

    if (
      exactSuggestion
        ?.kind ===
      "region"
    ) {
      applyRegionSearch(
        exactSuggestion.region
      );

      return;
    }

    const firstAddress =
      suggestions.find(
        (
          suggestion
        ): suggestion is Extract<
          SearchSuggestion,
          {
            kind:
              "address";
          }
        > =>
          suggestion.kind ===
          "address"
      );

    if (
      firstAddress
    ) {
      applyAddressSearch(
        firstAddress
      );

      return;
    }

    const firstRegion =
      suggestions.find(
        (
          suggestion
        ): suggestion is Extract<
          SearchSuggestion,
          {
            kind:
              "region";
          }
        > =>
          suggestion.kind ===
          "region"
      );

    if (
      firstRegion
    ) {
      applyRegionSearch(
        firstRegion.region
      );

      return;
    }

    applyGeneralSearch(
      input
    );
  }

  function selectCourse(
    courseId: number
  ) {
    setSelectedCourseId(
      courseId
    );

    if (
      typeof window ===
        "undefined" ||
      !window.matchMedia(
        "(max-width: 700px)"
      ).matches
    ) {
      return;
    }

    window.setTimeout(
      () => {
        mapSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      },
      80
    );
  }

  return (
    <section className="course-explorer">
      <div className="courses-container">
        {/* 검색 */}
        <div className="course-search-box">
          <div className="course-search-heading">
            <span>
              지역·추천코스 검색
            </span>

            <strong>
              부모님과 어디로
              떠나볼까요?
            </strong>
          </div>

          <form
            className="course-search-form"
            onSubmit={
              handleSubmit
            }
          >
            <Search
              size={20}
            />

            <input
              type="text"
              value={
                searchInput
              }
              onChange={(
                event
              ) => {
                setSearchInput(
                  event
                    .target
                    .value
                );

                setSearchOpen(
                  true
                );
              }}
              onFocus={() =>
                setSearchOpen(
                  true
                )
              }
              placeholder="가평, 강원 인제, 인제 기린 등을 검색해보세요"
              autoComplete="off"
            />

            {searchInput && (
              <button
                type="button"
                className="course-search-clear"
                onClick={
                  clearSearch
                }
              >
                <X
                  size={17}
                />
              </button>
            )}

            <button
              type="submit"
              className="course-search-submit"
            >
              검색
            </button>

            {searchOpen &&
              suggestions.length >
                0 && (
                <div className="course-search-suggestions">
                  {suggestions.map(
                    (
                      suggestion,
                      index
                    ) => (
                      <button
                        key={`${suggestion.kind}-${suggestion.label}-${index}`}
                        type="button"
                        className="course-search-suggestion"
                        onClick={() => {
                          if (
                            suggestion.kind ===
                            "address"
                          ) {
                            applyAddressSearch(
                              suggestion
                            );
                          } else {
                            applyRegionSearch(
                              suggestion.region
                            );
                          }
                        }}
                      >
                        <Search
                          size={15}
                        />

                        <span>
                          <strong>
                            {
                              suggestion.label
                            }
                          </strong>

                          <small>
                            {
                              suggestion.meta
                            }
                          </small>
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}
          </form>

          <div className="course-search-examples">
            <span>
              예)
            </span>

            {[
              "가평",
              "포천",
              "강원 인제",
              "인제 기린",
            ].map(
              (
                example
              ) => (
                <button
                  key={
                    example
                  }
                  type="button"
                  onClick={() => {
                    setSearchInput(
                      example
                    );

                    applyGeneralSearch(
                      example
                    );
                  }}
                >
                  {
                    example
                  }
                </button>
              )
            )}
          </div>
        </div>

        {/* 결과 */}
        <div className="course-result-top">
          <div>
            <span>
              {appliedSearch
                ? `"${appliedSearch}"`
                : "지역 검색"}
            </span>

            <strong>
              {appliedSearch
                ? `추천코스 ${filteredCourses.length}개`
                : "원하는 지역을 검색해주세요"}
            </strong>
          </div>

          {appliedSearch && (
            <button
              type="button"
              onClick={
                clearSearch
              }
            >
              검색 초기화
            </button>
          )}
        </div>

        <div
          className={[
            "course-map-split",
            !appliedSearch
              ? "is-before-search"
              : "is-after-search",
          ].join(" ")}
        >
          {/* 왼쪽 */}
          <aside className="course-map-sidebar">
            <div className="course-map-sidebar-heading">
              <div>
                <span>
                  검색 결과
                </span>

                <strong>
                  {
                    filteredCourses.length
                  }
                  개 코스
                </strong>
              </div>

              <p>
                코스를 선택하면
                오른쪽 지도에서
                이동 순서를 확인할
                수 있어요.
              </p>
            </div>

            {filteredCourses.length >
            0 ? (
              <div className="course-map-list-wrap">
                <div className="course-map-list">
                  {filteredCourses.map(
                  (
                    course
                  ) => {
                    const isSelected =
                      course.id ===
                      selectedCourseId;

                    return (
                      <article
                        key={
                          course.id
                        }
                        className={[
                          "course-map-card",

                          isSelected
                            ? "is-selected"
                            : "",
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          )}
                        onClick={() =>
                          selectCourse(
                            course.id
                          )
                        }
                      >
                        <button
                          type="button"
                          className="course-map-card-main"
                          onClick={() =>
                            selectCourse(
                              course.id
                            )
                          }
                        >
                          <div className="course-map-card-meta">
                            <span>
                              <MapPin
                                size={
                                  13
                                }
                              />

                              {
                                course.region
                              }{" "}
                              {course.city ||
                                ""}
                            </span>

                            {course.duration_label && (
                              <span>
                                {
                                  course.duration_label
                                }
                              </span>
                            )}
                          </div>

                          <h3>
                            {
                              course.title
                            }
                          </h3>

                          <p>
                            {
                              course.summary
                            }
                          </p>

                          <div className="course-map-stops">
                            {course.places
                              .slice(
                                0,
                                5
                              )
                              .map(
                                (
                                  coursePlace,
                                  index
                                ) => (
                                  <div
                                    key={
                                      coursePlace.id
                                    }
                                  >
                                    <span className="course-map-stop-number">
                                      {index +
                                        1}
                                    </span>

                                    <span className="course-map-stop-icon">
                                      <StopIcon
                                        type={
                                          coursePlace
                                            .place
                                            .place_type
                                        }
                                      />
                                    </span>

                                    <span className="course-map-stop-copy">
                                      <small>
                                        {getTypeLabel(
                                          coursePlace
                                            .place
                                            .place_type
                                        )}
                                      </small>

                                      <strong>
                                        {
                                          coursePlace
                                            .place
                                            .name
                                        }
                                      </strong>
                                    </span>
                                  </div>
                                )
                              )}

                            {course
                              .places
                              .length >
                              5 && (
                              <span className="course-map-more-stops">
                                +
                                {course
                                  .places
                                  .length -
                                  5}
                                곳
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="course-map-card-footer">
                          <span>
                            {isSelected
                              ? "지도에 표시 중"
                              : "지도에서 보기"}
                          </span>

                          <Link
                            href={`/courses/${course.slug}`}
                            onClick={(
                              event
                            ) =>
                              event.stopPropagation()
                            }
                          >
                            자세히 보기
                          </Link>
                        </div>
                      </article>
                    );
                  }
                  )}
                </div>

                {filteredCourses.length > 1 && (
                  <div
                    className="course-map-swipe-hint"
                    aria-hidden="true"
                  >
                    <span>
                      옆으로 밀어보세요
                    </span>

                    <strong>
                      ❯
                    </strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="course-map-empty">
                <Route
                  size={25}
                />

                {appliedSearch ? (
                  <>
                    <strong>
                      이 지역에는 아직
                      등록된 추천코스가
                      없어요.
                    </strong>

                    <p>
                      다른 지역을
                      검색해보세요.
                    </p>
                  </>
                ) : (
                  <>
                    <strong>
                      원하는 지역을
                      검색해주세요.
                    </strong>

                    <p>
                      가평, 포천, 강원 인제처럼
                      지역을 검색하면 추천코스를
                      확인할 수 있어요.
                    </p>
                  </>
                )}
              </div>
            )}
          </aside>

          {/* 오른쪽 */}
          <div
            ref={mapSectionRef}
            className="course-map-column"
            style={{
              scrollMarginTop: "74px",
            }}
          >
            <div className="course-map-selected-heading">
              {selectedCourse ? (
                <>
                  <span>
                    선택한 추천코스
                  </span>

                  <strong>
                    {
                      selectedCourse.title
                    }
                  </strong>

                  <small>
                    {
                      selectedCourse
                        .places
                        .length
                    }
                    개 장소
                  </small>
                </>
              ) : (
                <>
                  <span>
                    추천코스 지도
                  </span>

                  <strong>
                    지역을 검색해보세요
                  </strong>
                </>
              )}
            </div>

            {!appliedSearch ? (
              <div className="course-map-before-search">
                <div className="course-map-before-search-icon">
                  <Search size={25} />
                </div>

                <strong>
                  지역을 먼저 검색해주세요
                </strong>

                <p>
                  가평, 포천, 강원 인제처럼
                  원하는 지역을 검색하면
                  추천코스와 이동 경로를 보여드려요.
                </p>
              </div>
            ) : (
              <KakaoMap
                places={
                  mapPlaces
                }
                selectedPlaceId={
                  null
                }
                onSelectPlace={() => {
                  /*
                   * 현재는 마커 클릭 시
                   * 코스 자체는 유지합니다.
                   */
                }}
                focusLocation={
                  mapFocusLocation
                }
                courseMode
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .course-map-list-wrap {
          position: relative;
        }

        .course-map-swipe-hint {
          display: none;
        }

        /*
         * PC 검색 전에는 큰 지도 영역을 만들지 않습니다.
         * 검색한 뒤에만 외부 courses.css의 큰 지도 높이를 사용합니다.
         */
        @media (min-width: 1100px) {
          .course-map-split.is-before-search {
            min-height: 480px !important;
          }

          .course-map-split.is-before-search .course-map-sidebar {
            height: 480px !important;
            min-height: 480px !important;
            max-height: 480px !important;
          }

          .course-map-split.is-before-search .course-map-column {
            min-height: 480px;
          }

          .course-map-split.is-before-search .course-map-before-search {
            min-height: 410px !important;
            height: 410px;
          }
        }

        @media (max-width: 700px) {
          .course-map-list-wrap {
            padding-bottom: 28px;
          }

          .course-map-swipe-hint {
            position: absolute;
            right: 10px;
            bottom: 2px;
            display: flex;
            align-items: center;
            gap: 4px;
            color: #5f746c;
            font-size: 9px;
            font-weight: 700;
            pointer-events: none;
          }

          .course-map-swipe-hint strong {
            color: #2d6755;
            font-size: 23px;
            font-weight: 900;
            line-height: 1;
          }

          .course-map-card.is-selected {
            box-shadow: 0 0 0 2px rgba(45, 103, 85, 0.2);
          }
        }
      `}</style>
    </section>
  );
}