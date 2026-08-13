import Link from "next/link";
import {
  Map,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "서비스 소개",
  description:
    "계곡모아는 전국 계곡의 위치와 방문 정보를 쉽고 편리하게 찾을 수 있도록 제공하는 계곡 정보 서비스입니다.",
};

export default function AboutPage() {
  return (
    <main className="simple-info-page">
      <section className="simple-info-hero">
        <div className="container simple-info-hero-inner">
          <span className="simple-info-eyebrow">
            ABOUT GYEGOKMOA
          </span>

          <h1>계곡모아를 소개합니다</h1>

          <p>
            대한민국의 아름다운 계곡 정보를
            한곳에서 쉽고 편리하게 찾아볼 수 있도록
            만들었습니다.
          </p>
        </div>
      </section>

      <section className="simple-info-content">
        <div className="container simple-info-container">
          <div className="simple-info-card">
            <span className="simple-info-icon">
              <Map size={26} aria-hidden="true" />
            </span>

            <h2>계곡 정보를 한곳에</h2>

            <p>
              여러 곳에 흩어져 있는 계곡 정보를
              보다 편리하게 확인할 수 있도록
              계곡명, 지역, 주소와 방문정보를
              정리해 제공합니다.
            </p>
          </div>

          <div className="simple-info-card">
            <span className="simple-info-icon">
              <Search size={26} aria-hidden="true" />
            </span>

            <h2>간편한 계곡 검색</h2>

            <p>
              계곡 이름뿐만 아니라 지역과 주소,
              특징 등을 이용해 원하는 계곡을
              찾아볼 수 있습니다.
            </p>
          </div>

          <div className="simple-info-card">
            <span className="simple-info-icon">
              <MapPin size={26} aria-hidden="true" />
            </span>

            <h2>지도에서 위치 확인</h2>

            <p>
              카카오맵을 통해 계곡의 위치를
              확인하고 길찾기 기능을 이용할 수
              있습니다.
            </p>
          </div>

          <div className="simple-info-card">
            <span className="simple-info-icon">
              <ShieldCheck size={26} aria-hidden="true" />
            </span>

            <h2>방문 전 확인해 주세요</h2>

            <p>
              계곡의 수위, 출입 가능 여부,
              주차 및 편의시설 정보는 날씨와
              현장 상황에 따라 변경될 수 있습니다.
              방문 전 최신 정보를 확인해 주세요.
            </p>
          </div>

          <div className="simple-info-actions">
            <Link
              href="/#search"
              className="simple-info-primary-button"
            >
              <Search size={18} aria-hidden="true" />
              계곡 검색하기
            </Link>

            <Link
              href="/map"
              className="simple-info-secondary-button"
            >
              <MapPin size={18} aria-hidden="true" />
              지도에서 찾기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}