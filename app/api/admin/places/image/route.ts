import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "valley-images";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

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
   * 3. 폼 데이터
   */
  const formData =
    await request.formData();

  const slugValue =
    formData.get("slug");

  const imageValue =
    formData.get("image");

  const slug =
    typeof slugValue === "string"
      ? slugValue.trim().toLowerCase()
      : "";

  if (!slug) {
    return redirectWithError(
      request,
      "장소 식별자가 없습니다."
    );
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug
    )
  ) {
    return redirectWithError(
      request,
      "올바르지 않은 장소 식별자입니다."
    );
  }

  if (
    !(imageValue instanceof File) ||
    imageValue.size === 0
  ) {
    return redirectWithError(
      request,
      "대표사진을 선택해 주세요."
    );
  }

  /*
   * 4. 장소 존재 확인
   */
  const {
    data: place,
    error: placeError,
  } =
    await supabase
      .from("places")
      .select(
        "id, name, slug, image_url"
      )
      .eq(
        "slug",
        slug
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
   * 5. 이미지 검사
   */
  if (
    imageValue.size >
    MAX_IMAGE_SIZE
  ) {
    return redirectWithError(
      request,
      "대표사진은 5MB 이하만 업로드할 수 있습니다."
    );
  }

  const extension =
    ALLOWED_IMAGE_TYPES.get(
      imageValue.type
    );

  if (!extension) {
    return redirectWithError(
      request,
      "JPG, PNG, WEBP 이미지만 업로드할 수 있습니다."
    );
  }

  const imagePath =
    `places/${slug}.${extension}`;

  /*
   * 6. 새 이미지 업로드
   */
  const {
    error: uploadError,
  } =
    await supabase.storage
      .from(
        IMAGE_BUCKET
      )
      .upload(
        imagePath,
        imageValue,
        {
          upsert: true,
          contentType:
            imageValue.type,
        }
      );

  if (uploadError) {
    return redirectWithError(
      request,
      `대표사진 업로드 실패: ${uploadError.message}`
    );
  }

  /*
   * 7. 공개 URL 생성
   */
  const {
    data: publicUrlData,
  } =
    supabase.storage
      .from(
        IMAGE_BUCKET
      )
      .getPublicUrl(
        imagePath
      );

  const imageUrl =
    publicUrlData.publicUrl;

  /*
   * 8. places의 image_url 업데이트
   */
  const {
    error: updateError,
  } =
    await supabase
      .from("places")
      .update({
        image_url:
          imageUrl,
      })
      .eq(
        "id",
        place.id
      );

  if (updateError) {
    /*
     * DB 저장 실패 시
     * 방금 올린 파일 정리
     */
    await supabase.storage
      .from(
        IMAGE_BUCKET
      )
      .remove([
        imagePath,
      ]);

    return redirectWithError(
      request,
      `대표사진 정보 저장 실패: ${updateError.message}`
    );
  }

  /*
   * 9. 기존 이미지의 확장자가 다르면
   * 이전 파일 정리
   *
   * 예:
   * 기존 jpg → 새 png
   */
  if (
    place.image_url &&
    !place.image_url.endsWith(
      `.${extension}`
    )
  ) {
    const oldExtensions = [
      "jpg",
      "png",
      "webp",
    ].filter(
      (oldExtension) =>
        oldExtension !==
        extension
    );

    await supabase.storage
      .from(
        IMAGE_BUCKET
      )
      .remove(
        oldExtensions.map(
          (oldExtension) =>
            `places/${slug}.${oldExtension}`
        )
      );
  }

  /*
   * 10. 완료
   */
  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${place.name} 대표사진 등록 완료`
    ),
    303
  );
}