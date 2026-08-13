import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL("/admin", request.url);
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

function parseTriState(
  value: FormDataEntryValue | null
): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function POST(
  request: Request
) {
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

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const region = String(formData.get("region") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();

  const activity = String(
    formData.get("activity") ?? ""
  ).trim();

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const latitudeValue = String(
    formData.get("latitude") ?? ""
  ).trim();

  const longitudeValue = String(
    formData.get("longitude") ?? ""
  ).trim();

  if (
    !id ||
    !name ||
    !slug ||
    !region ||
    !city ||
    !address ||
    !summary
  ) {
    return redirectWithError(
      request,
      "필수 항목을 모두 입력해 주세요."
    );
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    return redirectWithError(
      request,
      "영문 식별자는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
    );
  }

  const latitude =
    latitudeValue !== ""
      ? Number(latitudeValue)
      : null;

  const longitude =
    longitudeValue !== ""
      ? Number(longitudeValue)
      : null;

  if (
    latitudeValue !== "" &&
    (
      !Number.isFinite(latitude) ||
      latitude! < -90 ||
      latitude! > 90
    )
  ) {
    return redirectWithError(
      request,
      "위도는 -90에서 90 사이의 숫자로 입력해 주세요."
    );
  }

  if (
    longitudeValue !== "" &&
    (
      !Number.isFinite(longitude) ||
      longitude! < -180 ||
      longitude! > 180
    )
  ) {
    return redirectWithError(
      request,
      "경도는 -180에서 180 사이의 숫자로 입력해 주세요."
    );
  }

  const {
    data: currentValley,
    error: currentValleyError,
  } = await supabase
    .from("valleys")
    .select("id, name, slug")
    .eq("id", id)
    .maybeSingle();

  if (
    currentValleyError ||
    !currentValley
  ) {
    return redirectWithError(
      request,
      "수정할 계곡 정보를 찾을 수 없습니다."
    );
  }

  if (currentValley.slug !== slug) {
    const {
      data: duplicateSlug,
      error: duplicateError,
    } = await supabase
      .from("valleys")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      return redirectWithError(
        request,
        `영문 식별자 확인 실패: ${duplicateError.message}`
      );
    }

    if (duplicateSlug) {
      return redirectWithError(
        request,
        "이미 사용 중인 영문 식별자입니다."
      );
    }
  }

  const parking = parseTriState(formData.get("parking"));
  const restroom = parseTriState(formData.get("restroom"));
  const pet = parseTriState(formData.get("pet"));

  const {
    error: updateError,
  } = await supabase
    .from("valleys")
    .update({
      name,
      slug,
      region,
      city,
      address,
      phone: phone || null,
      summary,
      tags,
      parking,
      restroom,
      activity: activity || null,
      pet,
      latitude,
      longitude,
    })
    .eq("id", id);

  if (updateError) {
    const message =
      updateError.code === "23505"
        ? "이미 사용 중인 영문 식별자입니다."
        : `계곡 정보 수정 실패: ${updateError.message}`;

    return redirectWithError(
      request,
      message
    );
  }

  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${name} 정보가 수정되었습니다.`
    ),
    303
  );
}