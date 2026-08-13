import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "valley-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL("/admin", request.url);
  url.searchParams.set(type, message);
  return url;
}

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    adminUrl(request, "error", message),
    303
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. 로그인 사용자 확인
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

  // 2. 관리자 권한 확인
  const { data: adminUser, error: adminError } = await supabase
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

  // 3. 입력값 읽기
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  const region = String(formData.get("region") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();

  const latitudeValue = String(
    formData.get("latitude") ?? ""
  ).trim();

  const longitudeValue = String(
    formData.get("longitude") ?? ""
  ).trim();

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!name || !slug || !region || !city || !address || !summary) {
    return redirectWithError(
      request,
      "필수 항목을 모두 입력해 주세요."
    );
  }

  // 영문 소문자, 숫자, 하이픈만 허용
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return redirectWithError(
      request,
      "영문 식별자는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
    );
  }

  // 위도 / 경도 검사
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
    (!Number.isFinite(latitude) ||
      latitude! < -90 ||
      latitude! > 90)
  ) {
    return redirectWithError(
      request,
      "위도는 -90에서 90 사이의 숫자로 입력해 주세요."
    );
  }

  if (
    longitudeValue !== "" &&
    (!Number.isFinite(longitude) ||
      longitude! < -180 ||
      longitude! > 180)
  ) {
    return redirectWithError(
      request,
      "경도는 -180에서 180 사이의 숫자로 입력해 주세요."
    );
  }

  // 4. 대표사진 검사
  const imageValue = formData.get("image");

  const image =
    imageValue instanceof File && imageValue.size > 0
      ? imageValue
      : null;

  if (image && !ALLOWED_IMAGE_TYPES.has(image.type)) {
    return redirectWithError(
      request,
      "대표사진은 JPG, PNG, WEBP 파일만 등록할 수 있습니다."
    );
  }

  if (image && image.size > MAX_IMAGE_SIZE) {
    return redirectWithError(
      request,
      "대표사진은 5MB 이하만 등록할 수 있습니다."
    );
  }

  let imagePath: string | null = null;
  let imageUrl: string | null = null;

  // 5. Supabase Storage에 사진 업로드
  if (image) {
    const extension = ALLOWED_IMAGE_TYPES.get(image.type)!;

    imagePath = `${slug}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(imagePath, image, {
        contentType: image.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return redirectWithError(
        request,
        `사진 업로드 실패: ${uploadError.message}`
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(imagePath);

    imageUrl = publicUrlData.publicUrl;
  }

  // 6. 계곡 정보를 DB에 저장
  const { error: insertError } = await supabase
    .from("valleys")
    .insert({
      name,
      slug,
      region,
      city,
      address,
      phone: phone || null,
      summary,
      tags,
      parking: formData.get("parking") === "on",
      restroom: formData.get("restroom") === "on",
      family: formData.get("family") === "on",
      pet: formData.get("pet") === "on",

      latitude,
      longitude,

      theme: "emerald",
      image_url: imageUrl,
      is_published: false,
      created_by: user.id,
    });

  if (insertError) {
    // DB 등록 실패 시 먼저 업로드한 사진 제거
    if (imagePath) {
      await supabase.storage
        .from(IMAGE_BUCKET)
        .remove([imagePath]);
    }

    const message =
      insertError.code === "23505"
        ? "이미 사용 중인 영문 식별자입니다."
        : `등록 실패: ${insertError.message}`;

    return redirectWithError(request, message);
  }

  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${name} 등록이 완료되었습니다. 공개 설정 후 홈페이지에 표시됩니다.`
    ),
    303
  );
}