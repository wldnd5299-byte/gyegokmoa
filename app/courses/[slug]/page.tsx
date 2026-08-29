import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Coffee,
  Hotel,
  MapPin,
  Route,
  Sparkles,
  Utensils,
} from "lucide-react";

import KakaoMap, {
  type MapPlace,
  type MapPlaceType,
} from "@/components/KakaoMap";

import CourseDrivingSummary from "@/components/CourseDrivingSummary";

import {
  getPublishedCourseBySlug,
} from "@/lib/courses";

import "@/styles/courses.css";

type CourseDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getPlaceTypeLabel(
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

function PlaceTypeIcon({
  type,
}: {
  type: string;
}) {
  if (
    type === "restaurant"
  ) {
    return (
      <Utensils
        size={18}
      />
    );
  }

  if (
    type === "cafe"
  ) {
    return (
      <Coffee
        size={18}
      />
    );
  }

  if (
    type === "accommodation"
  ) {
    return (
      <Hotel
        size={18}
      />
    );
  }

  return (
    <MapPin
      size={18}
    />
  );
}

function getImageSrc(
  imageUrl:
    | string
    | null
) {
  return (
    imageUrl ||
    "/main-valley.jpg"
  );
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const {
    slug,
  } = await params;

  const course =
    await getPublishedCourseBySlug(
      decodeURIComponent(
        slug
      )
    );

  if (!course) {
    return {
      title:
        "추천코스를 찾을 수 없습니다",
    };
  }

  return {
    title:
      `${course.title} | 엄마랑 아빠랑`,

    description:
      course.summary,
  };
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const {
    slug,
  } = await params;

  const course =
    await getPublishedCourseBySlug(
      decodeURIComponent(
        slug
      )
    );

  if (!course) {
    notFound();
  }

  const mapPlaces: MapPlace[] =
    course.places
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
        })
      );

  /*
 * 자동차 이동거리 계산용 데이터
 *
 * 차량 접근 좌표가 등록되어 있으면
 * driving 좌표를 우선 사용합니다.
 *
 * 등록되어 있지 않으면
 * 기존 장소 좌표를 사용합니다.
 */
const drivingPlaces =
  course.places.map(
    ({
      place,
    }) => ({
      id:
        place.id,

      name:
        place.name,

      latitude:
        place.driving_latitude ??
        place.latitude,

      longitude:
        place.driving_longitude ??
        place.longitude,
    })
  );

  return (
    <main className="course-detail-page">
      {/* =========================
          HERO
      ========================== */}
      <section className="course-detail-hero">
        <div className="courses-container">
          <Link
            href="/courses"
            className="course-detail-back"
          >
            <ArrowLeft
              size={16}
            />

            추천코스로 돌아가기
          </Link>

          <div className="course-detail-hero-grid">
            <div className="course-detail-hero-copy">
              <span className="course-detail-eyebrow">
                <Sparkles
                  size={16}
                />

                엄마랑 아빠랑 추천코스
              </span>

              <h1>
                {
                  course.title
                }
              </h1>

              <div className="course-detail-meta">
                <span>
                  <MapPin
                    size={15}
                  />

                  {
                    course.region
                  }{" "}
                  {course.city ||
                    ""}
                </span>

                {course.duration_label && (
                  <span>
                    <Clock3
                      size={15}
                    />

                    {
                      course.duration_label
                    }
                  </span>
                )}

                <span>
                  <Route
                    size={15}
                  />

                  {
                    course.places
                      .length
                  }
                  개 장소
                </span>
              </div>

              <p className="course-detail-summary">
                {
                  course.summary
                }
              </p>

              {course.description && (
                <p className="course-detail-description">
                  {
                    course.description
                  }
                </p>
              )}
            </div>

            <div className="course-detail-hero-route">
              <div className="course-detail-hero-route-title">
                <span>
                  오늘의 이동 순서
                </span>

                <Route
                  size={21}
                />
              </div>

              <div className="course-detail-mini-route">
                {course.places.map(
                  (
                    coursePlace,
                    index
                  ) => (
                    <div
                      key={
                        coursePlace.id
                      }
                      className="course-detail-mini-stop"
                    >
                      <span className="course-detail-mini-number">
                        {index +
                          1}
                      </span>

                      <span className="course-detail-mini-icon">
                        <PlaceTypeIcon
                          type={
                            coursePlace
                              .place
                              .place_type
                          }
                        />
                      </span>

                      <div>
                        <small>
                          {getPlaceTypeLabel(
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
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          전체 지도
      ========================== */}
      <section className="course-detail-map-section">
        <div className="courses-container">
          <div className="course-detail-section-heading">
            <span>
              코스 지도
            </span>

            <h2>
              오늘은 이렇게 이동해요
            </h2>

            <p>
              번호 순서대로 장소를
              둘러보는 추천코스입니다.
            </p>
          </div>

          <div className="course-detail-map-card">
            <KakaoMap
              places={
                mapPlaces
              }
              selectedPlaceId={
                null
              }
              courseMode
            />
          </div>

          {/* 실제 자동차 거리 / 시간 */}
          <CourseDrivingSummary
            places={
              drivingPlaces
            }
          />
        </div>
      </section>

      {/* =========================
          장소별 코스
      ========================== */}
      <section className="course-detail-stops-section">
        <div className="courses-container">
          <div className="course-detail-section-heading">
            <span>
              코스 상세
            </span>

            <h2>
              장소별로 살펴보세요
            </h2>

            <p>
              각 장소의 특징과
              추천 포인트를
              순서대로 확인할 수 있습니다.
            </p>
          </div>

          {course.places.length >
          0 ? (
            <div className="course-detail-stop-list">
              {course.places.map(
                (
                  coursePlace,
                  index
                ) => {
                  const place =
                    coursePlace.place;

                  const imageSrc =
                    getImageSrc(
                      place.image_url
                    );

                  return (
                    <article
                      key={
                        coursePlace.id
                      }
                      className="course-detail-stop-card"
                    >
                      <div className="course-detail-stop-number-column">
                        <span className="course-detail-stop-number">
                          {index +
                            1}
                        </span>

                        {index <
                          course
                            .places
                            .length -
                            1 && (
                          <span className="course-detail-stop-line" />
                        )}
                      </div>

                      <div className="course-detail-stop-content">
                        <div
                          className="course-detail-stop-image"
                          style={{
                            backgroundImage:
                              `linear-gradient(to top, rgba(18,39,31,.28), rgba(18,39,31,.02)), url("${imageSrc}")`,
                          }}
                        >
                          <span className="course-detail-stop-type">
                            <PlaceTypeIcon
                              type={
                                place.place_type
                              }
                            />

                            {getPlaceTypeLabel(
                              place.place_type
                            )}
                          </span>
                        </div>

                        <div className="course-detail-stop-copy">
                          <div className="course-detail-stop-location">
                            <MapPin
                              size={14}
                            />

                            {
                              place.region
                            }{" "}
                            {
                              place.city
                            }
                          </div>

                          <h3>
                            {
                              place.name
                            }
                          </h3>

                          {place.summary && (
                            <p className="course-detail-stop-summary">
                              {
                                place.summary
                              }
                            </p>
                          )}

                          {coursePlace.stop_note && (
                            <div className="course-detail-stop-note">
                              <span>
                                이 코스에서
                              </span>

                              <strong>
                                {
                                  coursePlace.stop_note
                                }
                              </strong>
                            </div>
                          )}

                          {place.parent_recommendation && (
                            <div className="course-detail-parent-point">
                              <span>
                                부모님과 함께라면
                              </span>

                              <p>
                                {
                                  place.parent_recommendation
                                }
                              </p>
                            </div>
                          )}

                          <div className="course-detail-stop-actions">
                            <Link
                              href={`/places/${place.slug}`}
                              className="course-detail-place-button"
                            >
                              장소 자세히 보기

                              <ArrowRight
                                size={16}
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="course-detail-empty">
              아직 연결된 장소가
              없습니다.
            </div>
          )}
        </div>
      </section>

      {/* =========================
          하단
      ========================== */}
      <section className="course-detail-bottom">
        <div className="courses-container">
          <div className="course-detail-bottom-card">
            <div>
              <span>
                다른 지역도 둘러보세요
              </span>

              <h2>
                부모님과 다음에는
                어디로 떠나볼까요?
              </h2>

              <p>
                지역을 검색해서
                다른 추천코스도
                지도와 함께 확인할 수 있습니다.
              </p>
            </div>

            <Link
              href="/courses"
              className="course-detail-bottom-button"
            >
              추천코스 더 보기

              <ArrowRight
                size={17}
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}