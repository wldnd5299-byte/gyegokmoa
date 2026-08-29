import Link from "next/link";

import {
  ArrowRight,
  Coffee,
  MapPin,
  Route,
  Sparkles,
  Utensils,
} from "lucide-react";

import CourseMapExplorer from "@/components/CourseMapExplorer";

import {
  getPublishedCoursesWithPlaces,
} from "@/lib/courses";

import "@/styles/courses.css";

export default async function CoursesPage() {
  const courses =
    await getPublishedCoursesWithPlaces(
      50
    );

  return (
    <main className="courses-page">
      {/* =========================
          HERO
      ========================== */}
      <section className="courses-hero">
        <div className="courses-container">
          <div className="courses-hero-copy">
            <span className="courses-eyebrow">
              <Sparkles
                size={16}
              />
              엄마랑 아빠랑 추천
            </span>

            <h1>
              부모님과 보내는 하루,
              <br />
              어디부터 갈까요?
            </h1>

            <p>
              지역을 검색하면
              부모님과 함께하기 좋은
              추천코스를 지도와 함께
              확인할 수 있습니다.
            </p>

            <div className="courses-hero-actions">
              <a
                href="#course-search"
                className="courses-primary-button"
              >
                지역에서 코스 찾기

                <ArrowRight
                  size={17}
                />
              </a>

              <Link
                href="/map"
                className="courses-secondary-button"
              >
                장소만 찾아보기
              </Link>
            </div>
          </div>

          <div className="courses-hero-card">
            <div className="courses-hero-card-top">
              <span>
                추천코스 이용 방법
              </span>

              <Route
                size={22}
              />
            </div>

            <div className="courses-preview-route">
              <div>
                <span className="courses-preview-icon">
                  <MapPin
                    size={17}
                  />
                </span>

                <div>
                  <small>
                    1
                  </small>

                  <strong>
                    원하는 지역 검색
                  </strong>
                </div>
              </div>

              <span className="courses-preview-line" />

              <div>
                <span className="courses-preview-icon">
                  <Route
                    size={17}
                  />
                </span>

                <div>
                  <small>
                    2
                  </small>

                  <strong>
                    추천코스 선택
                  </strong>
                </div>
              </div>

              <span className="courses-preview-line" />

              <div>
                <span className="courses-preview-icon">
                  <Coffee
                    size={17}
                  />
                </span>

                <div>
                  <small>
                    3
                  </small>

                  <strong>
                    지도에서 동선 확인
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =========================
          지역 검색 + 코스 지도
      ========================== */}
      <div
        id="course-search"
      >
        <CourseMapExplorer
          courses={
            courses
          }
        />
      </div>

    
      {/* =========================
          나만의 코스
      ========================== */}
      <section className="courses-my-course">
        <div className="courses-container">
          <div className="courses-my-course-card">
            <div>
              <span>
                나만의 코스
              </span>

              <h2>
                가고 싶은 곳을 직접
                골라보세요
              </h2>

              <p>
                추천코스뿐 아니라
                가볼만한 곳, 맛집, 카페 등을
                직접 선택해서 나만의 코스를
                만들 수 있도록 이어서
                개발합니다.
              </p>
            </div>

            <Link
              href="/map"
              className="courses-my-course-button"
            >
              장소 둘러보기

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