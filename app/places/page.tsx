import Link from "next/link";

import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Coffee,
  MapPin,
  MapPinned,
  Sparkles,
  Utensils,
} from "lucide-react";

import {
  getPublishedPlaces,
  type Place,
  type PlaceType,
} from "@/lib/places";

type PlacesPageProps = {
  searchParams: Promise<{
    type?: string;
    section?: string;
    region?: string;
  }>;
};

type SectionType =
  | "popular"
  | "recommended"
  | "new";

const CATEGORY_INFO: Record<
  PlaceType,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  attraction: {
    title: "가볼만한 곳",
    description:
      "부모님과 함께 천천히 둘러보기 좋은 장소를 만나보세요.",
    icon: <MapPin size={18} />,
  },

  restaurant: {
    title: "맛집",
    description:
      "부모님과 편안하게 식사하기 좋은 맛집을 만나보세요.",
    icon: <Utensils size={18} />,
  },

  cafe: {
    title: "카페",
    description:
      "부모님과 차 한잔하며 쉬어가기 좋은 카페를 만나보세요.",
    icon: <Coffee size={18} />,
  },

  accommodation: {
    title: "숙소",
    description:
      "부모님과 편안하게 머물기 좋은 숙소를 만나보세요.",
    icon: <BedDouble size={18} />,
  },
};

const SECTION_INFO: Record<
  SectionType,
  {
    title: string;
    description: string;
  }
> = {
  popular: {
    title: "지금 많이 찾는 곳",
    description:
      "요즘 많이 찾고 있는 장소를 살펴보세요.",
  },

  recommended: {
    title: "엄마랑 아빠랑 추천 장소",
    description:
      "부모님과 함께하기 좋은 곳을 골라 소개합니다.",
  },

  new: {
    title: "새로 등록된 장소",
    description:
      "최근 새롭게 등록된 장소를 만나보세요.",
  },
};

const REGIONS = [
  "전국",
  "서울",
  "경기",
  "인천",
  "강원",
  "충청",
  "전라",
  "경상",
  "제주",
];

function isPlaceType(
  value: string | undefined
): value is PlaceType {
  return (
    value === "attraction" ||
    value === "restaurant" ||
    value === "cafe" ||
    value === "accommodation"
  );
}

function isSectionType(
  value: string | undefined
): value is SectionType {
  return (
    value === "popular" ||
    value === "recommended" ||
    value === "new"
  );
}

function regionMatches(
  place: Place,
  region: string
) {
  if (region === "전국") {
    return true;
  }

  if (region === "충청") {
    return (
      place.region === "충북" ||
      place.region === "충남" ||
      place.region === "대전" ||
      place.region === "세종"
    );
  }

  if (region === "전라") {
    return (
      place.region === "전북" ||
      place.region === "전남" ||
      place.region === "광주"
    );
  }

  if (region === "경상") {
    return (
      place.region === "경북" ||
      place.region === "경남" ||
      place.region === "대구" ||
      place.region === "울산" ||
      place.region === "부산"
    );
  }

  return (
    place.region === region
  );
}

function sortSectionPlaces(
  places: Place[],
  section: SectionType
) {
  if (section === "recommended") {
    return [...places]
      .filter(
        (place) =>
          place.is_editor_pick
      )
      .sort(
        (a, b) =>
          b.recommendation_score -
          a.recommendation_score
      );
  }

  if (section === "new") {
    return [...places].sort(
      (a, b) =>
        new Date(
          b.created_at
        ).getTime() -
        new Date(
          a.created_at
        ).getTime()
    );
  }

  return [...places].sort(
    (a, b) =>
      b.recommendation_score -
      a.recommendation_score
  );
}

function PlaceCard({
  place,
}: {
  place: Place;
}) {
  return (
    <Link
      href={`/places/${place.slug}`}
      className="places-discovery-card"
    >
      <div className="places-discovery-image">
        {place.image_url ? (
          <img
            src={place.image_url}
            alt={place.name}
          />
        ) : (
          <div className="places-discovery-placeholder">
            <MapPin size={30} />
          </div>
        )}
      </div>

      <div className="places-discovery-copy">
        <span className="places-discovery-location">
          {place.region}{" "}
          {place.city}
        </span>

        <h3>
          {place.name}
        </h3>

        {place.summary && (
          <p>
            {place.summary}
          </p>
        )}

        <div className="places-discovery-features">
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

          {place.environment_type ===
            "indoor" && (
            <span>
              실내
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function PlacesPage({
  searchParams,
}: PlacesPageProps) {
  const params =
    await searchParams;

  const placeType: PlaceType =
    isPlaceType(params.type)
      ? params.type
      : "attraction";

  const currentSection =
    isSectionType(params.section)
      ? params.section
      : null;

  const currentRegion =
    REGIONS.includes(
      params.region ?? ""
    )
      ? params.region!
      : "전국";

  const allPlaces =
    await getPublishedPlaces();

  const categoryPlaces =
    allPlaces.filter(
      (place) =>
        place.place_type ===
        placeType
    );

  const category =
    CATEGORY_INFO[placeType];

  /*
   * 더보기 전용 목록
   */
  if (currentSection) {
    const section =
      SECTION_INFO[
        currentSection
      ];

    const regionPlaces =
      sortSectionPlaces(
        categoryPlaces,
        currentSection
      ).filter((place) =>
        regionMatches(
          place,
          currentRegion
        )
      );

    return (
      <main className="places-discovery-page">
        <style>
          {PAGE_STYLES}
        </style>

        <section className="places-list-page">
          <div className="places-main-container">
            <div className="places-list-top">
              <Link
                href={`/places?type=${placeType}`}
                className="places-back-button"
                aria-label="뒤로 가기"
              >
                <ChevronLeft
                  size={24}
                />
              </Link>

              <div>
                <span>
                  {category.title}
                </span>

                <h1>
                  {section.title}
                </h1>
              </div>
            </div>

            {/* 지역 */}
            <nav className="places-region-tabs">
              {REGIONS.map(
                (region) => (
                  <Link
                    key={region}
                    href={`/places?type=${placeType}&section=${currentSection}&region=${encodeURIComponent(
                      region
                    )}`}
                    className={
                      currentRegion ===
                      region
                        ? "active"
                        : ""
                    }
                  >
                    {region}
                  </Link>
                )
              )}
            </nav>

            <div className="places-list-description">
              {section.description}
            </div>

            {regionPlaces.length >
            0 ? (
              <div className="places-long-list">
                {regionPlaces.map(
                  (place) => (
                    <PlaceCard
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
              <div className="places-empty-state">
                <MapPin
                  size={32}
                />

                <strong>
                  아직 등록된
                  장소가 없습니다
                </strong>

                <p>
                  좋은 장소를
                  차근차근 추가하고
                  있습니다.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  /*
   * 카테고리 메인
   */
  const popularPlaces =
    sortSectionPlaces(
      categoryPlaces,
      "popular"
    ).slice(0, 5);

  const recommendedPlaces =
    sortSectionPlaces(
      categoryPlaces,
      "recommended"
    ).slice(0, 5);

  const newPlaces =
    sortSectionPlaces(
      categoryPlaces,
      "new"
    ).slice(0, 5);

  const sections = [
    {
      type:
        "popular" as SectionType,
      ...SECTION_INFO.popular,
      places: popularPlaces,
    },
    {
      type:
        "recommended" as SectionType,
      ...SECTION_INFO.recommended,
      places:
        recommendedPlaces,
    },
    {
      type:
        "new" as SectionType,
      ...SECTION_INFO.new,
      places: newPlaces,
    },
  ];

  return (
    <main className="places-discovery-page">
      <style>
        {PAGE_STYLES}
      </style>

      {/* 카테고리 상단 */}
      <section className="places-category-header">
        <div className="places-main-container">
          <nav className="places-category-tabs">
            {(
              Object.keys(
                CATEGORY_INFO
              ) as PlaceType[]
            ).map((type) => {
              const item =
                CATEGORY_INFO[type];

              return (
                <Link
                  key={type}
                  href={`/places?type=${type}`}
                  className={
                    type ===
                    placeType
                      ? "active"
                      : ""
                  }
                >
                  {item.icon}

                  <span>
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* 지도 */}
      <section className="places-map-entry">
        <div className="places-main-container">
          <Link
            href={`/map?type=${placeType}`}
            className="places-map-card"
          >
            <div className="places-map-text">
              <span className="places-map-icon">
                <MapPinned
                  size={27}
                />
              </span>

              <div>
                <strong>
                  {category.title} 지도에서 찾기
                </strong>

                <p>
                  지도에서 부모님과 함께 가기 좋은 {category.title}을 찾아보세요.
                </p>
              </div>
            </div>

            <span className="places-map-action">
              지도 보기
              <ChevronRight
                size={17}
              />
            </span>
          </Link>
        </div>
      </section>

      {/* 세 가지 주제 */}
      <section className="places-curation-area">
        <div className="places-main-container">
          {sections.map(
            (section) => (
              <div
                className="places-curation-section"
                key={
                  section.type
                }
              >
                <div className="places-curation-heading">
                  <div>
                    {section.type ===
                      "recommended" && (
                      <span className="places-curation-kicker">
                        <Sparkles
                          size={
                            14
                          }
                        />
                        엄마랑
                        아빠랑 PICK
                      </span>
                    )}

                    <h2>
                      {
                        section.title
                      }
                    </h2>

                    <p>
                      {
                        section.description
                      }
                    </p>
                  </div>

                  <Link
                    href={`/places?type=${placeType}&section=${section.type}&region=전국`}
                  >
                    더보기
                    <ChevronRight
                      size={
                        16
                      }
                    />
                  </Link>
                </div>

                {section.places
                  .length > 0 ? (
                  <div className="places-card-row">
                    {section.places.map(
                      (place) => (
                        <PlaceCard
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
                  <div className="places-small-empty">
                    아직 해당 장소가
                    등록되지 않았습니다.
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}

const PAGE_STYLES = `
  .places-discovery-page {
    min-height: 100vh;
    background: #fbfaf7;
    color: #173f36;
  }

  .places-main-container {
    width: calc(100% - 64px);
    max-width: 1360px;
    margin: 0 auto;
  }

  @media (min-width: 1600px) {
    .places-main-container {
      max-width: 1440px;
    }
  }

  .places-category-header {
    padding: 28px 0 8px;
  }

  .places-category-tabs {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 5px;
    scrollbar-width: none;
  }

  .places-category-tabs::-webkit-scrollbar {
    display: none;
  }

  .places-category-tabs a {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 44px;
    padding: 0 17px;
    border: 1px solid #dce5e1;
    border-radius: 999px;
    background: #ffffff;
    color: #52645e;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
  }

  .places-category-tabs a.active {
    border-color: #245c4f;
    background: #245c4f;
    color: #ffffff;
  }

  .places-category-heading {
    margin-top: 32px;
  }

  .places-category-heading > span {
    display: block;
    margin-bottom: 7px;
    color: #b87943;
    font-size: 13px;
    font-weight: 800;
  }

  .places-category-heading h1 {
    margin: 0 0 8px;
    font-size: clamp(30px, 3.5vw, 43px);
    line-height: 1.2;
  }

  .places-category-heading p {
    margin: 0;
    color: #71807b;
    font-size: 15px;
    line-height: 1.7;
  }

  .places-map-entry {
    padding: 22px 0 10px;
  }

  .places-map-card {
    min-height: 125px;
    padding: 25px 30px;
    border: 1px solid #d9e6df;
    border-radius: 22px;
    background:
      linear-gradient(
        135deg,
        #edf5f0,
        #f7faf7
      );
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    color: inherit;
    text-decoration: none;
  }

  .places-map-text {
    display: flex;
    align-items: center;
    gap: 17px;
  }

  .places-map-icon {
    width: 52px;
    height: 52px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: #2c6757;
    color: white;
  }

  .places-map-text strong {
    display: block;
    margin-bottom: 6px;
    font-size: 20px;
  }

  .places-map-text p {
    margin: 0;
    color: #71807b;
    font-size: 13px;
    line-height: 1.6;
  }

  .places-map-action {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
    padding: 10px 14px;
    border-radius: 999px;
    background: #ffffff;
    color: #245c4f;
    font-size: 13px;
    font-weight: 800;
  }

  .places-curation-area {
    padding: 20px 0 80px;
  }

  .places-curation-section {
    padding-top: 45px;
  }

  .places-curation-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
  }

  .places-curation-heading h2 {
    margin: 0 0 6px;
    font-size: 25px;
  }

  .places-curation-heading p {
    margin: 0;
    color: #84908c;
    font-size: 13px;
  }

  .places-curation-heading > a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    color: #64736e;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }

  .places-curation-kicker {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 8px;
    color: #b87943;
    font-size: 11px;
    font-weight: 900;
  }

  .places-card-row {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 18px;
  }

  .places-discovery-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #e0e7e3;
    border-radius: 17px;
    background: #ffffff;
    color: inherit;
    text-decoration: none;
  }

  .places-discovery-image {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: #edf2ef;
  }

  .places-discovery-image img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .places-discovery-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8a9b95;
  }

  .places-discovery-copy {
    padding: 14px;
  }

  .places-discovery-location {
    color: #86928e;
    font-size: 11px;
    font-weight: 700;
  }

  .places-discovery-copy h3 {
    margin: 6px 0 7px;
    color: #173f36;
    font-size: 17px;
    line-height: 1.35;
  }

  .places-discovery-copy p {
    display: -webkit-box;
    overflow: hidden;
    margin: 0;
    color: #697772;
    font-size: 12px;
    line-height: 1.6;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .places-discovery-features {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
  }

  .places-discovery-features span {
    padding: 4px 7px;
    border-radius: 999px;
    background: #f1f5f2;
    color: #60716b;
    font-size: 10px;
    font-weight: 700;
  }

  .places-small-empty,
  .places-empty-state {
    border: 1px solid #e2e9e6;
    border-radius: 18px;
    background: #ffffff;
    color: #7b8984;
    text-align: center;
  }

  .places-small-empty {
    padding: 34px 20px;
    font-size: 13px;
  }

  /* 더보기 목록 */
  .places-list-page {
    padding: 45px 0 80px;
  }

  .places-list-top {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .places-back-button {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #dde6e2;
    border-radius: 50%;
    background: #ffffff;
    color: #214c41;
  }

  .places-list-top span {
    display: block;
    margin-bottom: 2px;
    color: #b87943;
    font-size: 12px;
    font-weight: 800;
  }

  .places-list-top h1 {
    margin: 0;
    font-size: 30px;
  }

  .places-region-tabs {
    display: flex;
    gap: 25px;
    overflow-x: auto;
    margin-top: 33px;
    border-bottom: 1px solid #e3e8e5;
    scrollbar-width: none;
  }

  .places-region-tabs::-webkit-scrollbar {
    display: none;
  }

  .places-region-tabs a {
    position: relative;
    flex: 0 0 auto;
    padding: 0 2px 14px;
    color: #9aa29f;
    font-size: 15px;
    font-weight: 800;
    text-decoration: none;
  }

  .places-region-tabs a.active {
    color: #173f36;
  }

  .places-region-tabs a.active::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 3px;
    border-radius: 4px;
    background: #173f36;
  }

  .places-list-description {
    padding: 22px 0;
    color: #77847f;
    font-size: 14px;
  }

  .places-long-list {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 20px;
  }

  .places-empty-state {
    padding: 80px 20px;
  }

  .places-empty-state strong {
    display: block;
    margin: 12px 0 5px;
    color: #34554c;
    font-size: 18px;
  }

  .places-empty-state p {
    margin: 0;
    font-size: 13px;
  }

  @media (max-width: 1100px) {
    .places-card-row {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .places-long-list {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .places-main-container {
      width: calc(100% - 32px);
    }

    .places-category-header {
      padding-top: 16px;
    }

    .places-category-tabs {
      margin-left: -16px;
      margin-right: -16px;
      padding-left: 16px;
      padding-right: 16px;
    }

    .places-category-tabs a {
      min-height: 41px;
      padding: 0 14px;
      font-size: 13px;
    }

    .places-category-heading {
      margin-top: 24px;
    }

    .places-category-heading h1 {
      font-size: 29px;
    }

    .places-map-entry {
      padding-top: 12px;
    }

    .places-map-card {
      min-height: 105px;
      padding: 19px;
      border-radius: 18px;
    }

    .places-map-text {
      gap: 12px;
    }

    .places-map-icon {
      width: 43px;
      height: 43px;
      border-radius: 13px;
    }

    .places-map-text strong {
      font-size: 18px;
    }

    .places-map-text p {
      max-width: 210px;
      font-size: 11px;
    }

    .places-map-action {
      padding: 8px 10px;
      font-size: 11px;
    }

    .places-curation-section {
      padding-top: 38px;
    }

    .places-curation-heading {
      margin-bottom: 15px;
    }

    .places-curation-heading h2 {
      font-size: 21px;
    }

    .places-curation-heading p {
      display: none;
    }

    .places-card-row {
      display: flex;
      gap: 13px;
      overflow-x: auto;
      margin-left: -16px;
      margin-right: -16px;
      padding-left: 16px;
      padding-right: 16px;
      padding-bottom: 5px;
      scroll-snap-type: x proximity;
      scrollbar-width: none;
    }

    .places-card-row::-webkit-scrollbar {
      display: none;
    }

    .places-card-row .places-discovery-card {
      flex: 0 0 72%;
      scroll-snap-align: start;
    }

    .places-list-page {
      padding-top: 25px;
    }

    .places-list-top h1 {
      font-size: 23px;
    }

    .places-region-tabs {
      gap: 28px;
      margin-left: -16px;
      margin-right: -16px;
      padding-left: 16px;
      padding-right: 16px;
    }

    .places-region-tabs a {
      font-size: 14px;
    }

    .places-long-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .places-long-list .places-discovery-card {
      display: grid;
      grid-template-columns: 132px 1fr;
      border-radius: 14px;
    }

    .places-long-list .places-discovery-image {
      height: 100%;
      min-height: 132px;
      aspect-ratio: auto;
    }

    .places-long-list .places-discovery-copy {
      padding: 13px;
    }

    .places-long-list .places-discovery-copy h3 {
      font-size: 17px;
    }
  }
`;