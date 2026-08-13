import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  ParkingCircle,
  Search,
  Toilet,
} from "lucide-react";

import { getPublishedValleys } from "@/lib/valleys";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;

  const rawQuery = Array.isArray(params.q)
    ? params.q[0]
    : params.q;

  const query = rawQuery?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();

  // Supabase에서 공개 상태인 계곡을 불러옵니다.
  const valleys = await getPublishedValleys();

  const results = query
    ? valleys.filter((valley) => {
        const searchableText = [
          valley.name,
          valley.region,
          valley.city,
          valley.address,
          valley.summary,
          ...(valley.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
    : [];

  return (
    <main className="search-page">
      <section className="search-page-header">
        <div className="container">
          <span className="search-page-eyebrow">
            <Search size={17} aria-hidden="true" />
            계곡 검색
          </span>

          <h1>
            <strong>{query || "검색어 없음"}</strong> 검색 결과
          </h1>

          <p>
            계곡명, 지역, 주소와 계곡 특징을 기준으로 검색한 결과입니다.
          </p>
        </div>
      </section>

      <section className="search-results-section">
        <div className="container">
          <div className="search-results-heading">
            <p>
              총 <strong>{results.length}</strong>개의 계곡을 찾았습니다.
            </p>

            <Link href="/#search">다시 검색하기</Link>
          </div>

          {results.length > 0 ? (
            <div className="search-results-grid">
              {results.map((valley) => {
                const imageSrc =
                  valley.image_url || "/main-valley.jpg";

                return (
                  <article
                    className="search-result-card"
                    key={valley.id}
                  >
                    <div className="search-result-image">
                      <Image
                        src={imageSrc}
                        alt={`${valley.name} 대표사진`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />

                      <div className="search-result-image-overlay" />

                      <span>{valley.region}</span>
                      <strong>{valley.name}</strong>
                    </div>

                    <div className="search-result-content">
                      <div>
                        <span className="search-result-location">
                          <MapPin size={16} aria-hidden="true" />
                          {valley.region} {valley.city}
                        </span>

                        <h2>{valley.name}</h2>
                        <p>{valley.summary}</p>
                      </div>

                      <div className="search-result-facilities">
                        <span>
                          <ParkingCircle
                            size={16}
                            aria-hidden="true"
                          />
                          주차{" "}
                          {valley.parking === true
                            ? "가능"
                            : "확인 필요"}
                        </span>

                        <span>
                          <Toilet
                            size={16}
                            aria-hidden="true"
                          />
                          화장실{" "}
                          {valley.restroom === true
                            ? "있음"
                            : "확인 필요"}
                        </span>
                      </div>

                      <Link
                        href={`/valleys/${valley.slug}`}
                        className="search-result-link"
                      >
                        자세히 보기
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-search-result">
              <Search size={38} aria-hidden="true" />

              <h2>검색 결과가 없습니다.</h2>

              <p>
                계곡 이름이나 지역명을 다시 확인해 주세요.
                <br />
                예: 용추계곡, 가평, 강원
              </p>

              <Link href="/#search">검색창으로 돌아가기</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}