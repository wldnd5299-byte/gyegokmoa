import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type EditValleyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditValleyPage({
  params,
}: EditValleyPageProps) {
  const { id } = await params;

  const supabase =
    await createClient();

  /*
   * 로그인 사용자 확인
   */
  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  /*
   * 관리자 권한 확인
   */
  const {
    data: adminUser,
  } =
    await supabase
      .from("admin_users")
      .select("user_id")
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

  if (!adminUser) {
    notFound();
  }

  /*
   * 수정할 계곡 조회
   */
  const {
    data: valley,
    error,
  } =
    await supabase
      .from("valleys")
      .select(
        `
          id,
          name,
          slug,
          region,
          city,
          address,
          phone,
          summary,
          tags,
          parking,
          restroom,
          family,
          activity,
          pet,
          latitude,
          longitude,
          image_url,
          is_published
        `
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (
    error ||
    !valley
  ) {
    notFound();
  }

  const tagsText =
    Array.isArray(
      valley.tags
    )
      ? valley.tags.join(", ")
      : "";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f9f7",
      }}
    >
      {/* =========================
          상단
      ========================== */}
      <section
        style={{
          padding: "70px 0 45px",
          background: "#ffffff",
          borderBottom:
            "1px solid #e0ebe7",
        }}
      >
        <div className="container">
          <Link
            href="/admin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              marginBottom: "22px",
              color: "#65746f",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />

            관리자 페이지로 돌아가기
          </Link>

          <p
            style={{
              margin: "0 0 10px",
              color: "#07866c",
              fontSize: "12px",
              fontWeight: 900,
              letterSpacing:
                "0.14em",
            }}
          >
            EDIT VALLEY
          </p>

          <h1
            style={{
              margin: 0,
              color: "#153a32",
              fontSize:
                "clamp(34px, 5vw, 48px)",
              letterSpacing:
                "-0.04em",
            }}
          >
            {valley.name} 수정
          </h1>

          <p
            style={{
              margin:
                "14px 0 0",
              color: "#6b7a75",
              lineHeight: 1.7,
            }}
          >
            계곡의 기본정보와
            편의시설, 좌표를
            수정할 수 있습니다.
          </p>
        </div>
      </section>

      {/* =========================
          수정 폼
      ========================== */}
      <section
        style={{
          padding:
            "50px 0 100px",
        }}
      >
        <div className="container">
          <form
            action="/api/admin/valleys/update"
            method="post"
            className="admin-form"
          >
            <input
              type="hidden"
              name="id"
              value={valley.id}
            />

            <div className="admin-form-heading">
              <div>
                <h2>
                  계곡 정보 수정
                </h2>

                <p>
                  변경할 내용을 입력한 뒤
                  저장해 주세요.
                </p>
              </div>

              <button type="submit">
                <Save
                  size={18}
                  aria-hidden="true"
                />
                수정내용 저장
              </button>
            </div>

            <div className="admin-form-grid">
              {/* 계곡명 */}
              <label>
                <span>
                  계곡명 *
                </span>

                <input
                  type="text"
                  name="name"
                  defaultValue={
                    valley.name
                  }
                  required
                />
              </label>

              {/* slug */}
              <label>
                <span>
                  영문 식별자 *
                </span>

                <input
                  type="text"
                  name="slug"
                  defaultValue={
                    valley.slug
                  }
                  required
                />

                <small>
                  상세페이지 주소와
                  대표사진 연결에 사용됩니다.
                </small>
              </label>

              {/* 지역 */}
              <label>
                <span>
                  지역 *
                </span>

                <select
                  name="region"
                  defaultValue={
                    valley.region
                  }
                  required
                >
                  <option value="경기">
                    경기
                  </option>

                  <option value="강원">
                    강원
                  </option>

                  <option value="충북">
                    충북
                  </option>

                  <option value="충남">
                    충남
                  </option>

                  <option value="전북">
                    전북
                  </option>

                  <option value="전남">
                    전남
                  </option>

                  <option value="경북">
                    경북
                  </option>

                  <option value="경남">
                    경남
                  </option>

                  <option value="제주">
                    제주
                  </option>
                </select>
              </label>

              {/* 시군 */}
              <label>
                <span>
                  시·군 *
                </span>

                <input
                  type="text"
                  name="city"
                  defaultValue={
                    valley.city
                  }
                  required
                />
              </label>

              {/* 주소 */}
              <label className="admin-full-field">
                <span>
                  주소 *
                </span>

                <input
                  type="text"
                  name="address"
                  defaultValue={
                    valley.address
                  }
                  required
                />

                <small>
                  주소를 변경한 경우 위도·경도도
                  함께 확인해 주세요.
                </small>
              </label>

              {/* 전화번호 */}
              <label>
                <span>
                  전화번호
                </span>

                <input
                  type="tel"
                  name="phone"
                  defaultValue={
                    valley.phone ??
                    ""
                  }
                  placeholder="예: 031-582-8830"
                />
              </label>

              {/* 위도 */}
              <label>
                <span>
                  위도
                </span>

                <input
                  type="number"
                  name="latitude"
                  step="any"
                  defaultValue={
                    valley.latitude ??
                    ""
                  }
                  placeholder="예: 37.85995"
                />
              </label>

              {/* 경도 */}
              <label>
                <span>
                  경도
                </span>

                <input
                  type="number"
                  name="longitude"
                  step="any"
                  defaultValue={
                    valley.longitude ??
                    ""
                  }
                  placeholder="예: 127.47891"
                />
              </label>

              {/* 소개 */}
              <label className="admin-full-field">
                <span>
                  간단 소개 *
                </span>

                <textarea
                  name="summary"
                  rows={6}
                  defaultValue={
                    valley.summary
                  }
                  required
                />
              </label>

              {/* 태그 */}
              <label className="admin-full-field">
                <span>
                  특징 태그
                </span>

                <input
                  type="text"
                  name="tags"
                  defaultValue={
                    tagsText
                  }
                  placeholder="예: 가족추천, 물놀이, 폭포"
                />

                <small>
                  태그는 쉼표로
                  구분해 주세요.
                </small>
              </label>
            </div>

            {/* =========================
                편의시설
            ========================== */}
            <div className="admin-option-section">
              <h2>
                편의시설 및 방문정보
              </h2>
              <div className="admin-form-grid">
                <label>
                  <span>주차</span>
                  <select
                    name="parking"
                    defaultValue={
                      valley.parking === true
                        ? "true"
                        : valley.parking === false
                          ? "false"
                          : "null"
                    }
                  >
                    <option value="null">확인 필요</option>
                    <option value="true">가능</option>
                    <option value="false">불가</option>
                  </select>
                </label>

                <label>
                  <span>화장실</span>
                  <select
                    name="restroom"
                    defaultValue={
                      valley.restroom === true
                        ? "true"
                        : valley.restroom === false
                          ? "false"
                          : "null"
                    }
                  >
                    <option value="null">확인 필요</option>
                    <option value="true">있음</option>
                    <option value="false">없음</option>
                  </select>
                </label>

                <label>
                  <span>이용 특징</span>
                  <input
                    type="text"
                    name="activity"
                    defaultValue={
                      valley.activity ?? ""
                    }
                    placeholder="예: 물놀이·계곡 산행"
                  />
                  <small>
                    이 계곡의 대표적인 이용 특징을 짧게 입력해 주세요.
                  </small>
                </label>

                <label>
                  <span>반려견</span>
                  <select
                    name="pet"
                    defaultValue={
                      valley.pet === true
                        ? "true"
                        : valley.pet === false
                          ? "false"
                          : "null"
                    }
                  >
                    <option value="null">확인 필요</option>
                    <option value="true">동반 가능</option>
                    <option value="false">동반 불가</option>
                  </select>
                </label>
              </div>
            </div>

            {/* =========================
                현재 대표사진
            ========================== */}
            <div
              style={{
                marginTop: "30px",
                padding: "24px",
                border:
                  "1px solid #dce8e4",
                borderRadius: "18px",
                background: "#f8fbfa",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#173f36",
                }}
              >
                현재 대표사진
              </strong>

              {valley.image_url ? (
                <img
                  src={
                    valley.image_url
                  }
                  alt={
                    valley.name
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "480px",
                    maxHeight: "280px",
                    objectFit: "cover",
                    borderRadius: "14px",
                  }}
                />
              ) : (
                <p
                  style={{
                    margin: 0,
                    color: "#7a8783",
                  }}
                >
                  등록된 대표사진이 없습니다.
                  관리자 페이지의 대표사진
                  일괄 업로드에서 추가할 수 있습니다.
                </p>
              )}
            </div>

            {/* =========================
                공개상태 안내
            ========================== */}
            <div
              style={{
                marginTop: "20px",
                padding: "20px 22px",
                borderRadius: "16px",
                background:
                  valley.is_published
                    ? "#eaf8f3"
                    : "#fff8e8",
                color:
                  valley.is_published
                    ? "#08705f"
                    : "#725b20",
              }}
            >
              <strong>
                현재 상태:{" "}
                {valley.is_published
                  ? "공개"
                  : "비공개"}
              </strong>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  lineHeight: 1.7,
                }}
              >
                공개/비공개 전환은 관리자
                계곡 목록에서 변경할 수 있습니다.
              </p>
            </div>

            {/* 모바일 저장버튼 */}
            <button
              type="submit"
              className="admin-mobile-submit"
            >
              <Save
                size={18}
                aria-hidden="true"
              />

              수정내용 저장
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}