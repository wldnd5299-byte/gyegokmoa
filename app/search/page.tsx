import Image from "next/image";
import Link from "next/link";

import {
  BedDouble,
  Coffee,
  ImageIcon,
  MapPin,
  MapPinned,
  Search,
  Utensils,
} from "lucide-react";

import SearchAutocomplete from "@/components/SearchAutocomplete";

import {
  getPublishedPlaces,
  type Place,
  type PlaceType,
} from "@/lib/places";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

type SearchType =
  | "all"
  | PlaceType;

const TYPE_OPTIONS: {
  value: SearchType;
  label: string;
}[] = [
  { value: "all", label: "전체" },
  {
    value: "attraction",
    label: "가볼만한 곳",
  },
  {
    value: "restaurant",
    label: "맛집",
  },
  { value: "cafe", label: "카페" },
  {
    value: "accommodation",
    label: "숙소",
  },
];

const TYPE_LABELS: Record<
  PlaceType,
  string
> = {
  attraction: "가볼만한 곳",
  restaurant: "맛집",
  cafe: "카페",
  accommodation: "숙소",
};

/*
 * "유형 필터"로만 사용할 단어입니다.
 *
 * 중요:
 * 계곡 / 박물관 / 공원 같은 실제 검색 대상 단어는
 * 여기 넣지 않습니다.
 *
 * 예)
 * "가평 맛집" -> 맛집 필터 + 가평 검색
 * "명지계곡" -> '명지계곡' 자체를 검색
 */
const TYPE_INTENT_WORDS: Record<
  PlaceType,
  string[]
> = {
  attraction: [
    "가볼만한곳",
    "가볼곳",
    "갈곳",
    "나들이장소",
  ],
  restaurant: [
    "맛집",
    "식당",
    "음식점",
    "밥집",
  ],
  cafe: [
    "카페",
    "커피숍",
    "찻집",
  ],
  accommodation: [
    "숙소",
    "호텔",
    "펜션",
    "리조트",
    "숙박",
    "풀빌라",
  ],
};

const STOP_WORDS = new Set([
  "부모님",
  "엄마",
  "아빠",
  "함께",
  "추천",
  "좋은",
  "검색",
]);

/*
 * 지역명 표기를 하나로 통일합니다.
 *
 * 경기도 가평 / 경기 가평 / 경기도가평 / 경기가평
 * 모두 "경기가평"으로 맞춰집니다.
 */
function normalizeSearchText(
  value: string
) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(
      /강원특별자치도/g,
      "강원"
    )
    .replace(
      /전북특별자치도/g,
      "전북"
    )
    .replace(
      /제주특별자치도/g,
      "제주"
    )
    .replace(/경기도/g, "경기")
    .replace(/충청북도/g, "충북")
    .replace(/충청남도/g, "충남")
    .replace(/전라북도/g, "전북")
    .replace(/전라남도/g, "전남")
    .replace(/경상북도/g, "경북")
    .replace(/경상남도/g, "경남")
    .replace(/서울특별시/g, "서울")
    .replace(/부산광역시/g, "부산")
    .replace(/대구광역시/g, "대구")
    .replace(/인천광역시/g, "인천")
    .replace(/광주광역시/g, "광주")
    .replace(/대전광역시/g, "대전")
    .replace(/울산광역시/g, "울산")
    .replace(/세종특별자치시/g, "세종")
    .replace(
      /[(){}\[\],./\\|"'`~!@#$%^&*+=?<>:;_-]/g,
      ""
    );
}

function isSearchType(
  value: string | undefined
): value is SearchType {
  return (
    value === "all" ||
    value === "attraction" ||
    value === "restaurant" ||
    value === "cafe" ||
    value === "accommodation"
  );
}

function getTypeIntent(
  query: string
): PlaceType | null {
  const normalized =
    normalizeSearchText(query);

  for (const [
    type,
    words,
  ] of Object.entries(
    TYPE_INTENT_WORDS
  ) as [
    PlaceType,
    string[],
  ][]) {
    if (
      words.some((word) =>
        normalized.includes(
          normalizeSearchText(word)
        )
      )
    ) {
      return type;
    }
  }

  return null;
}

function removeTypeIntentWords(
  query: string
) {
  let normalized =
    normalizeSearchText(query);

  for (const words of Object.values(
    TYPE_INTENT_WORDS
  )) {
    for (const word of words) {
      normalized =
        normalized.replaceAll(
          normalizeSearchText(word),
          ""
        );
    }
  }

  return normalized;
}

function getQueryTokens(
  query: string
) {
  const rawTokens =
    query
      .trim()
      .split(/\s+/)
      .map((token) =>
        normalizeSearchText(token)
      )
      .filter(Boolean);

  const typeWords =
    Object.values(
      TYPE_INTENT_WORDS
    )
      .flat()
      .map(normalizeSearchText);

  return rawTokens
    .filter(
      (token) =>
        !STOP_WORDS.has(token)
    )
    .filter(
      (token) =>
        !typeWords.includes(token)
    );
}

function getPlaceSearchFields(
  place: Place
) {
  const name =
    normalizeSearchText(
      place.name || ""
    );

  const region =
    normalizeSearchText(
      place.region || ""
    );

  const city =
    normalizeSearchText(
      place.city || ""
    );

  const address =
    normalizeSearchText(
      place.address || ""
    );

  const summary =
    normalizeSearchText(
      [
        place.summary,
        place.description,
        place.parent_recommendation,
        place.cuisine_type,
        ...(place.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
    );

  const combined =
    normalizeSearchText(
      [
        place.name,
        place.region,
        place.city,
        place.address,
        place.summary,
        place.description,
        place.parent_recommendation,
        place.cuisine_type,
        ...(place.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
    );

  return {
    name,
    region,
    city,
    address,
    summary,
    combined,
  };
}

/*
 * 검색 점수의 핵심 원칙:
 *
 * 1. 실제 검색어와 일치하지 않으면 반드시 0점
 * 2. 추천점수/에디터픽은 "이미 일치한 장소"의 정렬에만 사용
 * 3. "가평" 검색에 양주/인제 등이 섞이지 않음
 * 4. "명지계곡" 검색에 모든 계곡이 나오지 않음
 */
function getSearchScore(
  place: Place,
  query: string
) {
  const normalizedQuery =
    normalizeSearchText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const {
    name,
    region,
    city,
    address,
    summary,
    combined,
  } = getPlaceSearchFields(
    place
  );

  const typeIntent =
    getTypeIntent(query);

  const queryWithoutType =
    removeTypeIntentWords(
      query
    );

  const tokens =
    getQueryTokens(query);

  let matchScore = 0;

  /*
   * 1) 전체 검색어 직접 일치
   */
  if (
    name ===
    normalizedQuery
  ) {
    matchScore = Math.max(
      matchScore,
      150
    );
  } else if (
    name.startsWith(
      normalizedQuery
    )
  ) {
    matchScore = Math.max(
      matchScore,
      125
    );
  } else if (
    name.includes(
      normalizedQuery
    )
  ) {
    matchScore = Math.max(
      matchScore,
      110
    );
  }

  if (
    region.includes(
      normalizedQuery
    ) ||
    city.includes(
      normalizedQuery
    )
  ) {
    matchScore = Math.max(
      matchScore,
      100
    );
  }

  if (
    address.includes(
      normalizedQuery
    )
  ) {
    matchScore = Math.max(
      matchScore,
      90
    );
  }

  if (
    combined.includes(
      normalizedQuery
    )
  ) {
    matchScore = Math.max(
      matchScore,
      70
    );
  }

  /*
   * 2) "경기도가평"처럼
   * region + city를 붙여 검색하는 경우
   */
  const regionCity =
    `${region}${city}`;

  if (
    regionCity.includes(
      normalizedQuery
    ) ||
    normalizedQuery.includes(
      regionCity
    )
  ) {
    matchScore = Math.max(
      matchScore,
      115
    );
  }

  /*
   * 3) "가평 맛집"처럼 유형 단어가 포함된 경우
   * 유형 단어를 제외한 실제 검색어가 반드시 장소와 일치해야 합니다.
   */
  if (
    typeIntent &&
    queryWithoutType
  ) {
    if (
      combined.includes(
        queryWithoutType
      ) ||
      regionCity.includes(
        queryWithoutType
      )
    ) {
      matchScore = Math.max(
        matchScore,
        105
      );
    }
  }

  /*
   * 4) 공백으로 나눠진 복합 검색
   * 모든 의미 있는 토큰이 일치해야 합니다.
   *
   * 예: "경기 가평", "가평 명지계곡"
   */
  if (
    tokens.length > 0
  ) {
    const allMatched =
      tokens.every(
        (token) =>
          combined.includes(
            token
          ) ||
          regionCity.includes(
            token
          )
      );

    if (allMatched) {
      matchScore +=
        tokens.length * 24;
    }
  }

  /*
   * 실제로 아무것도 일치하지 않았다면
   * 추천점수 등이 있어도 결과에서 제외합니다.
   */
  if (matchScore <= 0) {
    return 0;
  }

  /*
   * 유형 의도가 있으면 같은 유형에만 소폭 가산.
   * 이 가산점만으로 검색 결과에 들어올 수는 없습니다.
   */
  if (
    typeIntent ===
    place.place_type
  ) {
    matchScore += 12;
  }

  /*
   * 검색 일치 후 정렬용 보너스
   */
  if (place.is_editor_pick) {
    matchScore += 2;
  }

  matchScore +=
    Math.min(
      place.recommendation_score ??
        0,
      100
    ) / 1000;

  return matchScore;
}

function searchPlaces(
  places: Place[],
  query: string,
  selectedType: SearchType
) {
  const trimmed =
    query.trim();

  if (!trimmed) {
    return [];
  }

  const typeIntent =
    getTypeIntent(trimmed);

  return places
    .filter((place) => {
      /*
       * 사용자가 결과 탭을 눌렀으면
       * 그 탭이 최우선입니다.
       */
      if (
        selectedType !== "all" &&
        place.place_type !==
          selectedType
      ) {
        return false;
      }

      /*
       * "가평 맛집"처럼 검색창 자체에
       * 유형 의도가 있으면 전체 탭에서도 해당 유형만 표시.
       */
      if (
        selectedType === "all" &&
        typeIntent &&
        place.place_type !==
          typeIntent
      ) {
        return false;
      }

      return (
        getSearchScore(
          place,
          trimmed
        ) > 0
      );
    })
    .map((place) => ({
      place,
      score:
        getSearchScore(
          place,
          trimmed
        ),
    }))
    .sort((a, b) => {
      if (
        b.score !== a.score
      ) {
        return (
          b.score - a.score
        );
      }

      return (
        b.place
          .recommendation_score -
        a.place
          .recommendation_score
      );
    })
    .map(
      ({ place }) => place
    );
}

function SearchTypeIcon({
  type,
}: {
  type: PlaceType;
}) {
  if (
    type === "restaurant"
  ) {
    return (
      <Utensils
        size={13}
        aria-hidden="true"
      />
    );
  }

  if (type === "cafe") {
    return (
      <Coffee
        size={13}
        aria-hidden="true"
      />
    );
  }

  if (
    type === "accommodation"
  ) {
    return (
      <BedDouble
        size={13}
        aria-hidden="true"
      />
    );
  }

  return (
    <MapPin
      size={13}
      aria-hidden="true"
    />
  );
}

function SearchPlaceCard({
  place,
}: {
  place: Place;
}) {
  return (
    <article className="site-search-card">
      <div className="site-search-card-image">
        {place.image_url ? (
          <Image
            src={
              place.image_url
            }
            alt={place.name}
            fill
            sizes="(max-width: 760px) 38vw, (max-width: 1100px) 32vw, 240px"
            style={{
              objectFit:
                "cover",
            }}
          />
        ) : (
          <div className="site-search-card-placeholder">
            <ImageIcon
              size={26}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="site-search-card-copy">
        <div className="site-search-card-meta">
          <span>
            <SearchTypeIcon
              type={
                place.place_type
              }
            />
            {
              TYPE_LABELS[
                place.place_type
              ]
            }
          </span>

          <span>
            {place.region}{" "}
            {place.city}
          </span>
        </div>

        <h2>
          {place.name}
        </h2>

        <p>
          {place.summary ||
            place.parent_recommendation ||
            "부모님과 함께 둘러보기 좋은 장소입니다."}
        </p>

        <div className="site-search-card-features">
          {place.parking && (
            <span>
              주차 가능
            </span>
          )}

          {place.restroom && (
            <span>
              화장실
            </span>
          )}

          {place.walking_easy && (
            <span>
              걷기 편함
            </span>
          )}
        </div>

        <div className="site-search-card-actions">
          <Link
            href={`/places/${place.slug}`}
            className="site-search-card-detail-link"
          >
            자세히 보기
          </Link>

          <Link
            href={`/map?place=${encodeURIComponent(
              place.slug
            )}&type=${place.place_type}`}
            className="site-search-card-map-link"
          >
            <MapPinned
              size={15}
              aria-hidden="true"
            />
            지도에서 위치 보기
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params =
    await searchParams;

  const query =
    params.q?.trim() ?? "";

  const selectedType:
    SearchType =
    isSearchType(
      params.type
    )
      ? params.type
      : "all";

  const places =
    await getPublishedPlaces();

  const results =
    searchPlaces(
      places,
      query,
      selectedType
    );

  const detectedType =
    selectedType !== "all"
      ? selectedType
      : getTypeIntent(query);

  const mapHref = query
    ? `/map?q=${encodeURIComponent(query)}${
        detectedType
          ? `&type=${detectedType}`
          : ""
      }`
    : "/map";

  return (
    <main className="site-search-page">
      <section className="site-search-top">
        <div className="container">
          <div className="site-search-heading">
            <span>
              엄마랑 아빠랑 통합검색
            </span>

            <h1>
              어디를 찾고 계신가요?
            </h1>

            <p>
              지역, 장소명, 맛집, 카페, 숙소를 한 번에 검색해보세요.
            </p>
          </div>

          <SearchAutocomplete
            places={places}
            defaultValue={query}
            className="site-search-autocomplete"
            placeholder="예: 가평, 경기도 가평, 명지계곡, 가평 맛집"
            ariaLabel="통합검색"
          />
        </div>
      </section>

      <section className="site-search-results">
        <div className="container">
          {query ? (
            <>
              <div className="site-search-summary">
                <div>
                  <span>
                    검색결과
                  </span>

                  <strong>
                    ‘{query}’
                  </strong>

                  <p>
                    총{" "}
                    <b>
                      {
                        results.length
                      }
                    </b>
                    개의 장소를 찾았습니다.
                  </p>
                </div>

                <Link
                  href={mapHref}
                  className="site-search-map-button"
                >
                  <MapPinned
                    size={17}
                    aria-hidden="true"
                  />
                  지도에서 보기
                </Link>
              </div>

              <div
                className="site-search-type-tabs"
                role="navigation"
                aria-label="검색 결과 유형"
              >
                {TYPE_OPTIONS.map(
                  (option) => {
                    const href =
                      option.value ===
                      "all"
                        ? `/search?q=${encodeURIComponent(
                            query
                          )}`
                        : `/search?q=${encodeURIComponent(
                            query
                          )}&type=${option.value}`;

                    return (
                      <Link
                        key={
                          option.value
                        }
                        href={
                          href
                        }
                        className={
                          selectedType ===
                          option.value
                            ? "active"
                            : ""
                        }
                      >
                        {
                          option.label
                        }
                      </Link>
                    );
                  }
                )}
              </div>

              {results.length >
              0 ? (
                <div className="site-search-grid">
                  {results.map(
                    (place) => (
                      <SearchPlaceCard
                        key={
                          place.id
                        }
                        place={
                          place
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="site-search-empty">
                  <Search
                    size={28}
                    aria-hidden="true"
                  />

                  <strong>
                    검색 결과가 없습니다.
                  </strong>

                  <p>
                    장소명을 조금 짧게 입력하거나 지역명으로 다시 검색해보세요.
                  </p>

                  <div>
                    <Link href="/places?type=attraction">
                      가볼만한 곳 보기
                    </Link>

                    <Link href="/map">
                      지도에서 찾기
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="site-search-start">
              <Search
                size={30}
                aria-hidden="true"
              />

              <strong>
                검색어를 입력해주세요.
              </strong>

              <p>
                ‘가평’, ‘명지계곡’, ‘가평 맛집’처럼 검색할 수 있습니다.
              </p>

              <div className="site-search-examples">
                {[
                  "가평",
                  "양주",
                  "강원 인제",
                  "계곡",
                  "맛집",
                  "카페",
                  "숙소",
                ].map(
                  (example) => (
                    <Link
                      key={
                        example
                      }
                      href={`/search?q=${encodeURIComponent(
                        example
                      )}`}
                    >
                      {
                        example
                      }
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
