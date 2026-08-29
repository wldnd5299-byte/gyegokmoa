import Link from "next/link";

import {
  Map,
  MapPin,
  Route,
  Search,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "서비스 소개",
  description:
    "엄마랑 아빠랑은 부모님과 함께 가기 좋은 장소와 맛집, 카페, 숙소, 추천코스를 쉽고 편리하게 찾을 수 있도록 만든 서비스입니다.",
};

export default function AboutPage() {
  return (
    <main className="simple-info-page">
      <section className="simple-info-hero">
        <div className="container simple-info-hero-inner">
          <span className="simple-info-eyebrow">
            ABOUT EOMMA APPA RANG
          </span>

          <h1>
            엄마랑 아빠랑을 소개합니다
          </h1>

          <p>
            부모님과 함께 보내는 시간을
            조금 더 편하고 특별하게 만들 수 있도록
            가볼만한 곳과 하루 코스를 한곳에 모았습니다.
          </p>
        </div>
      </section>

      <section className="simple-info-content">
        <div className="container simple-info-container">
          <div className="simple-info-card">
            <span className="simple-info-icon">
              <Map
                size={26}
                aria-hidden="true"
              />
            </span>

            <h2>
              부모님과 가기 좋은 장소를 한곳에
            </h2>

            <p>
              가볼만한 곳, 맛집, 카페,
              숙소 등 부모님과 함께하기 좋은
              장소를 지역별로 편리하게
              찾아볼 수 있도록 정리합니다.
            </p>
          </div>

          <div className="simple-info-card">
            <span className="simple-info-icon">
              <Search
                size={26}
                aria-hidden="true"
              />
            </span>

            <h2>
              간편한 지역·장소 검색
            </h2>

            <p>
              지역명이나 장소명을 검색해
              원하는 곳을 빠르게 찾아볼 수 있습니다.
              시·군·구뿐 아니라 더 구체적인
              지역 검색도 고려하고 있습니다.
            </p>
          </div>

          <div className="simple-info-card">
            <span className="simple-info-icon">
              <MapPin
                size={26}
                aria-hidden="true"
              />
            </span>

            <h2>
              지도에서 한눈에 확인
            </h2>

            <p>
              지도에서 주변 장소의 위치를
              확인하고, 실제 등록된 장소를
              선택해 자세한 정보를 살펴볼 수 있습니다.
            </p>
          </div>

          <div className="simple-info-card">
            <span className="simple-info-icon">
              <Route
                size={26}
                aria-hidden="true"
              />
            </span>

            <h2>
              추천코스로 하루 동선까지
            </h2>

            <p>
              어디부터 가야 할지 고민될 때는
              추천코스를 통해 장소의 방문 순서와
              이동 동선을 지도에서 함께 확인할 수 있습니다.
            </p>
          </div>

          <div className="simple-info-card">
            <span className="simple-info-icon">
              <ShieldCheck
                size={26}
                aria-hidden="true"
              />
            </span>

            <h2>
              방문 전 최신 정보를 확인해 주세요
            </h2>

            <p>
              운영시간, 이용 가능 여부,
              주차 및 편의시설 등의 정보는
              현장 상황에 따라 달라질 수 있습니다.
              방문 전 최신 정보를 확인해 주세요.
            </p>
          </div>

          <div className="simple-info-actions">
            <Link
              href="/search"
              className="simple-info-primary-button"
            >
              <Search
                size={18}
                aria-hidden="true"
              />
              장소 검색하기
            </Link>

            <Link
              href="/map"
              className="simple-info-secondary-button"
            >
              <MapPin
                size={18}
                aria-hidden="true"
              />
              지도에서 찾기
            </Link>

            <Link
              href="/courses"
              className="simple-info-secondary-button"
            >
              <Route
                size={18}
                aria-hidden="true"
              />
              추천코스 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}