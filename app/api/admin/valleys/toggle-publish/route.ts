import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { checkValleyPublishReady } from "@/lib/valleyPublishCheck";

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL("/admin", request.url);

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

  // 1. 로그인 사용자 확인
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

  // 2. 관리자 권한 확인
  const {
    data: adminUser,
    error: adminError,
  } = await supabase
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

  // 3. FormData에서 계곡 ID 가져오기
  const formData =
    await request.formData();

  const id = String(
    formData.get("id") ?? ""
  ).trim();

  if (!id) {
    return redirectWithError(
      request,
      "계곡 정보를 찾을 수 없습니다."
    );
  }

  // 4. 계곡 정보 전체 확인
  const {
    data: valley,
    error: valleyError,
  } = await supabase
    .from("valleys")
    .select(
      `
        id,
        name,
        slug,
        region,
        city,
        address,
        summary,
        image_url,
        latitude,
        longitude,
        is_published
      `
    )
    .eq(
      "id",
      id
    )
    .maybeSingle();

  if (
    valleyError ||
    !valley
  ) {
    return redirectWithError(
      request,
      "해당 계곡 정보를 찾을 수 없습니다."
    );
  }

  // 5. 새 공개 상태
  const newPublishedStatus =
    !valley.is_published;

  // 6. 공개하려는 경우만
  // 공개 준비 상태 검사
  if (newPublishedStatus) {
    const publishCheck =
      checkValleyPublishReady(
        valley
      );

    if (!publishCheck.ready) {
      return redirectWithError(
        request,
        `공개할 수 없습니다. 다음 정보를 먼저 등록해 주세요: ${publishCheck.missing.join(
          ", "
        )}`
      );
    }
  }

  // 7. 공개 ↔ 비공개 전환
  const {
    error: updateError,
  } = await supabase
    .from("valleys")
    .update({
      is_published:
        newPublishedStatus,
    })
    .eq(
      "id",
      id
    );

  if (updateError) {
    return redirectWithError(
      request,
      `공개 상태 변경 실패: ${updateError.message}`
    );
  }

  // 8. 관리자 페이지 이동
  const statusMessage =
    newPublishedStatus
      ? `${valley.name}이(가) 공개되었습니다.`
      : `${valley.name}이(가) 비공개 처리되었습니다.`;

  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      statusMessage
    ),
    303
  );
}