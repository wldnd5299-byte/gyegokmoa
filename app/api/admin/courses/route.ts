import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function text(
  value: FormDataEntryValue | null
) {
  if (
    value === null ||
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function nullableText(
  value: FormDataEntryValue | null
) {
  const valueText = text(value);

  return valueText || null;
}

function numberValue(
  value: FormDataEntryValue | null,
  fallback = 0
) {
  const valueText = text(value);

  if (!valueText) {
    return fallback;
  }

  const parsed =
    Number(valueText);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL(
    "/admin/courses",
    request.url
  );

  url.searchParams.set(
    type,
    message
  );

  return url;
}

function redirectWithError(
  request: Request,
  message: string
) {
  return NextResponse.redirect(
    adminUrl(
      request,
      "error",
      message
    ),
    303
  );
}

export async function POST(
  request: Request
) {
  const supabase =
    await createClient();

  /*
   * 1. 로그인 확인
   */
  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return NextResponse.redirect(
      new URL(
        "/admin/login?error=로그인이 필요합니다.",
        request.url
      ),
      303
    );
  }

  /*
   * 2. 관리자 권한 확인
   */
  const {
    data: adminUser,
    error: adminError,
  } =
    await supabase
      .from("admin_users")
      .select("user_id")
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

  if (
    adminError ||
    !adminUser
  ) {
    return redirectWithError(
      request,
      "관리자 권한이 없습니다."
    );
  }

  /*
   * 3. 폼 데이터
   */
  const formData =
    await request.formData();

  const title =
    text(
      formData.get(
        "title"
      )
    );

  const slug =
    text(
      formData.get(
        "slug"
      )
    ).toLowerCase();

  const region =
    text(
      formData.get(
        "region"
      )
    );

  const city =
    nullableText(
      formData.get(
        "city"
      )
    );

  const durationLabel =
    nullableText(
      formData.get(
        "duration_label"
      )
    );

  const summary =
    text(
      formData.get(
        "summary"
      )
    );

  const description =
    nullableText(
      formData.get(
        "description"
      )
    );

  const recommendationScore =
    numberValue(
      formData.get(
        "recommendation_score"
      ),
      0
    );

  const isPublished =
    formData.has(
      "is_published"
    );

  /*
   * 4. 기본 검증
   */
  if (!title) {
    return redirectWithError(
      request,
      "코스 제목을 입력해 주세요."
    );
  }

  if (!slug) {
    return redirectWithError(
      request,
      "영문 식별자를 입력해 주세요."
    );
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug
    )
  ) {
    return redirectWithError(
      request,
      "영문 식별자는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
    );
  }

  if (!region) {
    return redirectWithError(
      request,
      "지역을 선택해 주세요."
    );
  }

  if (!summary) {
    return redirectWithError(
      request,
      "한줄 소개를 입력해 주세요."
    );
  }

  if (
    recommendationScore < 0
  ) {
    return redirectWithError(
      request,
      "추천 점수는 0 이상이어야 합니다."
    );
  }

  /*
   * 5. 코스 장소 읽기
   *
   * 현재 관리자 화면은
   * place_1 ~ place_6
   * 구조입니다.
   */
  const selectedPlaces: {
    placeId: number;
    stopOrder: number;
    stopNote: string | null;
  }[] = [];

  const usedPlaceIds =
    new Set<number>();

  for (
    let order = 1;
    order <= 6;
    order += 1
  ) {
    const placeText =
      text(
        formData.get(
          `place_${order}`
        )
      );

    if (!placeText) {
      continue;
    }

    const placeId =
      Number(placeText);

    if (
      !Number.isInteger(
        placeId
      ) ||
      placeId <= 0
    ) {
      return redirectWithError(
        request,
        `${order}번 장소 값이 올바르지 않습니다.`
      );
    }

    if (
      usedPlaceIds.has(
        placeId
      )
    ) {
      return redirectWithError(
        request,
        "같은 장소를 한 코스에 두 번 넣을 수 없습니다."
      );
    }

    usedPlaceIds.add(
      placeId
    );

    selectedPlaces.push({
      placeId,
      stopOrder:
        selectedPlaces.length +
        1,
      stopNote:
        nullableText(
          formData.get(
            `note_${order}`
          )
        ),
    });
  }

  if (
    selectedPlaces.length ===
    0
  ) {
    return redirectWithError(
      request,
      "코스에 장소를 1개 이상 선택해 주세요."
    );
  }

  /*
   * 6. 선택된 장소가
   * 실제 공개 장소인지 확인
   */
  const selectedIds =
    selectedPlaces.map(
      (item) =>
        item.placeId
    );

  const {
    data:
      existingPlaces,
    error:
      placesError,
  } =
    await supabase
      .from("places")
      .select(
        "id"
      )
      .in(
        "id",
        selectedIds
      )
      .eq(
        "is_published",
        true
      );

  if (placesError) {
    return redirectWithError(
      request,
      `장소 확인 실패: ${placesError.message}`
    );
  }

  const existingIds =
    new Set(
      (
        existingPlaces ??
        []
      ).map(
        (place) =>
          Number(
            place.id
          )
      )
    );

  const hasMissingPlace =
    selectedIds.some(
      (id) =>
        !existingIds.has(
          id
        )
    );

  if (hasMissingPlace) {
    return redirectWithError(
      request,
      "선택한 장소 중 존재하지 않거나 공개되지 않은 장소가 있습니다."
    );
  }

  /*
   * 7. slug 중복 확인
   */
  const {
    data:
      existingCourse,
    error:
      duplicateError,
  } =
    await supabase
      .from("courses")
      .select("id")
      .eq(
        "slug",
        slug
      )
      .maybeSingle();

  if (duplicateError) {
    return redirectWithError(
      request,
      `영문 식별자 확인 실패: ${duplicateError.message}`
    );
  }

  if (existingCourse) {
    return redirectWithError(
      request,
      "이미 사용 중인 코스 영문 식별자입니다."
    );
  }

  /*
   * 8. courses 저장
   */
  const {
    data: course,
    error:
      courseInsertError,
  } =
    await supabase
.from("courses")
.insert({
  title,
  slug,

  region,
  city,

  course_type:
    "day",

  duration_label:
    durationLabel,

  summary,
  description,

  image_url:
    null,

  is_published:
    isPublished,

  recommendation_score:
    recommendationScore,
})
      .select(
        "id"
      )
      .single();

  if (
    courseInsertError ||
    !course
  ) {
    return redirectWithError(
      request,
      `추천코스 등록 실패: ${
        courseInsertError
          ?.message ??
        "코스 ID를 확인할 수 없습니다."
      }`
    );
  }

  /*
   * 9. course_places 저장
   */
  const coursePlaceRows =
    selectedPlaces.map(
      (item) => ({
        course_id:
          course.id,

        place_id:
          item.placeId,

        stop_order:
          item.stopOrder,

        stop_note:
          item.stopNote,
      })
    );

  const {
    error:
      coursePlacesError,
  } =
    await supabase
      .from(
        "course_places"
      )
      .insert(
        coursePlaceRows
      );

  if (
    coursePlacesError
  ) {
    /*
     * 장소 연결 실패 시
     * 방금 생성한 코스도 삭제
     */
    await supabase
      .from("courses")
      .delete()
      .eq(
        "id",
        course.id
      );

    return redirectWithError(
      request,
      `코스 장소 저장 실패: ${coursePlacesError.message}`
    );
  }

  /*
   * 10. 완료
   */
  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${title} 추천코스 등록 완료`
    ),
    303
  );
}