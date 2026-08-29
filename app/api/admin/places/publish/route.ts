import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL(
    "/admin/places",
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
   * 3. 장소 ID 확인
   */
  const formData =
    await request.formData();

  const idValue =
    formData.get("id");

  const id =
    typeof idValue === "string"
      ? Number(idValue)
      : NaN;

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return redirectWithError(
      request,
      "올바른 장소 정보가 아닙니다."
    );
  }

  /*
   * 4. 현재 장소 상태 확인
   */
  const {
    data: place,
    error: placeError,
  } =
    await supabase
      .from("places")
      .select(
        "id, name, is_published"
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (
    placeError ||
    !place
  ) {
    return redirectWithError(
      request,
      "등록된 장소를 찾을 수 없습니다."
    );
  }

  /*
   * 5. 공개 상태 반대로 변경
   */
  const nextPublished =
    !place.is_published;

  const {
    error: updateError,
  } =
    await supabase
      .from("places")
      .update({
        is_published:
          nextPublished,
      })
      .eq(
        "id",
        place.id
      );

  if (updateError) {
    return redirectWithError(
      request,
      `공개 상태 변경 실패: ${updateError.message}`
    );
  }

  /*
   * 6. 관리자 페이지로 이동
   */
  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${place.name}을(를) ${
        nextPublished
          ? "공개"
          : "비공개"
      }로 변경했습니다.`
    ),
    303
  );
}