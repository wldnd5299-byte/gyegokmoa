import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL("/admin/places", request.url);
  url.searchParams.set(type, message);
  return url;
}

function redirectWithError(
  request: Request,
  message: string
) {
  return NextResponse.redirect(
    adminUrl(request, "error", message),
    303
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL(
        "/admin/login?error=로그인이 필요합니다.",
        request.url
      ),
      303
    );
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
    return redirectWithError(
      request,
      "관리자 권한이 없습니다."
    );
  }

  const formData = await request.formData();

  const placeIds = Array.from(
    new Set(
      formData
        .getAll("place_ids")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );

  if (placeIds.length === 0) {
    return redirectWithError(
      request,
      "공개할 장소를 선택해 주세요."
    );
  }

  const { error: updateError } = await supabase
    .from("places")
    .update({ is_published: true })
    .in("id", placeIds);

  if (updateError) {
    return redirectWithError(
      request,
      `선택 공개 실패: ${updateError.message}`
    );
  }

  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `선택한 ${placeIds.length}개 장소를 공개했습니다.`
    ),
    303
  );
}
