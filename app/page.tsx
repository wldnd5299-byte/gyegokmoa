import Link from "next/link";
import { Map, Sparkles } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";

export default function Home() {
  return (
    <section className="hero hero-photo simple-home" id="search">
      <div className="hero-shade" />

      <div className="container hero-content simple-home-content">
        <span className="eyebrow hero-eyebrow">
          <Sparkles size={15} /> 대한민국 계곡 정보
        </span>

        <h1>
          대한민국의 아름다운 계곡을
          <br />
          <em>한곳에 모았습니다</em>
        </h1>

        <p>
          계곡명이나 지역을 검색하거나,
          <br className="mobile-break" /> 지도에서 원하는 계곡을 찾아보세요.
        </p>

        <SearchBox />

        <Link href="/map" className="simple-map-button">
          <Map size={19} /> 지도에서 계곡 찾기
        </Link>
      </div>

      <div className="hero-bottom-fade" />
    </section>
  );
}
