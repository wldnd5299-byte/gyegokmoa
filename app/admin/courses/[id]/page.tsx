import {
  ArrowLeft,
  Save,
  Trash2,
} from "lucide-react";

import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import AdminCoursePlaceSelector from "@/components/AdminCoursePlaceSelector";

import {
  createClient,
} from "@/lib/supabase/server";

type AdminCourseEditPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
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

export default async function AdminCourseEditPage({
  params,
  searchParams,
}: AdminCourseEditPageProps) {
  const { id } =
    await params;

  const query =
    await searchParams;

  const errorMessage =
    getMessage(
      query.error
    );

  const courseId =
    Number(id);

  if (
    !Number.isInteger(
      courseId
    )
  ) {
    notFound();
  }

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

  if (!adminUser) {
    redirect(
      "/admin/login"
    );
  }

  const {
    data: course,
    error: courseError,
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
        summary,
        description,
        image_url,
        is_published,
        recommendation_score
      `)
      .eq(
        "id",
        courseId
      )
      .maybeSingle();

  if (
    courseError ||
    !course
  ) {
    notFound();
  }

  const {
    data: places,
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
    data: coursePlaces,
  } =
    await supabase
      .from(
        "course_places"
      )
      .select(`
        id,
        place_id,
        stop_order,
        stop_note
      `)
      .eq(
        "course_id",
        courseId
      )
      .order(
        "stop_order",
        {
          ascending: true,
        }
      );

  const initialStops =
    (
      coursePlaces ??
      []
    ).map(
      (item) => ({
        placeId:
          item.place_id,

        note:
          item.stop_note ??
          "",
      })
    );

  /*
   * 수정
   */
  async function updateCourse(
    formData: FormData
  ) {
    "use server";

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

    if (!adminUser) {
      redirect(
        "/admin/login"
      );
    }

    const title =
      String(
        formData.get(
          "title"
        ) ?? ""
      ).trim();

    const slug =
      String(
        formData.get(
          "slug"
        ) ?? ""
      ).trim();

    const region =
      String(
        formData.get(
          "region"
        ) ?? ""
      ).trim();

    const city =
      String(
        formData.get(
          "city"
        ) ?? ""
      ).trim();

    const durationLabel =
      String(
        formData.get(
          "duration_label"
        ) ?? ""
      ).trim();

    const summary =
      String(
        formData.get(
          "summary"
        ) ?? ""
      ).trim();

    const description =
      String(
        formData.get(
          "description"
        ) ?? ""
      ).trim();

    const recommendationScore =
      Number(
        formData.get(
          "recommendation_score"
        ) ?? 0
      );

    const isPublished =
      formData.get(
        "is_published"
      ) === "on";

    if (
      !title ||
      !slug ||
      !region ||
      !summary
    ) {
      redirect(
        `/admin/courses/${courseId}?error=${encodeURIComponent(
          "필수 항목을 입력해 주세요."
        )}`
      );
    }

    const {
      error:
        updateError,
    } =
      await supabase
        .from("courses")
        .update({
          title,
          slug,
          region,

          city:
            city || null,

          duration_label:
            durationLabel ||
            null,

          summary,

          description:
            description ||
            null,

          recommendation_score:
            Number.isFinite(
              recommendationScore
            )
              ? recommendationScore
              : 0,

          is_published:
            isPublished,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          courseId
        );

    if (updateError) {
      redirect(
        `/admin/courses/${courseId}?error=${encodeURIComponent(
          updateError.message
        )}`
      );
    }

    /*
     * 기존 코스 장소 삭제
     */
    const {
      error:
        deletePlacesError,
    } =
      await supabase
        .from(
          "course_places"
        )
        .delete()
        .eq(
          "course_id",
          courseId
        );

    if (
      deletePlacesError
    ) {
      redirect(
        `/admin/courses/${courseId}?error=${encodeURIComponent(
          deletePlacesError.message
        )}`
      );
    }

    /*
     * 장소는 최대 10개
     */
    const newStops: {
      course_id: number;
      place_id: number;
      stop_order: number;
      stop_note: string | null;
    }[] = [];

    let nextOrder = 1;

    for (
      let index = 1;
      index <= 10;
      index += 1
    ) {
      const placeValue =
        String(
          formData.get(
            `place_${index}`
          ) ?? ""
        ).trim();

      if (!placeValue) {
        continue;
      }

      const placeId =
        Number(
          placeValue
        );

      if (
        !Number.isInteger(
          placeId
        )
      ) {
        continue;
      }

      const note =
        String(
          formData.get(
            `note_${index}`
          ) ?? ""
        ).trim();

      newStops.push({
        course_id:
          courseId,

        place_id:
          placeId,

        stop_order:
          nextOrder,

        stop_note:
          note || null,
      });

      nextOrder += 1;
    }

    if (
      newStops.length >
      0
    ) {
      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "course_places"
          )
          .insert(
            newStops
          );

      if (insertError) {
        redirect(
          `/admin/courses/${courseId}?error=${encodeURIComponent(
            insertError.message
          )}`
        );
      }
    }

    redirect(
      "/admin/courses?success=추천코스가 수정되었습니다."
    );
  }

  /*
   * 삭제
   */
  async function deleteCourse() {
    "use server";

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

    if (!adminUser) {
      redirect(
        "/admin/login"
      );
    }

    /*
     * 연결 장소 먼저 삭제
     */
    await supabase
      .from(
        "course_places"
      )
      .delete()
      .eq(
        "course_id",
        courseId
      );

    const {
      error,
    } =
      await supabase
        .from("courses")
        .delete()
        .eq(
          "id",
          courseId
        );

    if (error) {
      redirect(
        `/admin/courses/${courseId}?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    redirect(
      "/admin/courses?success=추천코스가 삭제되었습니다."
    );
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",
        background:
          "#f5f8f7",
        paddingBottom:
          "80px",
      }}
    >
      <section
        style={{
          padding:
            "45px 0",
          background:
            "linear-gradient(135deg, #173f36, #246a59)",
          color: "#fff",
        }}
      >
        <div className="container">
          <Link
            href="/admin/courses"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: "6px",
              marginBottom:
                "18px",
              color: "#fff",
              textDecoration:
                "none",
              opacity: 0.8,
            }}
          >
            <ArrowLeft
              size={16}
            />
            추천코스 관리
          </Link>

          <h1
            style={{
              margin: 0,
              fontSize:
                "32px",
            }}
          >
            추천코스 수정
          </h1>
        </div>
      </section>

      <section
        style={{
          padding:
            "36px 0",
        }}
      >
        <div className="container">
          {errorMessage && (
            <div
              style={{
                marginBottom:
                  "18px",
                padding:
                  "15px",
                borderRadius:
                  "12px",
                background:
                  "#fff0f0",
                color:
                  "#a43a3a",
              }}
            >
              {errorMessage}
            </div>
          )}

          <form
            action={
              updateCourse
            }
            style={{
              padding:
                "30px",
              borderRadius:
                "22px",
              background:
                "#fff",
              border:
                "1px solid #dbe7e2",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "15px",
                flexWrap:
                  "wrap",
                marginBottom:
                  "28px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin:
                      "0 0 5px",
                    color:
                      "#173f36",
                  }}
                >
                  {
                    course.title
                  }
                </h2>

                <span
                  style={{
                    color:
                      "#78857f",
                    fontSize:
                      "13px",
                  }}
                >
                  코스 정보를 수정합니다.
                </span>
              </div>

              <button
                type="submit"
                style={
                  saveButtonStyle
                }
              >
                <Save
                  size={17}
                />
                수정 저장
              </button>
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(250px,1fr))",
                gap: "20px",
              }}
            >
              <label>
                <strong>
                  코스 제목 *
                </strong>

                <input
                  name="title"
                  required
                  defaultValue={
                    course.title
                  }
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
                  name="slug"
                  required
                  defaultValue={
                    course.slug
                  }
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
                  defaultValue={
                    course.region
                  }
                  style={
                    inputStyle
                  }
                >
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
                    (region) => (
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
                  name="city"
                  defaultValue={
                    course.city ??
                    ""
                  }
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
                  name="duration_label"
                  defaultValue={
                    course.duration_label ??
                    ""
                  }
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
                  min="0"
                  defaultValue={
                    course.recommendation_score
                  }
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
                  defaultValue={
                    course.summary
                  }
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
                  defaultValue={
                    course.description ??
                    ""
                  }
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
              <h3
                style={{
                  margin:
                    "0 0 18px",
                  color:
                    "#173f36",
                }}
              >
                코스 장소 구성
              </h3>

              <AdminCoursePlaceSelector
                places={
                  places ?? []
                }
                maxStops={
                  10
                }
                initialStops={
                  initialStops
                }
              />
            </section>

            <div
              style={{
                marginTop:
                  "22px",
                padding:
                  "18px",
                background:
                  "#f5faf8",
                borderRadius:
                  "14px",
              }}
            >
              <label>
                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked={
                    course.is_published
                  }
                />{" "}
                공개
              </label>
            </div>
          </form>

          <form
            action={
              deleteCourse
            }
            style={{
              marginTop:
                "22px",
              padding:
                "22px",
              border:
                "1px solid #eedbd6",
              borderRadius:
                "16px",
              background:
                "#fffafa",
            }}
          >
            <strong
              style={{
                display:
                  "block",
                marginBottom:
                  "7px",
                color:
                  "#8f4d42",
              }}
            >
              추천코스 삭제
            </strong>

            <p
              style={{
                margin:
                  "0 0 15px",
                color:
                  "#98766f",
                fontSize:
                  "13px",
              }}
            >
              삭제하면 코스에 연결된 장소 순서 정보도 함께 삭제됩니다.
            </p>

            <button
              type="submit"
              style={
                deleteCourseButtonStyle
              }
            >
              <Trash2
                size={17}
              />
              이 추천코스 삭제
            </button>
          </form>
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
  border:
    "1px solid #ccd9d4",
  borderRadius: "11px",
  background: "#fff",
  fontSize: "15px",
};

const textareaStyle = {
  width: "100%",
  marginTop: "9px",
  padding: "13px",
  border:
    "1px solid #ccd9d4",
  borderRadius: "11px",
  background: "#fff",
  fontSize: "15px",
  lineHeight: 1.7,
  resize:
    "vertical" as const,
};

const saveButtonStyle = {
  minHeight: "46px",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "0 17px",
  border: 0,
  borderRadius: "11px",
  background: "#07866c",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const deleteCourseButtonStyle = {
  minHeight: "44px",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "0 15px",
  border:
    "1px solid #dca89e",
  borderRadius: "10px",
  background: "#fff",
  color: "#a04f43",
  fontWeight: 800,
  cursor: "pointer",
};