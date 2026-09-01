import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type EditPlacePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    success?: string | string[];
    error?: string | string[];
  }>;
};

function getMessage(
  value: string | string[] | undefined
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function stringArrayText(
  value: unknown
) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .join("\n");
}

function tagsText(
  value: unknown
) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .join(", ");
}

function faqText(
  value: unknown
) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return null;
      }

      const record =
        item as Record<string, unknown>;

      const question =
        typeof record.question === "string"
          ? record.question
          : "";

      const answer =
        typeof record.answer === "string"
          ? record.answer
          : "";

      if (!question || !answer) {
        return null;
      }

      return `${question} | ${answer}`;
    })
    .filter(
      (item): item is string =>
        item !== null
    )
    .join("\n");
}

function blogReviewsText(
  value: unknown
) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return null;
      }

      const record =
        item as Record<string, unknown>;

      const title =
        typeof record.title === "string"
          ? record.title
          : "";

      const url =
        typeof record.url === "string"
          ? record.url
          : "";

      const source =
        typeof record.source === "string"
          ? record.source
          : "";

      const description =
        typeof record.description === "string"
          ? record.description
          : "";

      if (!title || !url) {
        return null;
      }

      return [
        title,
        url,
        source,
        description,
      ].join(" | ");
    })
    .filter(
      (item): item is string =>
        item !== null
    )
    .join("\n");
}

export default async function EditPlacePage({
  params,
  searchParams,
}: EditPlacePageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const successMessage =
    getMessage(query.success);

  const errorMessage =
    getMessage(query.error);

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data: adminUser,
    error: adminError,
  } =
    await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    adminError ||
    !adminUser
  ) {
    redirect("/admin/login");
  }

  const {
    data: place,
    error: placeError,
  } =
    await supabase
      .from("places")
      .select(`
        id,
        name,
        slug,
        place_type,
        region,
        city,
        address,
        latitude,
        longitude,
        phone,
        website_url,
        summary,
        description,
        parent_recommendation,
        business_hours,
        closed_days,
        admission_fee,
        parking,
        restroom,
        walking_easy,
        nearby_cafe,
        seating_type,
        cuisine_type,
        environment_type,
        visit_tips,
        faq,
        blog_reviews,
        image_url,
        tags,
        is_published,
        recommendation_score,
        is_editor_pick,
        is_partner
      `)
      .eq("slug", slug)
      .maybeSingle();

  if (
    placeError ||
    !place
  ) {
    redirect(
      "/admin/places?error=수정할 장소를 찾을 수 없습니다."
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f8f7",
      }}
    >
      <section
        style={{
          padding: "42px 0",
          background:
            "linear-gradient(135deg, #173f36, #246a59)",
          color: "#ffffff",
        }}
      >
        <div className="container">
          <p
            style={{
              margin: "0 0 8px",
              opacity: 0.76,
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            EOMMA APPA RANG ADMIN
          </p>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "32px",
            }}
          >
            장소 정보 수정
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.88,
              lineHeight: 1.7,
            }}
          >
            {place.name}의 등록 정보를 수정합니다.
          </p>
        </div>
      </section>

      <section
        style={{
          padding: "34px 0 70px",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <a
              href="/admin/places"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "42px",
                padding: "0 15px",
                border: "1px solid #cddbd6",
                borderRadius: "10px",
                background: "#ffffff",
                color: "#355a50",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              ← 장소 관리로 돌아가기
            </a>

            <a
              href={`/places/${place.slug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#07866c",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              실제 상세페이지 보기 ↗
            </a>
          </div>

          {successMessage && (
            <div
              style={{
                marginBottom: "20px",
                padding: "16px 18px",
                borderRadius: "14px",
                background: "#e8f7f1",
                color: "#08705f",
                fontWeight: 800,
              }}
            >
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                marginBottom: "20px",
                padding: "16px 18px",
                borderRadius: "14px",
                background: "#fff0f0",
                color: "#a43a3a",
                fontWeight: 800,
              }}
            >
              {errorMessage}
            </div>
          )}

          <form
            action="/api/admin/places/update"
            method="post"
            style={{
              padding: "30px",
              borderRadius: "22px",
              background: "#ffffff",
              border: "1px solid #dbe7e2",
              boxShadow:
                "0 14px 38px rgba(23,63,54,0.06)",
            }}
          >
            <input
              type="hidden"
              name="original_slug"
              value={place.slug}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "28px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 7px",
                    color: "#173f36",
                    fontSize: "24px",
                  }}
                >
                  {place.name}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#6c7b76",
                  }}
                >
                  기존 내용을 불러온 상태입니다.
                  필요한 항목만 수정한 뒤 저장하세요.
                </p>
              </div>

              <button
                type="submit"
                style={{
                  minHeight: "48px",
                  padding: "0 22px",
                  border: 0,
                  borderRadius: "13px",
                  background: "#07866c",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                수정 내용 저장
              </button>
            </div>

            <div style={gridStyle}>
              <label>
                <strong>장소 유형 *</strong>
                <select
                  name="place_type"
                  required
                  defaultValue={
                    place.place_type ?? ""
                  }
                  style={inputStyle}
                >
                  <option value="attraction">
                    가볼만한 곳
                  </option>
                  <option value="restaurant">
                    맛집
                  </option>
                  <option value="cafe">
                    카페
                  </option>
                  <option value="accommodation">
                    숙소
                  </option>
                </select>
              </label>

              <label>
                <strong>장소명 *</strong>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={
                    place.name ?? ""
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>영문 식별자 *</strong>
                <input
                  name="slug"
                  type="text"
                  required
                  readOnly
                  defaultValue={
                    place.slug ?? ""
                  }
                  style={{
                    ...inputStyle,
                    background: "#f3f6f5",
                    color: "#697773",
                  }}
                />
                <p style={helpTextStyle}>
                  상세페이지 주소와 연결되는 값이라
                  수정 화면에서는 변경하지 않습니다.
                </p>
              </label>

              <label>
                <strong>지역 *</strong>
                <select
                  name="region"
                  required
                  defaultValue={
                    place.region ?? ""
                  }
                  style={inputStyle}
                >
                  <option value="서울">서울</option>
                  <option value="경기">경기</option>
                  <option value="인천">인천</option>
                  <option value="강원">강원</option>
                  <option value="충북">충북</option>
                  <option value="충남">충남</option>
                  <option value="대전">대전</option>
                  <option value="세종">세종</option>
                  <option value="전북">전북</option>
                  <option value="전남">전남</option>
                  <option value="광주">광주</option>
                  <option value="경북">경북</option>
                  <option value="경남">경남</option>
                  <option value="대구">대구</option>
                  <option value="울산">울산</option>
                  <option value="부산">부산</option>
                  <option value="제주">제주</option>
                </select>
              </label>

              <label>
                <strong>시·군·구 *</strong>
                <input
                  name="city"
                  type="text"
                  required
                  defaultValue={
                    place.city ?? ""
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>전화번호</strong>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={
                    place.phone ?? ""
                  }
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={singleStyle}>
              <label>
                <strong>주소 *</strong>
                <input
                  name="address"
                  type="text"
                  required
                  defaultValue={
                    place.address ?? ""
                  }
                  style={inputStyle}
                />
              </label>
            </div>

            <div
              style={{
                ...gridStyle,
                marginTop: "20px",
              }}
            >
              <label>
                <strong>위도</strong>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={
                    place.latitude ?? ""
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>경도</strong>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={
                    place.longitude ?? ""
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>홈페이지</strong>
                <input
                  name="website_url"
                  type="url"
                  defaultValue={
                    place.website_url ?? ""
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>운영시간</strong>
                <textarea
                  name="business_hours"
                  rows={3}
                  defaultValue={
                    place.business_hours ?? ""
                  }
                  placeholder={`예)
운영시간 | 09:00 ~ 20:00
입장마감 | 19:00`}
                  style={compactTextareaStyle}
                />
                <p style={helpTextStyle}>
                  지금은 기존 한 줄 입력도 그대로
                  저장할 수 있습니다.
                </p>
              </label>

              <label>
                <strong>휴무일</strong>
                <input
                  name="closed_days"
                  type="text"
                  defaultValue={
                    place.closed_days ?? ""
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>입장료 / 이용요금</strong>
                <textarea
                  name="admission_fee"
                  rows={5}
                  defaultValue={
                    place.admission_fee ?? ""
                  }
                  placeholder={`예)
양주시민 성인 | 1,000원
일반 성인 | 7,000원
일반 청소년·군인 | 5,000원`}
                  style={compactTextareaStyle}
                />
              </label>

              <label>
                <strong>실내 / 실외</strong>
                <select
                  name="environment_type"
                  defaultValue={
                    place.environment_type ?? ""
                  }
                  style={inputStyle}
                >
                  <option value="">
                    선택 안 함
                  </option>
                  <option value="indoor">
                    실내
                  </option>
                  <option value="outdoor">
                    실외
                  </option>
                  <option value="mixed">
                    실내 + 실외
                  </option>
                </select>
              </label>

              <label>
                <strong>좌석 형태</strong>
                <select
                  name="seating_type"
                  defaultValue={
                    place.seating_type ?? ""
                  }
                  style={inputStyle}
                >
                  <option value="">
                    선택 안 함
                  </option>
                  <option value="chair">
                    의자식
                  </option>
                  <option value="floor">
                    좌식
                  </option>
                  <option value="mixed">
                    의자식 + 좌식
                  </option>
                </select>
              </label>

              <label>
                <strong>음식 종류</strong>
                <input
                  name="cuisine_type"
                  type="text"
                  defaultValue={
                    place.cuisine_type ?? ""
                  }
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={singleStyle}>
              <label>
                <strong>한줄 소개 *</strong>
                <textarea
                  name="summary"
                  required
                  rows={3}
                  defaultValue={
                    place.summary ?? ""
                  }
                  style={textareaStyle}
                />
              </label>
            </div>

            <div style={singleStyle}>
              <label>
                <strong>상세 설명</strong>
                <textarea
                  name="description"
                  rows={6}
                  defaultValue={
                    place.description ?? ""
                  }
                  style={textareaStyle}
                />
              </label>
            </div>

            <div style={singleStyle}>
              <label>
                <strong>
                  부모님과 함께 가기 좋은 이유
                </strong>
                <textarea
                  name="parent_recommendation"
                  rows={5}
                  defaultValue={
                    place.parent_recommendation ??
                    ""
                  }
                  style={textareaStyle}
                />
              </label>
            </div>

            <div style={singleStyle}>
              <label>
                <strong>검색 태그</strong>
                <input
                  name="tags"
                  type="text"
                  defaultValue={
                    tagsText(place.tags)
                  }
                  style={inputStyle}
                />
              </label>
            </div>

            <section
              style={{
                marginTop: "28px",
                padding: "24px",
                borderRadius: "18px",
                border: "1px solid #dfe9e4",
                background: "#fbfdfc",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#173f36",
                  fontSize: "19px",
                  marginBottom: "7px",
                }}
              >
                상세페이지 추가 콘텐츠
              </strong>

              <p
                style={{
                  margin: "0 0 22px",
                  color: "#78857f",
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                기존에 저장된 방문 팁, FAQ,
                블로그 후기도 이곳에서 바로
                수정할 수 있습니다.
              </p>

              <label>
                <strong>방문 꿀팁</strong>
                <textarea
                  name="visit_tips"
                  rows={7}
                  defaultValue={
                    stringArrayText(
                      place.visit_tips
                    )
                  }
                  style={textareaStyle}
                />
              </label>

              <div style={singleStyle}>
                <label>
                  <strong>FAQ</strong>
                  <textarea
                    name="faq"
                    rows={10}
                    defaultValue={
                      faqText(place.faq)
                    }
                    style={textareaStyle}
                  />
                  <p style={helpTextStyle}>
                    질문 | 답변 형식으로
                    한 줄에 하나씩 입력합니다.
                  </p>
                </label>
              </div>

              <div style={singleStyle}>
                <label>
                  <strong>
                    실제 방문자 네이버 블로그 후기
                  </strong>
                  <textarea
                    name="blog_reviews"
                    rows={10}
                    defaultValue={
                      blogReviewsText(
                        place.blog_reviews
                      )
                    }
                    style={textareaStyle}
                  />
                  <p style={helpTextStyle}>
                    제목 | URL | 작성자 |
                    간단한 안내 형식입니다.
                  </p>
                </label>
              </div>
            </section>

            <section
              style={{
                marginTop: "22px",
                padding: "20px",
                borderRadius: "14px",
                background: "#f5faf8",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "14px",
                  color: "#173f36",
                }}
              >
                편의 및 노출 설정
              </strong>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "20px",
                }}
              >
                <label>
                  <input
                    type="checkbox"
                    name="parking"
                    defaultChecked={
                      place.parking === true
                    }
                  />{" "}
                  주차 가능
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="restroom"
                    defaultChecked={
                      place.restroom === true
                    }
                  />{" "}
                  화장실 있음
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="walking_easy"
                    defaultChecked={
                      place.walking_easy === true
                    }
                  />{" "}
                  걷기 편함
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="nearby_cafe"
                    defaultChecked={
                      place.nearby_cafe === true
                    }
                  />{" "}
                  주변 카페 있음
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="is_editor_pick"
                    defaultChecked={
                      place.is_editor_pick === true
                    }
                  />{" "}
                  엄마랑 아빠랑 추천
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="is_published"
                    defaultChecked={
                      place.is_published === true
                    }
                  />{" "}
                  바로 공개
                </label>
              </div>
            </section>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "28px",
              }}
            >
              <button
                type="submit"
                style={{
                  minHeight: "50px",
                  padding: "0 24px",
                  border: 0,
                  borderRadius: "13px",
                  background: "#07866c",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                수정 내용 저장
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
};

const singleStyle = {
  marginTop: "20px",
};

const inputStyle = {
  width: "100%",
  minHeight: "48px",
  marginTop: "9px",
  padding: "0 13px",
  border: "1px solid #ccd9d4",
  borderRadius: "11px",
  background: "#ffffff",
  fontSize: "15px",
};

const textareaStyle = {
  width: "100%",
  marginTop: "9px",
  padding: "13px",
  border: "1px solid #ccd9d4",
  borderRadius: "11px",
  background: "#ffffff",
  fontSize: "15px",
  lineHeight: 1.7,
  resize: "vertical" as const,
};

const compactTextareaStyle = {
  ...textareaStyle,
  minHeight: "92px",
};

const helpTextStyle = {
  margin: "8px 0 0",
  color: "#8a9691",
  fontSize: "12px",
  lineHeight: 1.65,
};
