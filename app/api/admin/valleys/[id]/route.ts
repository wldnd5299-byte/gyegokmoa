import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "valley-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

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
  const { data: adminUser, error: adminError } =
    await supabase
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

  // 3. 기존 계곡 확인
  const { data: existingValley, error: existingError } =
    await supabase
      .from("valleys")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (existingError || !existingValley) {
    return redirectWithError(
      request,
      "수정할 계곡 정보를 찾을 수 없습니다."
    );
  }

  // 4. 입력값 읽기
  const formData = await request.formData();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const slug = String(
    formData.get("slug") ?? ""
  )
    .trim()
    .toLowerCase();

  const region = String(
    formData.get("region") ?? ""
  ).trim();

  const city = String(
    formData.get("city") ?? ""
  ).trim();

  const address = String(
    formData.get("address") ?? ""
  ).trim();

  const phone = String(
    formData.get("phone") ?? ""
  ).trim();

  const summary = String(
    formData.get("summary") ?? ""
  ).trim();

  const latitudeValue = String(
    formData.get("latitude") ?? ""
  ).trim();

  const longitudeValue = String(
    formData.get("longitude") ?? ""
  ).trim();

  const tags = String(
    formData.get("tags") ?? ""
  )
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  // 5. 필수값 확인
  if (
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

  // 6. slug 확인
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return redirectWithError(
      request,
      "영문 식별자는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
    );
  }

  // 7. 위도 / 경도 변환
  const latitude =
    latitudeValue !== ""
      ? Number(latitudeValue)
      : null;

  const longitude =
    longitudeValue !== ""
      ? Number(longitudeValue)
      : null;

  // 위도 확인
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

  // 경도 확인
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

  // 8. 대표사진 확인
  const imageValue = formData.get("image");

  const image =
    imageValue instanceof File &&
    imageValue.size > 0
      ? imageValue
      : null;

  if (
    image &&
    !ALLOWED_IMAGE_TYPES.has(image.type)
  ) {
    return redirectWithError(
      request,
      "대표사진은 JPG, PNG, WEBP 파일만 등록할 수 있습니다."
    );
  }

  if (
    image &&
    image.size > MAX_IMAGE_SIZE
  ) {
    return redirectWithError(
      request,
      "대표사진은 5MB 이하만 등록할 수 있습니다."
    );
  }

  // 기존 이미지
  let imageUrl =
    existingValley.image_url ?? null;

  let newImagePath: string | null = null;

  // 9. 새 사진이 있으면 업로드
  if (image) {
    const extension =
      ALLOWED_IMAGE_TYPES.get(image.type)!;

    newImagePath =
      `${slug}/${Date.now()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(
          newImagePath,
          image,
          {
            contentType: image.type,
            cacheControl: "3600",
            upsert: false,
          }
        );

    if (uploadError) {
      return redirectWithError(
        request,
        `사진 업로드 실패: ${uploadError.message}`
      );
    }

    const { data: publicUrlData } =
      supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(
          newImagePath
        );

    imageUrl =
      publicUrlData.publicUrl;
  }

  // 10. DB 수정
  const { error: updateError } =
    await supabase
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

        parking:
          formData.get("parking") === "on",

        restroom:
          formData.get("restroom") === "on",

        family:
          formData.get("family") === "on",

        pet:
          formData.get("pet") === "on",

        latitude,
        longitude,

        image_url: imageUrl,
      })
      .eq("id", id);

  // 11. DB 수정 실패
  if (updateError) {
    // 새 사진을 올렸다면 삭제
    if (newImagePath) {
      await supabase.storage
        .from(IMAGE_BUCKET)
        .remove([
          newImagePath,
        ]);
    }

    const message =
      updateError.code === "23505"
        ? "이미 사용 중인 영문 식별자입니다."
        : `수정 실패: ${updateError.message}`;

    return redirectWithError(
      request,
      message
    );
  }

  // 12. 기존 사진 삭제
  if (
    newImagePath &&
    existingValley.image_url
  ) {
    try {
      const oldUrl =
        existingValley.image_url;

      const marker =
        `/storage/v1/object/public/${IMAGE_BUCKET}/`;

      const markerIndex =
        oldUrl.indexOf(marker);

      if (markerIndex !== -1) {
        const oldPath =
          oldUrl.substring(
            markerIndex + marker.length
          );

        if (oldPath) {
          await supabase.storage
            .from(IMAGE_BUCKET)
            .remove([
              oldPath,
            ]);
        }
      }
    } catch {
      // 기존 사진 삭제 실패는
      // 계곡 정보 수정 자체에는 영향을 주지 않습니다.
    }
  }

  // 13. 관리자 페이지로 이동
  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${name} 정보가 수정되었습니다.`
    ),
    303
  );
}