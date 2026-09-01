import type {
  Metadata,
} from "next";

import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  Armchair,
  Building2,
  ChevronDown,
  Clock3,
  Coffee,
  ExternalLink,
  MapPinned,
  Footprints,
  Globe,
  Lightbulb,
  MapPin,
  MessageCircleQuestion,
  ParkingCircle,
  Phone,
  ReceiptText,
  Sparkles,
  Utensils,
} from "lucide-react";

import {
  getPublishedPlaceBySlug,
  getRelatedPublishedPlaces,
  type Place,
  type PlaceType,
} from "@/lib/places";

import "@/styles/places.css";

type PlaceDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const PLACE_TYPE_LABEL: Record<
  PlaceType,
  string
> = {
  attraction:
    "가볼만한 곳",
  restaurant:
    "맛집",
  cafe:
    "카페",
  accommodation:
    "숙소",
};

const RELATED_SECTION_INFO: Record<
  PlaceType,
  {
    title: string;
    description: string;
  }
> = {
  attraction: {
    title:
      "함께 둘러보기 좋은 곳",
    description:
      "부모님과 함께 들러보기 좋은 주변 장소예요.",
  },

  restaurant: {
    title:
      "함께 가기 좋은 맛집",
    description:
      "나들이 전후 편하게 식사하기 좋은 곳을 살펴보세요.",
  },

  cafe: {
    title:
      "쉬어가기 좋은 카페",
    description:
      "부모님과 차 한잔하며 쉬어가기 좋은 곳이에요.",
  },

  accommodation: {
    title:
      "편하게 머물기 좋은 숙소",
    description:
      "하루 더 여유롭게 보내고 싶을 때 살펴보세요.",
  },
};

function getEnvironmentLabel(
  value:
    Place["environment_type"]
) {
  switch (value) {
    case "indoor":
      return "실내";

    case "outdoor":
      return "실외";

    case "mixed":
      return "실내 · 실외";

    default:
      return null;
  }
}

function getSeatingLabel(
  value:
    Place["seating_type"]
) {
  switch (value) {
    case "chair":
      return "의자식";

    case "floor":
      return "좌식";

    case "mixed":
      return "의자식 · 좌식";

    default:
      return null;
  }
}

type Feature = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

function getFeatures(
  place: Place
): Feature[] {
  const features:
    Feature[] = [];

  if (
    place.parking === true
  ) {
    features.push({
      key: "parking",
      label: "주차 가능",
      icon: (
        <ParkingCircle
          size={19}
          aria-hidden="true"
        />
      ),
    });
  }

  if (
    place.restroom === true
  ) {
    features.push({
      key: "restroom",
      label: "화장실",
      icon: (
        <span
          className="place-feature-emoji"
          aria-hidden="true"
        >
          🚻
        </span>
      ),
    });
  }

  if (
    place.place_type ===
      "attraction" &&
    place.walking_easy ===
      true
  ) {
    features.push({
      key: "walking",
      label: "걷기 편함",
      icon: (
        <Footprints
          size={19}
          aria-hidden="true"
        />
      ),
    });
  }

  if (
    place.place_type ===
      "attraction" &&
    place.nearby_cafe ===
      true
  ) {
    features.push({
      key:
        "nearby-cafe",
      label: "주변 카페",
      icon: (
        <Coffee
          size={19}
          aria-hidden="true"
        />
      ),
    });
  }

  if (
    place.place_type ===
    "restaurant"
  ) {
    const seatingLabel =
      getSeatingLabel(
        place.seating_type
      );

    if (seatingLabel) {
      features.push({
        key:
          "seating",
        label:
          seatingLabel,
        icon: (
          <Armchair
            size={19}
            aria-hidden="true"
          />
        ),
      });
    }

    if (
      place.cuisine_type
        ?.trim()
    ) {
      features.push({
        key:
          "cuisine",
        label:
          place.cuisine_type.trim(),
        icon: (
          <Utensils
            size={19}
            aria-hidden="true"
          />
        ),
      });
    }
  }

  const environmentLabel =
    getEnvironmentLabel(
      place.environment_type
    );

  if (
    environmentLabel
  ) {
    features.push({
      key:
        "environment",
      label:
        environmentLabel,
      icon: (
        <Building2
          size={19}
          aria-hidden="true"
        />
      ),
    });
  }

  return features;
}

function createKakaoMapUrl(
  place: Place
) {
  const query =
    place.address?.trim() ||
    `${place.region} ${place.city} ${place.name}`;

  return `https://map.kakao.com/link/search/${encodeURIComponent(
    query
  )}`;
}

function BasicInfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <div className="place-basic-row">
      <div className="place-basic-icon">
        {icon}
      </div>

      <div className="place-basic-copy">
        <span>
          {label}
        </span>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}


function StructuredInfoList({
  value,
}: {
  value: string;
}) {
  const rows = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("|");

      if (separatorIndex === -1) {
        return {
          label: "",
          value: line,
        };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    });

  return (
    <div className="place-structured-info">
      {rows.map((row, index) => (
        <div
          className="place-structured-info-row"
          key={`${row.label}-${row.value}-${index}`}
        >
          {row.label && (
            <span className="place-structured-info-label">
              {row.label}
            </span>
          )}

          <span className="place-structured-info-value">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function RelatedPlaceCard({
  place,
}: {
  place: Place;
}) {
  const detailHref =
    `/places/${place.slug}`;

  const mapHref =
    `/map?place=${encodeURIComponent(
      place.slug
    )}&type=${place.place_type}`;

  return (
    <article className="place-related-card place-related-card-v2">
      <Link
        href={detailHref}
        className="place-related-main-link"
        aria-label={`${place.name} 자세히 보기`}
      >
        <div className="place-related-image">
          {place.image_url ? (
            <img
              src={place.image_url}
              alt={place.name}
            />
          ) : (
            <div className="place-related-placeholder">
              <MapPin size={30} />
            </div>
          )}

          <span className="place-related-type">
            {
              PLACE_TYPE_LABEL[
                place.place_type
              ]
            }
          </span>
        </div>

        <div className="place-related-copy">
          <div className="place-related-region">
            <MapPin
              size={13}
              aria-hidden="true"
            />

            <span>
              {place.region}{" "}
              {place.city}
            </span>
          </div>

          <h3>
            {place.name}
          </h3>

          {(place.summary ||
            place.parent_recommendation) && (
            <p>
              {place.summary ||
                place.parent_recommendation}
            </p>
          )}
        </div>
      </Link>

      <div className="place-related-actions">
        <Link
          href={detailHref}
          className="place-related-detail-button"
        >
          자세히 보기
          <span aria-hidden="true">
            →
          </span>
        </Link>

        <Link
          href={mapHref}
          className="place-related-map-button"
          aria-label={`${place.name} 지도에서 위치 보기`}
        >
          <MapPinned
            size={14}
            aria-hidden="true"
          />
          지도에서 보기
        </Link>
      </div>
    </article>
  );
}

export async function generateMetadata({
  params,
}: PlaceDetailPageProps): Promise<Metadata> {
  const {
    slug,
  } = await params;

  const place =
    await getPublishedPlaceBySlug(
      decodeURIComponent(
        slug
      )
    );

  if (!place) {
    return {
      title:
        "장소를 찾을 수 없습니다",
    };
  }

  return {
    title: `${place.name} | 엄마랑 아빠랑`,

    description:
      place.summary ||
      place.parent_recommendation ||
      `${place.name} 부모님과 함께 가볼만한 곳`,
  };
}

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const {
    slug,
  } = await params;

  const place =
    await getPublishedPlaceBySlug(
      decodeURIComponent(
        slug
      )
    );

  if (!place) {
    notFound();
  }

  const features =
    getFeatures(
      place
    );

  const typeLabel =
    PLACE_TYPE_LABEL[
      place.place_type
    ];

  const kakaoMapUrl =
    createKakaoMapUrl(
      place
    );

  const internalMapUrl =
    `/map?place=${encodeURIComponent(
      place.slug
    )}&type=${place.place_type}`;

  const hasBasicInfo =
    Boolean(
      place.address ||
        place.business_hours ||
        place.admission_fee ||
        place.phone ||
        place.website_url
    );

  const hasTips =
    Array.isArray(
      place.visit_tips
    ) &&
    place.visit_tips.length >
      0;

  const hasFaq =
    Array.isArray(
      place.faq
    ) &&
    place.faq.length >
      0;

  const hasBlogReviews =
    Array.isArray(
      place.blog_reviews
    ) &&
    place.blog_reviews.length >
      0;

  /*
   * 현재 카테고리를 제외한
   * 나머지 카테고리 추천
   */
  const relatedTypes =
    (
      [
        "attraction",
        "restaurant",
        "cafe",
        "accommodation",
      ] as PlaceType[]
    ).filter(
      (type) =>
        type !==
        place.place_type
    );

  const relatedResults =
    await Promise.all(
      relatedTypes.map(
        async (
          type
        ) => {
          const items =
            await getRelatedPublishedPlaces(
              {
                currentPlaceId:
                  place.id,
                placeType:
                  type,
                region:
                  place.region,
                city:
                  place.city,
                limit: 3,
              }
            );

          return {
            type,
            items,
          };
        }
      )
    );

  const relatedSections =
    relatedResults.filter(
      (
        section
      ) =>
        section.items.length >
        0
    );

  return (
    <main className="place-detail-page">
      {/* =========================
          HERO
      ========================== */}
      <section className="place-hero">
        <div className="place-detail-container">
          <div className="place-breadcrumb">
            <Link
              href="/"
            >
              홈
            </Link>

            <span>
              /
            </span>

            <span>
              {typeLabel}
            </span>

            <span>
              /
            </span>

            <strong>
              {place.name}
            </strong>
          </div>

          <div className="place-hero-grid">
            <div className="place-hero-image">
              {place.image_url ? (
                <img
                  src={
                    place.image_url
                  }
                  alt={
                    place.name
                  }
                />
              ) : (
                <div className="place-hero-placeholder">
                  <MapPin
                    size={44}
                  />

                  <span>
                    대표사진 준비 중
                  </span>
                </div>
              )}
            </div>

            <div className="place-hero-copy">
              <div className="place-type-label">
                {typeLabel}
              </div>

              <h1>
                {place.name}
              </h1>

              <div className="place-location-line">
                <MapPin
                  size={17}
                />

                <span>
                  {place.region}{" "}
                  {place.city}
                </span>
              </div>

              {place.summary && (
                <p className="place-summary">
                  {
                    place.summary
                  }
                </p>
              )}

              {features.length >
                0 && (
                <div className="place-feature-list">
                  {features.map(
                    (
                      feature
                    ) => (
                      <div
                        className="place-feature-chip"
                        key={
                          feature.key
                        }
                      >
                        {
                          feature.icon
                        }

                        <span>
                          {
                            feature.label
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="place-hero-actions">
                <Link
                  href={
                    internalMapUrl
                  }
                  className="place-primary-button"
                >
                  <MapPin
                    size={17}
                  />
                  사이트 지도에서 보기
                </Link>

                {place.website_url && (
                  <a
                    href={
                      place.website_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="place-secondary-button"
                  >
                    <Globe
                      size={17}
                    />
                    홈페이지
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="place-detail-container place-detail-body">
        {/* =========================
            1. 기본 정보
        ========================== */}
        {hasBasicInfo && (
          <section className="place-detail-section place-detail-section-first">
            <div className="place-section-heading">
              <span>
                방문 전 확인
              </span>

              <h2>
                기본 정보
              </h2>
            </div>

            <div className="place-basic-card">
              {place.address && (
                <BasicInfoRow
                  icon={
                    <MapPin
                      size={
                        20
                      }
                    />
                  }
                  label="주소"
                >
                  <p>
                    {
                      place.address
                    }
                  </p>

                  <a
                    href={
                      kakaoMapUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="place-inline-link"
                  >
                    카카오맵에서
                    확인

                    <ExternalLink
                      size={
                        13
                      }
                    />
                  </a>
                </BasicInfoRow>
              )}

              {place.business_hours && (
                <BasicInfoRow
                  icon={
                    <Clock3
                      size={
                        20
                      }
                    />
                  }
                  label="운영시간"
                >
                  <StructuredInfoList
                    value={place.business_hours}
                  />
                </BasicInfoRow>
              )}

              {place.admission_fee && (
                <BasicInfoRow
                  icon={
                    <ReceiptText
                      size={
                        20
                      }
                    />
                  }
                  label="이용요금"
                >
                  <StructuredInfoList
                    value={place.admission_fee}
                  />
                </BasicInfoRow>
              )}

              {place.phone && (
                <BasicInfoRow
                  icon={
                    <Phone
                      size={
                        20
                      }
                    />
                  }
                  label="전화"
                >
                  <a
                    href={`tel:${place.phone}`}
                  >
                    {
                      place.phone
                    }
                  </a>
                </BasicInfoRow>
              )}

              {place.website_url && (
                <BasicInfoRow
                  icon={
                    <Globe
                      size={
                        20
                      }
                    />
                  }
                  label="홈페이지"
                >
                  <a
                    href={
                      place.website_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="place-inline-link"
                  >
                    공식 홈페이지

                    <ExternalLink
                      size={
                        13
                      }
                    />
                  </a>
                </BasicInfoRow>
              )}
            </div>
          </section>
        )}

        {/* =========================
            2. 이곳은 어떤 곳인가요?
        ========================== */}
        {place.description && (
          <section className="place-detail-section">
            <div className="place-section-heading">
              <span>
                장소 이야기
              </span>

              <h2>
                이곳은 어떤 곳인가요?
              </h2>
            </div>

            <div className="place-description">
              {
                place.description
              }
            </div>
          </section>
        )}

        {/* =========================
            3. 블로그 후기
        ========================== */}
        {hasBlogReviews && (
          <section className="place-detail-section">
            <div className="place-section-heading">
              <span>
                실제 방문자 기록
              </span>

              <h2>
                블로그에서 더 살펴보세요
              </h2>

              <p>
                실제 방문자가 작성한
                네이버 블로그 후기를
                참고해보세요.
              </p>
            </div>

            <div className="place-blog-review-grid">
              {place.blog_reviews!.map(
                (
                  review,
                  index
                ) => (
                  <a
                    key={`${review.url}-${index}`}
                    href={
                      review.url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="place-blog-review-card"
                  >
                    <div className="place-blog-review-top">
                      <span className="place-blog-badge">
                        N BLOG
                      </span>

                      <ExternalLink
                        size={
                          16
                        }
                      />
                    </div>

                    <h3>
                      {
                        review.title
                      }
                    </h3>

                    {review.description && (
                      <p>
                        {
                          review.description
                        }
                      </p>
                    )}

                    <div className="place-blog-review-footer">
                      <span>
                        {review.source ||
                          "네이버 블로그"}
                      </span>

                      <strong>
                        후기 보기 →
                      </strong>
                    </div>
                  </a>
                )
              )}
            </div>
          </section>
        )}

        {/* =========================
            4. 부모님과 함께 가기 좋은 이유
        ========================== */}
        {place.parent_recommendation && (
          <section className="place-parent-recommendation place-parent-recommendation-spaced">
            <div className="place-section-eyebrow">
              <Sparkles
                size={
                  16
                }
              />

              엄마랑 아빠랑 추천
            </div>

            <h2>
              부모님과 함께 가기 좋은 이유
            </h2>

            <p>
              {
                place.parent_recommendation
              }
            </p>
          </section>
        )}

        {/* =========================
            5. 방문 꿀팁
        ========================== */}
        {hasTips && (
          <section className="place-detail-section">
            <div className="place-section-heading">
              <span>
                방문 전 알아두면 좋아요
              </span>

              <h2>
                방문 꿀팁
              </h2>
            </div>

            <div className="place-tip-list">
              {place.visit_tips!.map(
                (
                  tip,
                  index
                ) => (
                  <div
                    className="place-tip-item"
                    key={`${tip}-${index}`}
                  >
                    <span className="place-tip-icon">
                      <Lightbulb
                        size={
                          19
                        }
                      />
                    </span>

                    <p>
                      {tip}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* =========================
            6. FAQ
        ========================== */}
        {hasFaq && (
          <section className="place-detail-section">
            <div className="place-section-heading">
              <span>
                많이 궁금해하는 내용
              </span>

              <h2>
                FAQ
              </h2>
            </div>

            <div className="place-faq-list">
              {place.faq!.map(
                (
                  item,
                  index
                ) => (
                  <details
                    className="place-faq-item"
                    key={`${item.question}-${index}`}
                  >
                    <summary>
                      <span className="place-faq-question-icon">
                        <MessageCircleQuestion
                          size={
                            19
                          }
                        />
                      </span>

                      <strong>
                        {
                          item.question
                        }
                      </strong>

                      <ChevronDown
                        className="place-faq-chevron"
                        size={
                          18
                        }
                      />
                    </summary>

                    <div className="place-faq-answer">
                      {
                        item.answer
                      }
                    </div>
                  </details>
                )
              )}
            </div>
          </section>
        )}

        {/* =========================
            7. 위치
        ========================== */}
        {place.address && (
          <section className="place-detail-section">
            <div className="place-section-heading">
              <span>
                위치 안내
              </span>

              <h2>
                어디에 있나요?
              </h2>

              <p>
                출발 전 정확한
                위치와 이동 경로를
                확인해보세요.
              </p>
            </div>

            <Link
              href={
                internalMapUrl
              }
              className="place-map-card"
            >
              <div className="place-map-decoration">
                <span className="place-map-line place-map-line-one" />
                <span className="place-map-line place-map-line-two" />
                <span className="place-map-line place-map-line-three" />

                <span className="place-map-pin place-map-pin-one">
                  <MapPin
                    size={
                      22
                    }
                  />
                </span>

                <span className="place-map-pin place-map-pin-two">
                  <MapPin
                    size={
                      18
                    }
                  />
                </span>
              </div>

              <div className="place-map-copy">
                <div>
                  <span>
                    주소
                  </span>

                  <strong>
                    {
                      place.address
                    }
                  </strong>
                </div>

                <div className="place-map-button">
                  사이트 지도에서 위치 보기

                  <span
                    aria-hidden="true"
                    className="place-chevron"
                  >
                    →
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* =========================
            8. 주변 추천
        ========================== */}
        {relatedSections.length >
          0 && (
          <section className="place-nearby-section">
            <div className="place-nearby-heading">
              <span>
                이 근처에서 함께
              </span>

              <h2>
                부모님과 더 둘러보세요
              </h2>

              <p>
                {place.city}에서 함께
                들르기 좋은 장소를
                카테고리별로 모아봤어요.
              </p>
            </div>

            {relatedSections.map(
              (
                section
              ) => {
                const info =
                  RELATED_SECTION_INFO[
                    section.type
                  ];

                return (
                  <div
                    className="place-related-section"
                    key={
                      section.type
                    }
                  >
                    <div className="place-related-heading">
                      <div>
                        <span>
                          {
                            PLACE_TYPE_LABEL[
                              section.type
                            ]
                          }
                        </span>

                        <h3>
                          {
                            info.title
                          }
                        </h3>

                        <p>
                          {
                            info.description
                          }
                        </p>
                      </div>

                      <Link
                        href={`/places?type=${section.type}&region=${encodeURIComponent(
                          place.region
                        )}&city=${encodeURIComponent(
                          place.city
                        )}`}
                        className="place-related-all-link"
                      >
                        더보기 →
                      </Link>
                    </div>

                    <div className="place-related-grid">
                      {section.items.map(
                        (
                          relatedPlace
                        ) => (
                          <RelatedPlaceCard
                            key={
                              relatedPlace.id
                            }
                            place={
                              relatedPlace
                            }
                          />
                        )
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </section>
        )}

        {/* 태그 */}
        {place.tags &&
          place.tags.length >
            0 && (
            <section className="place-tag-section">
              <span className="place-tag-title">
                이런 곳이에요
              </span>

              <div className="place-tags">
                {place.tags.map(
                  (
                    tag
                  ) => (
                    <span
                      key={
                        tag
                      }
                    >
                      #{tag}
                    </span>
                  )
                )}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}