import Link from "next/link";

import {
  BedDouble,
  ChevronRight,
  Coffee,
  Gift,
  MapPinned,
  MapPin,
  Utensils,
} from "lucide-react";

import HomeRecommendations from "@/components/HomeRecommendations";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { getPublishedPlaces } from "@/lib/places";

const HERO_PROMOTIONS = [
  {
    badge: "오늘의 추천",
    title: "부모님과 함께\n어디로 떠나볼까요?",
    href: "/places?type=attraction",
    image: null as string | null,
  },
  {
    badge: "추천 장소",
    title: "이번 주말\n가볍게 다녀오기 좋은 곳",
    href: "/places?type=attraction",
    image: null as string | null,
  },
];

export default async function Home() {
  const places =
    await getPublishedPlaces();

  return (
    <main className="parent-home">
      {/* =========================
          HERO
      ========================== */}
      <section className="parent-hero">
        <div className="container parent-hero-inner">
          <div className="parent-hero-copy">
            <span className="parent-hero-kicker">
              함께 걷는 길, 더 가까워지는 마음
            </span>

            <h1>
              부모님과 함께하는{" "}
              <span className="parent-hero-title-break" />
              <em>소중한 시간</em>
            </h1>

            <p>
              좋은 장소에서 나누는 따뜻한 순간이 오래도록 기억에 남을 추억이 됩니다.
            </p>

            <SearchAutocomplete
              places={places}
              className="parent-hero-search-autocomplete"
              placeholder="지역, 장소, 맛집 등을 검색해보세요"
              ariaLabel="지역 또는 장소 검색"
            />
          </div>

          {/* 광고/추천 2칸 */}
          <div className="parent-hero-promos">
            {HERO_PROMOTIONS.map(
              (promotion, index) => (
                <Link
                  key={`${promotion.badge}-${promotion.title}`}
                  href={promotion.href}
                  className={[
                    "parent-hero-promo-card",
                    `promo-${index + 1}`,
                  ].join(" ")}
                  style={
                    promotion.image
                      ? {
                          backgroundImage: `
                            linear-gradient(
                              180deg,
                              rgba(16, 37, 30, 0.04) 22%,
                              rgba(16, 45, 35, 0.80) 100%
                            ),
                            url("${promotion.image}")
                          `,
                        }
                      : undefined
                  }
                >
                  <div className="parent-hero-promo-message">
                    <span>
                      {promotion.badge}
                    </span>

                    <strong>
                      {promotion.title
                        .split("\n")
                        .map((line) => (
                          <span key={line}>
                            {line}
                          </span>
                        ))}
                    </strong>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* =========================
          카테고리
      ========================== */}
      <section className="parent-category-section">
        <div className="container">
          <div className="parent-category-scroll-wrap">
            <div className="parent-category-grid">
              <Link
                href="/places?type=attraction"
                className="parent-category-card category-attraction"
              >
                <div className="parent-category-shade" />

                <span className="parent-category-icon">
                  <MapPin size={24} />
                </span>

                <div>
                  <strong>가볼만한 곳</strong>
                  <p>자연과 문화가 있는 곳</p>
                </div>
              </Link>

              <Link
                href="/places?type=restaurant"
                className="parent-category-card category-restaurant"
              >
                <div className="parent-category-shade" />

                <span className="parent-category-icon">
                  <Utensils size={23} />
                </span>

                <div>
                  <strong>맛집</strong>
                  <p>부모님과 함께 맛있는 한 끼</p>
                </div>
              </Link>

              <Link
                href="/places?type=cafe"
                className="parent-category-card category-cafe"
              >
                <div className="parent-category-shade" />

                <span className="parent-category-icon">
                  <Coffee size={24} />
                </span>

                <div>
                  <strong>카페</strong>
                  <p>차 한잔하며 쉬어가기 좋은 곳</p>
                </div>
              </Link>

              <Link
                href="/places?type=accommodation"
                className="parent-category-card category-stay"
              >
                <div className="parent-category-shade" />

                <span className="parent-category-icon">
                  <BedDouble size={24} />
                </span>

                <div>
                  <strong>숙소</strong>
                  <p>편안하게 쉬기 좋은 곳</p>
                </div>
              </Link>

              <Link
                href="/gifts"
                className="parent-category-card category-gift"
              >
                <div className="parent-category-shade" />

                <span className="parent-category-icon">
                  <Gift size={24} />
                </span>

                <div>
                  <strong>부모님 선물</strong>
                  <p>마음을 전하는 특별한 선물</p>
                </div>
              </Link>
            </div>

            <div
              className="parent-category-swipe-hint"
              aria-hidden="true"
            >
              <span>옆으로 밀어보세요</span>
              <ChevronRight size={25} strokeWidth={3.2} />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          지도 배너
      ========================== */}
      <section className="parent-map-section">
        <div className="container">
          <Link
            href="/map"
            className="parent-map-banner"
          >
            <div className="parent-map-content">
              <span className="parent-map-icon">
                <MapPinned size={31} />
              </span>

              <div>
                <strong>
                  지도에서 주변 장소 찾기
                </strong>

                <p>
                  가볼만한 곳, 맛집, 카페, 숙소를 지도에서 한눈에 확인해보세요.
                </p>

                <span className="parent-map-button">
                  지도에서 보기
                  <ChevronRight size={17} />
                </span>
              </div>
            </div>

            <div className="parent-map-decoration">
              <span className="map-road road-one" />
              <span className="map-road road-two" />
              <span className="map-road road-three" />

              <MapPin className="fake-map-pin pin-one" />
              <MapPin className="fake-map-pin pin-two" />
              <MapPin className="fake-map-pin pin-three" />
              <MapPin className="fake-map-pin pin-four" />
            </div>
          </Link>
        </div>
      </section>

      <HomeRecommendations places={places} />

      {/* =========================
          추천코스
      ========================== */}
      <section className="parent-course-section">
        <div className="container">
          <div className="parent-section-heading">
            <div>
              <span>엄마랑 아빠랑 추천</span>
              <h2>하루를 어떻게 보낼까요?</h2>
              <p>
                부모님과 함께하기 좋은 장소를 하나의 코스로 연결해드려요.
              </p>
            </div>

            <Link href="/courses">
              더보기
              <ChevronRight size={17} />
            </Link>
          </div>

          <Link
            href="/courses"
            className="parent-course-card"
          >
            <div>
              <span className="parent-course-badge">
                추천코스
              </span>

              <h3>
                부모님과 떠나는
                <br />
                편안한 하루
              </h3>

              <p>
                멀리 이동하지 않아도 좋은 장소들을 하나의 동선으로 만나보세요.
              </p>
            </div>

            <div className="parent-course-flow">
              <span>가볼만한 곳</span>
              <ChevronRight size={16} />
              <span>맛집</span>
              <ChevronRight size={16} />
              <span>카페</span>
              <ChevronRight size={16} />
              <span>숙소</span>
            </div>
          </Link>
        </div>
      </section>

      {/* =========================
          부모님 선물
      ========================== */}
      <section className="parent-gift-section">
        <div className="container">
          <Link
            href="/gifts"
            className="parent-gift-banner"
          >
            <div>
              <span>부모님 선물 · 핫딜</span>

              <h2>
                마음을 전하는
                <br />
                좋은 선물을 찾아보세요
              </h2>

              <p>
                부모님께 드리기 좋은 선물과 괜찮은 혜택을 한곳에 모아드릴게요.
              </p>
            </div>

            <ChevronRight size={28} />
          </Link>
        </div>
      </section>
    </main>
  );
}
