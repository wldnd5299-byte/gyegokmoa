import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "valley-images";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const MAX_IMAGE_COUNT = 10;

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
   * 2. 관리자 확인
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

  const photographerValue =
    formData.get(
      "photographer_name"
    );

  const sourceUrlValue =
    formData.get(
      "source_url"
    );

  const slug =
    typeof slugValue === "string"
      ? slugValue.trim().toLowerCase()
      : "";

  const photographerName =
    typeof photographerValue === "string"
      ? photographerValue.trim() || null
      : null;

  const sourceUrl =
    typeof sourceUrlValue === "string"
      ? sourceUrlValue.trim() || null
      : null;

  if (!slug) {
    return redirectWithError(
      request,
      "장소 식별자가 없습니다."
    );
  }

  /*
   * 4. 장소 확인
   */
  const {
    data: place,
    error: placeError,
  } =
    await supabase
      .from("places")
      .select(
        "id, name, slug"
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
   * 5. 여러 이미지 가져오기
   */
  const files =
    formData.getAll("images")
      .filter(
        (value): value is File =>
          value instanceof File &&
          value.size > 0
      );

  if (
    files.length === 0
  ) {
    return redirectWithError(
      request,
      "업로드할 사진을 선택해 주세요."
    );
  }

  if (
    files.length >
    MAX_IMAGE_COUNT
  ) {
    return redirectWithError(
      request,
      `사진은 한 번에 최대 ${MAX_IMAGE_COUNT}장까지 업로드할 수 있습니다.`
    );
  }

  /*
   * 6. 이미지 검사
   */
  for (const file of files) {
    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      return redirectWithError(
        request,
        `${file.name} 파일이 5MB를 초과합니다.`
      );
    }

    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type
      )
    ) {
      return redirectWithError(
        request,
        `${file.name} 파일 형식을 사용할 수 없습니다. JPG, PNG, WEBP만 가능합니다.`
      );
    }
  }

  /*
   * 7. 현재 마지막 순서 확인
   */
  const {
    data: existingPhotos,
    error: existingPhotosError,
  } =
    await supabase
      .from("place_photos")
      .select("sort_order")
      .eq(
        "place_id",
        place.id
      )
      .order(
        "sort_order",
        {
          ascending: false,
        }
      )
      .limit(1);

  if (existingPhotosError) {
    return redirectWithError(
      request,
      `기존 사진 확인 실패: ${existingPhotosError.message}`
    );
  }

  const lastSortOrder =
    existingPhotos?.[0]?.sort_order ??
    -1;

  const uploadedPaths:
    string[] = [];

  const insertRows = [];

  /*
   * 8. Storage 업로드
   */
  try {
    for (
      let index = 0;
      index < files.length;
      index += 1
    ) {
      const file =
        files[index];

      const extension =
        ALLOWED_IMAGE_TYPES.get(
          file.type
        );

      if (!extension) {
        continue;
      }

      const uniquePart =
        `${Date.now()}-${index}`;

      const imagePath =
        `place-galleries/${slug}/${uniquePart}.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            IMAGE_BUCKET
          )
          .upload(
            imagePath,
            file,
            {
              upsert: false,
              contentType:
                file.type,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(
        imagePath
      );

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from(
            IMAGE_BUCKET
          )
          .getPublicUrl(
            imagePath
          );

      insertRows.push({
        place_id:
          place.id,

        image_url:
          publicUrlData.publicUrl,

        sort_order:
          lastSortOrder +
          index +
          1,

        photographer_name:
          photographerName,

        source_url:
          sourceUrl,

        is_cover:
          false,
      });
    }

    /*
     * 9. DB 저장
     */
    const {
      error: insertError,
    } =
      await supabase
        .from("place_photos")
        .insert(
          insertRows
        );

    if (insertError) {
      throw insertError;
    }
  } catch (error) {
    /*
     * 중간 실패 시
     * 이미 올라간 Storage 파일 삭제
     */
    if (
      uploadedPaths.length >
      0
    ) {
      await supabase.storage
        .from(
          IMAGE_BUCKET
        )
        .remove(
          uploadedPaths
        );
    }

    console.error(
      "장소 갤러리 업로드 실패:",
      error
    );

    return redirectWithError(
      request,
      "사진 업로드 중 오류가 발생했습니다."
    );
  }

  /*
   * 10. 완료
   */
  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${place.name} 사진 ${insertRows.length}장 등록 완료`
    ),
    303
  );
}