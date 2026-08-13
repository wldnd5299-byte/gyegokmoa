import Link from "next/link";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import KakaoMap from "@/components/KakaoMap";
import { getPublishedValleys } from "@/lib/valleys";

export default async function MapPage() {
  // 공개된 계곡만 가져오기
  const valleys = await getPublishedValleys();

  // 지도에는 좌표가 있는 계곡만 전달
  const mapValleys = valleys
    .filter(
      (valley) =>
        typeof valley.latitude === "number" &&
        typeof valley.longitude === "number"
    )
    .map((valley) => ({
      id: valley.id,
      name: valley.name,
      slug: valley.slug,
      latitude: valley.latitude as number,
      longitude: valley.longitude as number,
    }));

  return (
    <main className="map-page">
      <section className="map-page-header">
        <div className="container">
          <span className="map-page-eyebrow">
            <MapPin size={17} aria-hidden="true" />
            전국 계곡 위치
          </span>

          <h1>지도에서 계곡 찾기</h1>

          <p>
            원하는 계곡을 지도에서 확인하거나 카카오맵으로 위치를 확인해 보세요.
          </p>
        </div>
      </section>

      <section className="map-page-content">
        <div className="container">
          {/* 카카오 지도 */}
          <div className="mb-8">
            <KakaoMap valleys={mapValleys} />
          </div>

          {/* 안내 */}
          <div className="map-guide-box">
            <Navigation size={24} aria-hidden="true" />

            <div>
              <strong>계곡 위치를 확인해 보세요</strong>

              <p>
                지도 마커에 마우스를 올리면 계곡 이름을 확인할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 좌표 없는 경우 안내 */}
          {mapValleys.length === 0 && (
            <div className="admin-list-empty">
              아직 지도에 표시할 계곡 위치 정보가 없습니다.
            </div>
          )}

          {/* 계곡 카드 목록 */}
          <div className="map-valley-grid">
            {valleys.map((valley) => {
              const kakaoMapUrl =
                typeof valley.latitude === "number" &&
                typeof valley.longitude === "number"
                  ? `https://map.kakao.com/link/map/${encodeURIComponent(
                      valley.name
                    )},${valley.latitude},${valley.longitude}`
                  : `https://map.kakao.com/link/search/${encodeURIComponent(
                      valley.address || valley.name
                    )}`;

              return (
                <article
                  className="map-valley-card"
                  key={valley.id}
                >
                  <div
                    className={`map-valley-cover theme-${
                      valley.theme || "default"
                    }`}
                  >
                    <span>{valley.region}</span>
                    <strong>{valley.name}</strong>
                  </div>

                  <div className="map-valley-card-content">
                    <span className="map-valley-location">
                      <MapPin size={16} aria-hidden="true" />
                      {valley.region} {valley.city}
                    </span>

                    <p>{valley.address}</p>

                    <div className="map-valley-actions">
                      <Link href={`/valleys/${valley.slug}`}>
                        상세정보
                      </Link>

                      <a
                        href={kakaoMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        카카오맵
                        <ExternalLink
                          size={15}
                          aria-hidden="true"
                        />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}