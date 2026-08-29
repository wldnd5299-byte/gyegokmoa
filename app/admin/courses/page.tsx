import {
  Pencil,
  Route,
  Save,
} from "lucide-react";

import Link from "next/link";

import { redirect } from "next/navigation";

import AdminCoursePlaceSelector from "@/components/AdminCoursePlaceSelector";

import {
  createClient,
} from "@/lib/supabase/server";

type AdminCoursesPageProps = {
  searchParams: Promise<{
    success?: string | string[];
    error?: string | string[];
  }>;
};

function getMessage(
  value:
    | string
    | string[]
    | undefined
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export default async function AdminCoursesPage({
  searchParams,
}: AdminCoursesPageProps) {
  const params =
    await searchParams;

  const successMessage =
    getMessage(
      params.success
    );

  const errorMessage =
    getMessage(
      params.error
    );

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/admin/login"
    );
  }

  const {
    data: adminUser,
    error: adminError,
  } =
    await supabase
      .from(
        "admin_users"
      )
      .select(
        "user_id"
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

  if (
    adminError ||
    !adminUser
  ) {
    redirect(
      "/admin/login"
    );
  }

  const {
    data: places,
    error:
      placesError,
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
        image_url,
        is_published
      `)
      .eq(
        "is_published",
        true
      )
      .order(
        "region",
        {
          ascending: true,
        }
      )
      .order(
        "city",
        {
          ascending: true,
        }
      )
      .order(
        "name",
        {
          ascending: true,
        }
      );

  const {
    data: courses,
    error:
      coursesError,
  } =
    await supabase
      .from("courses")
      .select(`
        id,
        title,
        slug,
        region,
        city,
        duration_label,
        is_published,
        recommendation_score,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  return (
    <main
      style={{
        minHeight:
          "100vh",

        background:
          "#f5f8f7",
      }}
    >
      <section
        style={{
          padding:
            "54px 0",

          background:
            "linear-gradient(135deg, #173f36, #246a59)",

          color:
            "#ffffff",
        }}
      >
        <div className="container">
          <p
            style={{
              margin:
                "0 0 10px",

              opacity:
                0.75,

              fontSize:
                "13px",

              fontWeight:
                800,

              letterSpacing:
                "0.12em",
            }}
          >
            EOMMA APPA RANG ADMIN
          </p>

          <h1
            style={{
              margin:
                "0 0 12px",

              fontSize:
                "34px",
            }}
          >
            추천코스 관리
          </h1>

          <p
            style={{
              margin: 0,

              opacity:
                0.86,

              lineHeight:
                1.7,
            }}
          >
            부모님과 함께하기 좋은
            실제 장소들을 연결해
            추천코스를 만듭니다.
          </p>
        </div>
      </section>

      <section
        style={{
          padding:
            "38px 0 70px",
        }}
      >
        <div className="container">
          {successMessage && (
            <div
              style={{
                marginBottom:
                  "20px",

                padding:
                  "16px 18px",

                borderRadius:
                  "14px",

                background:
                  "#e8f7f1",

                color:
                  "#08705f",

                fontWeight:
                  800,
              }}
            >
              {
                successMessage
              }
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                marginBottom:
                  "20px",

                padding:
                  "16px 18px",

                borderRadius:
                  "14px",

                background:
                  "#fff0f0",

                color:
                  "#a43a3a",

                fontWeight:
                  800,
              }}
            >
              {
                errorMessage
              }
            </div>
          )}

          {/* =========================
              새 추천코스 등록
          ========================== */}
          <form
            action="/api/admin/courses"
            method="post"
            style={{
              marginBottom:
                "32px",

              padding:
                "30px",

              borderRadius:
                "22px",

              background:
                "#ffffff",

              border:
                "1px solid #dbe7e2",

              boxShadow:
                "0 14px 38px rgba(23,63,54,0.06)",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                flexWrap:
                  "wrap",

                gap:
                  "15px",

                marginBottom:
                  "28px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin:
                      "0 0 7px",

                    color:
                      "#173f36",

                    fontSize:
                      "24px",
                  }}
                >
                  새 추천코스 등록
                </h2>

                <p
                  style={{
                    margin: 0,

                    color:
                      "#6c7b76",
                  }}
                >
                  실제 등록된 장소를
                  원하는 순서대로
                  연결합니다.
                </p>
              </div>

              <button
                type="submit"
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  gap:
                    "8px",

                  minHeight:
                    "48px",

                  padding:
                    "0 20px",

                  border:
                    0,

                  borderRadius:
                    "13px",

                  background:
                    "#07866c",

                  color:
                    "#ffffff",

                  fontWeight:
                    800,

                  cursor:
                    "pointer",
                }}
              >
                <Save
                  size={18}
                />

                코스 등록
              </button>
            </div>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",

                gap:
                  "20px",
              }}
            >
              <label>
                <strong>
                  코스 제목 *
                </strong>

                <input
                  type="text"
                  name="title"
                  required
                  placeholder="예: 부모님과 가평에서 보내는 편안한 하루"
                  style={
                    inputStyle
                  }
                />
              </label>

              <label>
                <strong>
                  영문 식별자 *
                </strong>

                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="예: gapyeong-parent-day"
                  style={
                    inputStyle
                  }
                />
              </label>

              <label>
                <strong>
                  지역 *
                </strong>

                <select
                  name="region"
                  required
                  defaultValue=""
                  style={
                    inputStyle
                  }
                >
                  <option
                    value=""
                    disabled
                  >
                    지역 선택
                  </option>

                  {[
                    "서울",
                    "경기",
                    "인천",
                    "강원",
                    "충북",
                    "충남",
                    "대전",
                    "세종",
                    "전북",
                    "전남",
                    "광주",
                    "경북",
                    "경남",
                    "대구",
                    "울산",
                    "부산",
                    "제주",
                  ].map(
                    (
                      region
                    ) => (
                      <option
                        key={
                          region
                        }
                        value={
                          region
                        }
                      >
                        {
                          region
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <strong>
                  시·군·구
                </strong>

                <input
                  type="text"
                  name="city"
                  placeholder="예: 가평"
                  style={
                    inputStyle
                  }
                />
              </label>

              <label>
                <strong>
                  일정 표시
                </strong>

                <input
                  type="text"
                  name="duration_label"
                  placeholder="예: 당일, 1박 2일"
                  style={
                    inputStyle
                  }
                />
              </label>

              <label>
                <strong>
                  추천 점수
                </strong>

                <input
                  type="number"
                  name="recommendation_score"
                  defaultValue="0"
                  min="0"
                  step="1"
                  style={
                    inputStyle
                  }
                />
              </label>
            </div>

            <div
              style={{
                marginTop:
                  "20px",
              }}
            >
              <label>
                <strong>
                  한줄 소개 *
                </strong>

                <textarea
                  name="summary"
                  required
                  rows={3}
                  placeholder="코스를 간단하게 소개해 주세요."
                  style={
                    textareaStyle
                  }
                />
              </label>
            </div>

            <div
              style={{
                marginTop:
                  "20px",
              }}
            >
              <label>
                <strong>
                  상세 설명
                </strong>

                <textarea
                  name="description"
                  rows={5}
                  placeholder="이 코스를 추천하는 이유와 이동 흐름을 작성해 주세요."
                  style={
                    textareaStyle
                  }
                />
              </label>
            </div>

            <section
              style={{
                marginTop:
                  "28px",

                padding:
                  "24px",

                borderRadius:
                  "18px",

                background:
                  "#f7faf8",

                border:
                  "1px solid #dfe9e4",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    "9px",

                  marginBottom:
                    "8px",

                  color:
                    "#173f36",
                }}
              >
                <Route
                  size={20}
                />

                <strong
                  style={{
                    fontSize:
                      "19px",
                  }}
                >
                  코스 장소 구성
                </strong>
              </div>

              <p
                style={{
                  margin:
                    "0 0 20px",

                  color:
                    "#78857f",

                  fontSize:
                    "13px",

                  lineHeight:
                    1.7,
                }}
              >
                장소명이나 지역을 검색해서
                원하는 순서대로 선택하세요.
                같은 장소는 중복 선택할 수
                없습니다.
              </p>

              {placesError ? (
                <p
                  style={{
                    margin: 0,
                    color:
                      "#a43a3a",
                  }}
                >
                  장소 목록을 불러오지
                  못했습니다.
                </p>
              ) : (
                <AdminCoursePlaceSelector
                  places={
                    places ?? []
                  }
                  maxStops={10}
                />
              )}
            </section>

            <div
              style={{
                marginTop:
                  "22px",

                padding:
                  "18px 20px",

                borderRadius:
                  "14px",

                background:
                  "#f5faf8",
              }}
            >
              <label>
                <input
                  type="checkbox"
                  name="is_published"
                />{" "}
                바로 공개
              </label>
            </div>
          </form>

          {/* =========================
              등록된 추천코스
          ========================== */}
          <section
            style={{
              padding:
                "30px",

              borderRadius:
                "22px",

              background:
                "#ffffff",

              border:
                "1px solid #dbe7e2",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 7px",

                color:
                  "#173f36",
              }}
            >
              등록된 추천코스
            </h2>

            <p
              style={{
                margin:
                  "0 0 22px",

                color:
                  "#6c7b76",
              }}
            >
              총{" "}
              {
                courses?.length ??
                0
              }
              개
            </p>

            {coursesError ? (
              <p>
                코스 목록을 불러오지
                못했습니다.
              </p>
            ) : (
              <div
                style={{
                  display:
                    "grid",

                  gap:
                    "12px",
                }}
              >
                {(
                  courses ??
                  []
                ).map(
                  (
                    course
                  ) => (
                    <div
                      key={
                        course.id
                      }
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        alignItems:
                          "center",

                        gap:
                          "16px",

                        padding:
                          "17px",

                        border:
                          "1px solid #e3ebe8",

                        borderRadius:
                          "13px",

                        background:
                          "#ffffff",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            color:
                              "#284d40",
                          }}
                        >
                          {
                            course.title
                          }
                        </strong>

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
                          {
                            course.region
                          }{" "}
                          {
                            course.city ||
                            ""
                          }

                          {
                            course.duration_label
                              ? ` · ${course.duration_label}`
                              : ""
                          }
                        </p>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            "12px",
                        }}
                      >
                        <span
                          style={{
                            padding:
                              "6px 9px",

                            borderRadius:
                              "999px",

                            background:
                              course.is_published
                                ? "#e8f6f1"
                                : "#faf3e7",

                            color:
                              course.is_published
                                ? "#07866c"
                                : "#9a6b32",

                            fontSize:
                              "12px",

                            fontWeight:
                              800,
                          }}
                        >
                          {
                            course.is_published
                              ? "공개"
                              : "비공개"
                          }
                        </span>

                        <Link
                          href={`/admin/courses/${course.id}`}
                          style={{
                            minHeight:
                              "38px",

                            display:
                              "inline-flex",

                            alignItems:
                              "center",

                            gap:
                              "6px",

                            padding:
                              "0 12px",

                            border:
                              "1px solid #bdd1c8",

                            borderRadius:
                              "9px",

                            background:
                              "#ffffff",

                            color:
                              "#356b59",

                            fontSize:
                              "12px",

                            fontWeight:
                              800,

                            textDecoration:
                              "none",
                          }}
                        >
                          <Pencil
                            size={14}
                          />

                          수정
                        </Link>
                      </div>
                    </div>
                  )
                )}

                {(
                  courses ??
                  []
                ).length ===
                  0 && (
                  <p
                    style={{
                      color:
                        "#8a9691",
                    }}
                  >
                    아직 등록된 추천코스가
                    없습니다.
                  </p>
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
  width:
    "100%",

  minHeight:
    "48px",

  marginTop:
    "9px",

  padding:
    "0 13px",

  border:
    "1px solid #ccd9d4",

  borderRadius:
    "11px",

  background:
    "#ffffff",

  fontSize:
    "15px",
};

const textareaStyle = {
  width:
    "100%",

  marginTop:
    "9px",

  padding:
    "13px",

  border:
    "1px solid #ccd9d4",

  borderRadius:
    "11px",

  background:
    "#ffffff",

  fontSize:
    "15px",

  lineHeight:
    1.7,

  resize:
    "vertical" as const,
};