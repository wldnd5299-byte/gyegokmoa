import type { ReactNode } from "react";
import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Compass,
  Check,
  Dog,
  ExternalLink,
  MapPin,
  Navigation,
  ParkingCircle,
  Phone,
  Tag,
  Toilet,
  CircleHelp,
  X,
} from "lucide-react";

import {
  getPublishedValleyBySlug,
} from "@/lib/valleys";

import ValleyDetailMap from "@/components/ValleyDetailMap";

type ValleyDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};
export async function generateMetadata({
  params,
}: ValleyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const valley = await getPublishedValleyBySlug(slug);

  if (!valley) {
    return {
      title: "계곡 정보",
    };
  }

  const description =
    valley.summary ||
    `${valley.region} ${valley.city}에 위치한 ${valley.name}의 위치, 주차, 화장실, 편의시설 정보를 확인하세요.`;

  return {
    title: valley.name,
    description,

    openGraph: {
      title: `${valley.name} | 계곡모아`,
      description,
      type: "website",
      images: valley.image_url
        ? [{ url: valley.image_url }]
        : undefined,
    },
  };
}
export default async function ValleyDetailPage({
  params,
}: ValleyDetailPageProps) {
  const { slug } = await params;

  const valley =
    await getPublishedValleyBySlug(
      slug
    );

  if (!valley) {
    notFound();
  }

  const imageSrc =
    valley.image_url ||
    "/main-valley.jpg";

  // 카카오맵 검색
  const kakaoMapUrl =
    `https://map.kakao.com/link/search/${encodeURIComponent(
      valley.address
    )}`;

  // 좌표가 있으면 정확한 위치로 길찾기
  // 없으면 주소 검색으로 대체
  const kakaoDirectionUrl =
    valley.latitude !== null &&
    valley.longitude !== null
      ? `https://map.kakao.com/link/to/${encodeURIComponent(
          valley.name
        )},${valley.latitude},${valley.longitude}`
      : kakaoMapUrl;

  return (
    <main className="valley-detail-page">

      {/* =========================
          대표사진 HERO
      ========================== */}
      <section
        className="valley-detail-hero"
        aria-labelledby="valley-title"
        style={{
          backgroundImage:
            `url("${imageSrc}")`,
        }}
      >
        <div className="valley-detail-overlay" />

        <div className="container valley-detail-hero-content">
          <Link
            href="/#search"
            className="valley-back-link"
          >
            <ArrowLeft
              size={18}
              aria-hidden="true"
            />

            계곡 검색으로 돌아가기
          </Link>

          <span className="valley-detail-region">
            <MapPin
              size={17}
              aria-hidden="true"
            />

            {valley.region}{" "}
            {valley.city}
          </span>

          <h1 id="valley-title">
            {valley.name}
          </h1>

          <p>
            {valley.summary}
          </p>
        </div>
      </section>


      {/* =========================
          상세정보
      ========================== */}
      <section className="valley-detail-section">
        <div className="container valley-detail-layout">

          <div className="valley-detail-main">

            {/* 기본정보 */}
            <section className="valley-info-panel">
              <div className="valley-section-heading">
                <span>
                  INFORMATION
                </span>

                <h2>
                  계곡 기본정보
                </h2>

                <p>
                  방문 전에 주소와 연락처,
                  편의시설 정보를 확인해 주세요.
                </p>
              </div>

              <div className="valley-information-list">

                {/* 주소 */}
                <div className="valley-information-item">
                  <span className="valley-information-icon">
                    <MapPin
                      size={22}
                      aria-hidden="true"
                    />
                  </span>

                  <div>
                    <strong>
                      주소
                    </strong>

                    <p>
                      {valley.address}
                    </p>
                  </div>
                </div>

                {/* 전화번호 */}
                <div className="valley-information-item">
                  <span className="valley-information-icon">
                    <Phone
                      size={22}
                      aria-hidden="true"
                    />
                  </span>

                  <div>
                    <strong>
                      전화번호
                    </strong>

                    {valley.phone ? (
                      <p>
                        <a
                          href={`tel:${valley.phone}`}
                        >
                          {valley.phone}
                        </a>
                      </p>
                    ) : (
                      <p>
                        확인 필요
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </section>


            {/* 실제 지도 */}
            <section className="valley-info-panel">
              <div className="valley-section-heading">
                <span>
                  LOCATION
                </span>

                <h2>
                  계곡 위치
                </h2>

                <p>
                  지도에서 계곡의 정확한
                  위치를 확인해 보세요.
                </p>
              </div>

              <ValleyDetailMap
                name={valley.name}
                latitude={
                  valley.latitude
                }
                longitude={
                  valley.longitude
                }
              />

              {/* 지도 버튼 */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                }}
              >
                <a
                  href={kakaoMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="valley-map-button"
                >
                  카카오맵에서 보기

                  <ExternalLink
                    size={17}
                    aria-hidden="true"
                  />
                </a>

                <a
                  href={kakaoDirectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="valley-map-button"
                >
                  길찾기

                  <Navigation
                    size={17}
                    aria-hidden="true"
                  />
                </a>
              </div>
            </section>


            {/* 편의시설 */}
            <section className="valley-facility-panel">
              <div className="valley-section-heading">
                <span>
                  FACILITIES
                </span>

                <h2>
                  편의시설 안내
                </h2>
              </div>

              <div className="valley-facility-grid">

                <FacilityCard
                  icon={
                    <ParkingCircle
                      size={25}
                    />
                  }
                  title="주차"
                  available={
                    valley.parking
                  }
                  trueText="가능"
                  falseText="불가"
                />

                <FacilityCard
                  icon={
                    <Toilet
                      size={25}
                    />
                  }
                  title="화장실"
                  available={
                    valley.restroom
                  }
                  trueText="있음"
                  falseText="없음"
                />

                <article className="valley-facility-card">
                  <Compass
                    size={25}
                    aria-hidden="true"
                  />

                  <div>
                    <strong>
                      이용 특징
                    </strong>

                    <span>
                      {valley.activity ||
                        "확인 필요"}
                    </span>
                  </div>
                </article>

                <FacilityCard
                  icon={
                    <Dog
                      size={25}
                    />
                  }
                  title="반려견"
                  available={
                    valley.pet
                  }
                  trueText="동반 가능"
                  falseText="동반 불가"
                />

              </div>
            </section>


            {/* 특징 */}
            <section className="valley-tag-panel">
              <div className="valley-section-heading">
                <span>
                  FEATURES
                </span>

                <h2>
                  계곡 특징
                </h2>
              </div>

              <div className="valley-tag-list">
                {valley.tags.length >
                0 ? (
                  valley.tags.map(
                    (tag) => (
                      <span key={tag}>
                        <Tag
                          size={15}
                          aria-hidden="true"
                        />

                        {tag}
                      </span>
                    )
                  )
                ) : (
                  <p>
                    등록된 특징 정보가
                    없습니다.
                  </p>
                )}
              </div>
            </section>


            {/* 안내 */}
            <section className="valley-notice-panel">
              <h2>
                방문 전 확인해 주세요
              </h2>

              <p>
                계곡의 수위와 출입 가능 여부,
                주차장 운영 상태는 날씨와 현장
                상황에 따라 달라질 수 있습니다.
                출발 전 관할 기관 또는 현장
                연락처를 통해 최신 정보를
                확인해 주세요.
              </p>
            </section>

          </div>


          {/* =========================
              오른쪽 사이드바
          ========================== */}
          <aside className="valley-detail-sidebar">

            {/* 전화 */}
            <div className="valley-contact-card">
              <h2>
                전화 문의
              </h2>

              <p>
                방문 전 현장 상황을
                확인해 보세요.
              </p>

              {valley.phone ? (
                <a
                  href={`tel:${valley.phone}`}
                >
                  <Phone
                    size={18}
                    aria-hidden="true"
                  />

                  {valley.phone}
                </a>
              ) : (
                <span>
                  전화번호 확인 필요
                </span>
              )}
            </div>

          </aside>
        </div>
      </section>
    </main>
  );
}


type FacilityCardProps = {
  icon: ReactNode;
  title: string;
  available:
    | boolean
    | null;
  trueText: string;
  falseText: string;
};

function FacilityCard({
  icon,
  title,
  available,
  trueText,
  falseText,
}: FacilityCardProps) {
  const status =
    available === true
      ? "available"
      : available === false
        ? "unavailable"
        : "unknown";

  const statusText =
    status === "available"
      ? trueText
      : status === "unavailable"
        ? falseText
        : "확인 필요";

  return (
    <article
      className={`valley-facility-card ${
        status === "available"
          ? "is-available"
          : status === "unavailable"
            ? "is-unavailable"
            : "is-unknown"
      }`}
    >
      {icon}

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {status === "available" ? (
            <Check
              size={15}
              aria-hidden="true"
            />
          ) : status === "unavailable" ? (
            <X
              size={15}
              aria-hidden="true"
            />
          ) : (
            <CircleHelp
              size={15}
              aria-hidden="true"
            />
          )}

          {statusText}
        </span>
      </div>
    </article>
  );
}