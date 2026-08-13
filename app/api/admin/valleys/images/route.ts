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

function redirectWithError(
  request: Request,
  message: string
) {
  return NextResponse.redirect(
    adminUrl(request, "error", message),
    303
  );
}

function getSlugFromFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0) {
    return "";
  }

  return fileName
    .slice(0, lastDotIndex)
    .trim()
    .toLowerCase();
}

export async function POST(request: Request) {
  const supabase = await createClient();

  /*
   * 1. 로그인 사용자 확인
   */
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

  /*
   * 2. 관리자 권한 확인
   */
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

  /*
   * 3. 업로드된 이미지 파일 가져오기
   */
  const formData = await request.formData();

  const fileValues = formData.getAll("images");

  const files = fileValues.filter(
    (value): value is File =>
      value instanceof File &&
      value.size > 0
  );

  if (files.length === 0) {
    return redirectWithError(
      request,
      "업로드할 대표사진을 선택해 주세요."
    );
  }

  /*
   * 4. 최대 파일 수 제한
   *
   * 너무 많은 파일을 한 번에 올려
   * 서버 요청이 과도하게 커지는 것을 방지합니다.
   */
  if (files.length > 100) {
    return redirectWithError(
      request,
      "대표사진은 한 번에 최대 100장까지 업로드할 수 있습니다."
    );
  }

  /*
   * 처리 결과
   */
  let successCount = 0;
  let notFoundCount = 0;
  let invalidCount = 0;
  let uploadFailedCount = 0;
  let updateFailedCount = 0;

  const skippedDetails: string[] = [];

  /*
   * 5. 이미지 한 장씩 처리
   */
  for (const file of files) {
    /*
     * 이미지 형식 검사
     */
    const extension =
      ALLOWED_IMAGE_TYPES.get(file.type);

    if (!extension) {
      invalidCount += 1;

      skippedDetails.push(
        `${file.name}: 지원하지 않는 이미지 형식`
      );

      continue;
    }

    /*
     * 이미지 크기 검사
     */
    if (file.size > MAX_IMAGE_SIZE) {
      invalidCount += 1;

      skippedDetails.push(
        `${file.name}: 5MB 초과`
      );

      continue;
    }

    /*
     * 파일명 → slug
     *
     * 예:
     * yongchu-gapyeong.jpg
     * ↓
     * yongchu-gapyeong
     */
    const slug =
      getSlugFromFileName(file.name);

    if (
      !slug ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      invalidCount += 1;

      skippedDetails.push(
        `${file.name}: 파일명이 올바른 slug 형식이 아님`
      );

      continue;
    }

    /*
     * 6. 해당 slug 계곡 확인
     */
    const {
      data: valley,
      error: valleyError,
    } = await supabase
      .from("valleys")
      .select(
        `
          id,
          slug,
          name,
          image_url
        `
      )
      .eq("slug", slug)
      .maybeSingle();

    if (valleyError) {
      notFoundCount += 1;

      skippedDetails.push(
        `${file.name}: 계곡 조회 실패`
      );

      continue;
    }

    if (!valley) {
      notFoundCount += 1;

      skippedDetails.push(
        `${file.name}: slug와 일치하는 계곡 없음`
      );

      continue;
    }

    /*
     * 7. Storage 경로
     *
     * 계곡마다 대표사진 파일을 하나로 유지합니다.
     *
     * 예:
     * yongchu-gapyeong/cover.jpg
     */
    const storagePath =
      `${slug}/cover.${extension}`;

    /*
     * 8. Supabase Storage 업로드
     *
     * upsert: true
     * → 기존 대표사진이 있으면 새 사진으로 교체
     */
    const {
      error: uploadError,
    } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(
        storagePath,
        file,
        {
          contentType: file.type,
          cacheControl: "3600",
          upsert: true,
        }
      );

    if (uploadError) {
  console.error(
    "대표사진 Storage 업로드 실패:",
    {
      fileName: file.name,
      slug,
      storagePath,
      error: uploadError,
    }
  );

  uploadFailedCount += 1;

  skippedDetails.push(
    `${file.name}: 사진 업로드 실패 - ${uploadError.message}`
  );

  continue;
}

    /*
     * 9. 공개 URL 가져오기
     */
    const {
      data: publicUrlData,
    } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(storagePath);

    const imageUrl =
      publicUrlData.publicUrl;

    /*
     * 10. valleys.image_url 업데이트
     */
    const {
      error: updateError,
    } = await supabase
      .from("valleys")
      .update({
        image_url: imageUrl,
      })
      .eq("id", valley.id);

    if (updateError) {
      updateFailedCount += 1;

      skippedDetails.push(
        `${file.name}: DB 대표사진 연결 실패`
      );

      continue;
    }

    successCount += 1;
  }

  /*
   * 11. 성공한 사진이 하나도 없으면 오류 처리
   */
  if (successCount === 0) {
    const preview =
      skippedDetails
        .slice(0, 5)
        .join(" | ");

    return redirectWithError(
      request,
      `대표사진을 등록하지 못했습니다. ${preview}`
    );
  }

  /*
   * 12. 결과 메시지 생성
   */
  let message =
    `대표사진 ${successCount}장 등록 완료`;

  if (notFoundCount > 0) {
    message +=
      ` / 계곡 미일치 ${notFoundCount}장`;
  }

  if (invalidCount > 0) {
    message +=
      ` / 형식·용량 오류 ${invalidCount}장`;
  }

  if (uploadFailedCount > 0) {
    message +=
      ` / 업로드 실패 ${uploadFailedCount}장`;
  }

  if (updateFailedCount > 0) {
    message +=
      ` / DB 연결 실패 ${updateFailedCount}장`;
  }

  /*
   * 실패 상세 일부 표시
   */
  if (skippedDetails.length > 0) {
    message +=
      ` / 확인: ${skippedDetails
        .slice(0, 3)
        .join(" | ")}`;

    if (skippedDetails.length > 3) {
      message +=
        ` 외 ${skippedDetails.length - 3}건`;
    }
  }

  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      message
    ),
    303
  );
}