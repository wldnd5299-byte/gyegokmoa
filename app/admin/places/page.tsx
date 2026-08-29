import {
  Coffee,
  FileSpreadsheet,
  Hotel,
  ImagePlus,
  MapPin,
  Save,
  Utensils,
} from "lucide-react";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AdminPlacesPageProps = {
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

function placeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    attraction: "가볼만한 곳",
    restaurant: "맛집",
    cafe: "카페",
    accommodation: "숙소",
  };

  return labels[type] ?? type;
}

export default async function AdminPlacesPage({
  searchParams,
}: AdminPlacesPageProps) {
  const params = await searchParams;

  const successMessage = getMessage(
    params.success
  );

  const errorMessage = getMessage(
    params.error
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data: adminUser,
    error: adminError,
  } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminUser) {
    redirect("/admin/login");
  }

  const {
    data: places,
    error: placesError,
  } = await supabase
    .from("places")
    .select(`
      id,
      name,
      slug,
      place_type,
      region,
      city,
      address,
      phone,
      image_url,
      is_published,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  const {
    data: placePhotos,
    error: placePhotosError,
  } = await supabase
    .from("place_photos")
    .select(`
      id,
      place_id,
      image_url,
      sort_order,
      photographer_name,
      source_url,
      is_cover,
      created_at
    `)
    .order("sort_order", {
      ascending: true,
    });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f8f7",
      }}
    >
      {/* 상단 */}
      <section
        style={{
          padding: "54px 0",
          background:
            "linear-gradient(135deg, #173f36, #246a59)",
          color: "#ffffff",
        }}
      >
        <div className="container">
          <p
            style={{
              margin: "0 0 10px",
              opacity: 0.75,
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            EOMMA APPA RANG ADMIN
          </p>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "34px",
            }}
          >
            엄마랑 아빠랑 장소 관리
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.86,
              lineHeight: 1.7,
            }}
          >
            부모님과 함께하기 좋은 장소,
            맛집, 카페와 숙소를 관리합니다.
          </p>
        </div>
      </section>

      <section
        style={{
          padding: "38px 0 70px",
        }}
      >
        <div className="container">

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
{/* 장소 엑셀 일괄 등록 */}
<section
  style={{
    marginBottom: "26px",
    padding: "26px",
    borderRadius: "20px",
    background: "#ffffff",
    border: "1px solid #dde8e4",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "20px",
      flexWrap: "wrap",
      marginBottom: "20px",
    }}
  >
    <div>
      <h2
        style={{
          margin: "0 0 8px",
          color: "#173f36",
          fontSize: "21px",
        }}
      >
        장소 엑셀 일괄 등록
      </h2>

      <p
        style={{
          margin: 0,
          color: "#6c7b76",
          fontSize: "14px",
          lineHeight: 1.7,
        }}
      >
        가볼만한 곳, 맛집, 카페, 숙소 정보를
        엑셀 파일로 한 번에 등록할 수 있습니다.
        <br />
        일괄 등록된 장소는 확인을 위해
        비공개 상태로 저장됩니다.
      </p>
    </div>

    <FileSpreadsheet
      size={30}
      color="#07866c"
      aria-hidden="true"
    />
  </div>
<a
  href="/templates/places-import-template.xlsx"
  download
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    marginBottom: "16px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "1px solid #07866c",
    color: "#07866c",
    background: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    textDecoration: "none",
  }}
>
  엑셀 양식 다운로드
</a>
  <form
    action="/api/admin/places/import"
    method="post"
    encType="multipart/form-data"
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <input
        type="file"
        name="excel"
        accept=".xlsx,.xls"
        required
        style={{
          flex: "1 1 300px",
          minHeight: "48px",
          padding: "11px 13px",
          border: "1px solid #ccd9d4",
          borderRadius: "11px",
          background: "#ffffff",
        }}
      />

      <button
        type="submit"
        style={{
          minHeight: "48px",
          padding: "0 20px",
          border: 0,
          borderRadius: "11px",
          background: "#07866c",
          color: "#ffffff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        엑셀 일괄 등록
      </button>
    </div>
  </form>
</section>
          {/* 장소 유형 */}
          <section
            style={{
              marginBottom: "26px",
              padding: "26px",
              borderRadius: "20px",
              background: "#ffffff",
              border: "1px solid #dde8e4",
            }}
          >
            <h2
              style={{
                margin: "0 0 18px",
                color: "#173f36",
                fontSize: "21px",
              }}
            >
              장소 유형
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {[
                [
                  "가볼만한 곳",
                  <MapPin key="1" size={16} />,
                ],
                [
                  "맛집",
                  <Utensils key="2" size={16} />,
                ],
                [
                  "카페",
                  <Coffee key="3" size={16} />,
                ],
                [
                  "숙소",
                  <Hotel key="4" size={16} />,
                ],
              ].map(([label, icon]) => (
                <span
                  key={label as string}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 14px",
                    borderRadius: "999px",
                    background: "#f0f7f4",
                    color: "#245c4f",
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  {icon}
                  {label}
                </span>
              ))}
            </div>
          </section>

          {/* 신규 장소 등록 */}
          <form
            action="/api/admin/places"
            method="post"
            encType="multipart/form-data"
            style={{
              marginBottom: "32px",
              padding: "30px",
              borderRadius: "22px",
              background: "#ffffff",
              border: "1px solid #dbe7e2",
              boxShadow:
                "0 14px 38px rgba(23,63,54,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px",
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
                  새 장소 등록
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#6c7b76",
                  }}
                >
                  부모님과 함께하기 좋은 곳을
                  등록합니다.
                </p>
              </div>

              <button
                type="submit"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  minHeight: "48px",
                  padding: "0 20px",
                  border: 0,
                  borderRadius: "13px",
                  background: "#07866c",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <Save size={18} />
                장소 등록
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "20px",
              }}
            >
              <label>
                <strong>장소 유형 *</strong>

                <select
                  name="place_type"
                  required
                  defaultValue=""
                  style={inputStyle}
                >
                  <option value="" disabled>
                    장소 유형 선택
                  </option>

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
                  placeholder="예: 산정호수"
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>영문 식별자 *</strong>

                <input
                  name="slug"
                  type="text"
                  required
                  placeholder="예: sanjeong-lake"
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>지역 *</strong>

                <select
                  name="region"
                  required
                  defaultValue=""
                  style={inputStyle}
                >
                  <option value="" disabled>
                    지역 선택
                  </option>

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
                  placeholder="예: 포천"
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>전화번호</strong>

                <input
                  name="phone"
                  type="tel"
                  placeholder="예: 031-000-0000"
                  style={inputStyle}
                />
              </label>
            </div>

            <div
              style={{
                marginTop: "20px",
              }}
            >
              <label>
                <strong>주소 *</strong>

                <input
                  name="address"
                  type="text"
                  required
                  placeholder="도로명 주소"
                  style={inputStyle}
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              <label>
                <strong>위도</strong>

                <input
                  name="latitude"
                  type="number"
                  step="any"
                  placeholder="37.000000"
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>경도</strong>

                <input
                  name="longitude"
                  type="number"
                  step="any"
                  placeholder="127.000000"
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>홈페이지</strong>

                <input
                  name="website_url"
                  type="url"
                  placeholder="공식 홈페이지 주소"
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>운영시간</strong>

                <input
                  name="business_hours"
                  type="text"
                  placeholder="예: 09:00 ~ 18:00"
                  style={inputStyle}
                />
              </label>
  <label>
    <strong>휴무일</strong>

    <input
      name="closed_days"
      type="text"
      placeholder="예: 매주 월요일, 1월 1일, 설날, 추석"
      style={inputStyle}
    />
  </label>
              <label>
                <strong>입장료 / 이용요금</strong>

                <input
                  name="admission_fee"
                  type="text"
                  placeholder="예: 무료"
                  style={inputStyle}
                />
              </label>

              <label>
                <strong>실내 / 실외</strong>

                <select
                  name="environment_type"
                  defaultValue=""
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
                  defaultValue=""
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
                  placeholder="예: 한식, 백숙, 횟집"
                  style={inputStyle}
                />
              </label>
            </div>

            <div
              style={{
                marginTop: "20px",
              }}
            >
              <label>
                <strong>한줄 소개 *</strong>

                <textarea
                  name="summary"
                  required
                  rows={3}
                  placeholder="장소를 간단하게 소개해 주세요."
                  style={textareaStyle}
                />
              </label>
            </div>

            <div
              style={{
                marginTop: "20px",
              }}
            >
              <label>
                <strong>상세 설명</strong>

                <textarea
                  name="description"
                  rows={6}
                  placeholder="장소에 대한 자세한 내용을 입력해 주세요."
                  style={textareaStyle}
                />
              </label>
            </div>

            <div
              style={{
                marginTop: "20px",
              }}
            >
              <label>
                <strong>
                  부모님과 함께 가기 좋은 이유
                </strong>

                <textarea
                  name="parent_recommendation"
                  rows={4}
                  placeholder="부모님과 함께 방문하기 좋은 이유를 작성해 주세요."
                  style={textareaStyle}
                />
              </label>
            </div>

            <div
              style={{
                marginTop: "20px",
              }}
            >
              <label>
                <strong>검색 태그</strong>

                <input
                  name="tags"
                  type="text"
                  placeholder="예: 부모님여행, 포천, 자연, 드라이브"
                  style={inputStyle}
                />
              </label>
            </div>

{/* =========================
    상세페이지 추가 콘텐츠
========================= */}
<section
  style={{
    marginTop: "28px",
    padding: "24px",
    borderRadius: "18px",
    border: "1px solid #dfe9e4",
    background: "#fbfdfc",
  }}
>
  <div
    style={{
      marginBottom: "22px",
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
        margin: 0,
        color: "#78857f",
        fontSize: "14px",
        lineHeight: 1.7,
      }}
    >
      확인된 정보만 입력해 주세요.
      입력하지 않은 항목은 상세페이지에 표시하지 않습니다.
    </p>
  </div>

  {/* 방문 꿀팁 */}
  <div>
    <label>
      <strong>방문 꿀팁</strong>

      <textarea
        name="visit_tips"
        rows={5}
        placeholder={`한 줄에 꿀팁 하나씩 입력해 주세요.

예)
오전 10시 이전에 방문하면 비교적 여유로워요.
주차장에서 주요 관람 구간까지 도보 약 5분이에요.
햇빛이 강한 날에는 모자를 챙기면 좋아요.`}
        style={textareaStyle}
      />
    </label>

    <p style={helpTextStyle}>
      한 줄을 하나의 꿀팁으로 저장합니다.
      확인되지 않은 내용은 입력하지 마세요.
    </p>
  </div>

  {/* FAQ */}
  <div
    style={{
      marginTop: "24px",
    }}
  >
    <label>
      <strong>FAQ</strong>

      <textarea
        name="faq"
        rows={7}
        placeholder={`한 줄에 질문과 답변 하나씩 입력해 주세요.
질문 | 답변 형식입니다.

예)
부모님과 걷기에 괜찮나요? | 주요 관람 구간은 비교적 평탄합니다.
주차장이 있나요? | 전용 주차장을 이용할 수 있습니다.
휠체어 이용이 가능한가요? | 일부 구간에서 이용 가능합니다.`}
        style={textareaStyle}
      />
    </label>

    <p style={helpTextStyle}>
      반드시 <strong>질문 | 답변</strong> 형식으로
      한 줄에 하나씩 입력해 주세요.
    </p>
  </div>

  {/* 네이버 블로그 후기 */}
  <div
    style={{
      marginTop: "24px",
    }}
  >
    <label>
      <strong>
        실제 방문자 네이버 블로그 후기
      </strong>

      <textarea
        name="blog_reviews"
        rows={9}
        placeholder={`한 줄에 후기 하나씩 입력해 주세요.

제목 | URL | 블로그명 또는 작성자 | 간단한 안내

예)
부모님과 다녀온 국립수목원 후기 | https://blog.naver.com/xxxxx/12345 | 행복한여행 | 주차와 산책 동선을 참고하기 좋은 후기
주말 방문 후기 | https://blog.naver.com/yyyyy/67890 | 여행기록 | 실제 주말 혼잡도를 확인하기 좋은 후기`}
        style={textareaStyle}
      />
    </label>

    <p style={helpTextStyle}>
      후기 개수에는 제한을 두지 않습니다.
      한 줄에 하나씩 계속 추가할 수 있습니다.
      블로그 본문을 복사하지 않고 원문 링크를 연결하는 용도입니다.
    </p>
  </div>
</section>

            <div
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
                  />{" "}
                  주차 가능
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="restroom"
                  />{" "}
                  화장실 있음
                </label>

<label>
  <input
    type="checkbox"
    name="walking_easy"
  />{" "}
  걷기 편함
</label>

<label>
  <input
    type="checkbox"
    name="nearby_cafe"
  />{" "}
  주변 카페 있음
</label>
                <label>
                  <input
                    type="checkbox"
                    name="is_editor_pick"
                  />{" "}
                  엄마랑 아빠랑 추천
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="is_published"
                  />{" "}
                  바로 공개
                </label>
              </div>
            </div>

            <div
              style={{
                marginTop: "22px",
              }}
            >
              <label>
                <strong>대표사진</strong>

                <div
                  style={{
                    marginTop: "9px",
                    padding: "20px",
                    border:
                      "1px dashed #b8d5cb",
                    borderRadius: "14px",
                  }}
                >
                  <ImagePlus
                    size={22}
                    style={{
                      marginBottom: "8px",
                    }}
                  />

                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp"
                  />
                </div>
              </label>
            </div>
          </form>

          {/* 등록된 장소 */}
          <section
            style={{
              padding: "30px",
              borderRadius: "22px",
              background: "#ffffff",
              border: "1px solid #dbe7e2",
            }}
          >
            <div
              style={{
                marginBottom: "22px",
              }}
            >
              <h2
                style={{
                  margin: "0 0 7px",
                  color: "#173f36",
                }}
              >
                등록된 장소
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#6c7b76",
                }}
              >
                총 {places?.length ?? 0}개
              </p>
            </div>

            {placesError ? (
              <p>
                장소 목록을 불러오지
                못했습니다.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {(places ?? []).map(
  (place) => {
    const photosForPlace =
      (placePhotos ?? []).filter(
        (photo) =>
          photo.place_id === place.id
      );

    return (
      <div
        key={place.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "15px",
                        padding: "16px",
                        border:
                          "1px solid #e3ebe8",
                        borderRadius: "13px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems:
                              "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong>
                            {place.name}
                          </strong>

                          <span
                            style={{
                              padding:
                                "4px 8px",
                              borderRadius:
                                "999px",
                              background:
                                "#edf6f2",
                              color:
                                "#286152",
                              fontSize:
                                "12px",
                              fontWeight:
                                800,
                            }}
                          >
                            {placeTypeLabel(
                              place.place_type
                            )}
                          </span>
                        </div>

                        <p
                          style={{
                            margin:
                              "5px 0 0",
                            color:
                              "#75827e",
                            fontSize:
                              "14px",
                          }}
                        >
                          {place.region}{" "}
                          {place.city}
                        </p>
                      </div>

                      <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  }}
>
  <span
    style={{
      fontSize: "13px",
      fontWeight: 800,
      color:
        place.is_published
          ? "#07866c"
          : "#9a6b32",
    }}
  >
    {place.is_published
      ? "공개"
      : "비공개"}
  </span>

  <form
    action="/api/admin/places/image"
    method="post"
    encType="multipart/form-data"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
    }}
  >
    <input
      type="hidden"
      name="slug"
      value={place.slug}
    />

    <input
      type="file"
      name="image"
      accept="image/jpeg,image/png,image/webp"
      required
      style={{
        maxWidth: "220px",
        fontSize: "12px",
      }}
    />

    <button
      type="submit"
      style={{
        minHeight: "36px",
        padding: "0 12px",
        border: 0,
        borderRadius: "9px",
        background: "#245c4f",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {place.image_url
        ? "대표사진 교체"
        : "대표사진 등록"}
    </button>
  </form>
  <form
  action="/api/admin/places/gallery"
  method="post"
  encType="multipart/form-data"
  style={{
    display: "grid",
    gap: "8px",
    minWidth: "280px",
    paddingTop: "8px",
    marginTop: "8px",
    borderTop: "1px solid #e8efec",
  }}
>
  <input
    type="hidden"
    name="slug"
    value={place.slug}
  />

  <input
    type="file"
    name="images"
    accept="image/jpeg,image/png,image/webp"
    multiple
    required
    style={{
      fontSize: "12px",
    }}
  />

  <input
    type="text"
    name="photographer_name"
    placeholder="사진 제공자명 예: @j._.aaah"
    style={{
      minHeight: "36px",
      padding: "0 10px",
      border: "1px solid #d6e1dd",
      borderRadius: "8px",
      fontSize: "12px",
    }}
  />

  <input
    type="url"
    name="source_url"
    placeholder="원문 블로그 주소"
    style={{
      minHeight: "36px",
      padding: "0 10px",
      border: "1px solid #d6e1dd",
      borderRadius: "8px",
      fontSize: "12px",
    }}
  />

  <button
    type="submit"
    style={{
      minHeight: "36px",
      padding: "0 12px",
      border: 0,
      borderRadius: "9px",
      background: "#b88451",
      color: "#ffffff",
      fontSize: "12px",
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    갤러리 사진 등록
  </button>
</form>

{placePhotosError ? (
  <p
    style={{
      margin: "10px 0 0",
      color: "#a43a3a",
      fontSize: "12px",
      fontWeight: 700,
    }}
  >
    등록된 갤러리 사진을 불러오지 못했습니다.
  </p>
) : photosForPlace.length > 0 ? (
  <div
    style={{
      display: "grid",
      gap: "8px",
      width: "100%",
      marginTop: "10px",
      paddingTop: "10px",
      borderTop: "1px solid #e8efec",
    }}
  >
    <strong
      style={{
        color: "#566963",
        fontSize: "12px",
      }}
    >
      등록된 갤러리 사진 {photosForPlace.length}장
    </strong>

    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {photosForPlace.map((photo) => (
        <div
          key={photo.id}
          title={
            photo.photographer_name
              ? `사진 제공: ${photo.photographer_name}`
              : "등록된 갤러리 사진"
          }
          style={{
            position: "relative",
            width: "82px",
            height: "62px",
            overflow: "hidden",
            borderRadius: "9px",
            border: photo.is_cover
              ? "2px solid #b88451"
              : "1px solid #dce5e1",
            background: "#eef2ef",
          }}
        >
          <img
            src={photo.image_url}
            alt={`${place.name} 갤러리 사진`}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {photo.is_cover && (
            <span
              style={{
                position: "absolute",
                left: "4px",
                bottom: "4px",
                padding: "2px 5px",
                borderRadius: "999px",
                background: "rgba(184,132,81,0.92)",
                color: "#ffffff",
                fontSize: "9px",
                fontWeight: 800,
              }}
            >
              대표
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
) : null}

</div>
                    </div>
                  );
                 } 
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

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
const helpTextStyle = {
  margin: "8px 0 0",
  color: "#8a9691",
  fontSize: "12px",
  lineHeight: 1.65,
};