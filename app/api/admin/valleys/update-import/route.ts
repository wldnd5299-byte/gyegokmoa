import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  readValleyExcel,
  type ValleyImportRow,
} from "@/lib/valleys-import";

const ALLOWED_FILE_EXTENSIONS = [
  ".xlsx",
  ".xls",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

function validateRow(
  row: ValleyImportRow
): string[] {
  const errors: string[] = [];

  if (!row.slug) {
    errors.push(
      "영문 식별자(slug)가 없습니다."
    );
  } else if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      row.slug
    )
  ) {
    errors.push(
      "slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
    );
  }

  if (!row.name) {
    errors.push("계곡명이 없습니다.");
  }

  if (!row.region) {
    errors.push("지역(region)이 없습니다.");
  }

  if (!row.city) {
    errors.push("시/군/구(city)가 없습니다.");
  }

  if (!row.address) {
    errors.push("주소(address)가 없습니다.");
  }

  if (!row.summary) {
    errors.push("소개(summary)가 없습니다.");
  }

  if (
    row.latitude !== null &&
    (
      row.latitude < -90 ||
      row.latitude > 90
    )
  ) {
    errors.push(
      "위도(latitude)가 올바르지 않습니다."
    );
  }

  if (
    row.longitude !== null &&
    (
      row.longitude < -180 ||
      row.longitude > 180
    )
  ) {
    errors.push(
      "경도(longitude)가 올바르지 않습니다."
    );
  }

  return errors;
}

export async function POST(
  request: Request
) {
  const supabase = await createClient();

  /*
   * 1. 로그인 확인
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
   * 3. 엑셀 파일 확인
   */
  const formData = await request.formData();
  const fileValue = formData.get("excel");

  if (
    !(fileValue instanceof File) ||
    fileValue.size === 0
  ) {
    return redirectWithError(
      request,
      "수정할 엑셀 파일을 선택해 주세요."
    );
  }

  const fileName =
    fileValue.name.toLowerCase();

  const isAllowedFile =
    ALLOWED_FILE_EXTENSIONS.some(
      (extension) =>
        fileName.endsWith(extension)
    );

  if (!isAllowedFile) {
    return redirectWithError(
      request,
      "XLSX 또는 XLS 엑셀 파일만 업로드할 수 있습니다."
    );
  }

  if (fileValue.size > MAX_FILE_SIZE) {
    return redirectWithError(
      request,
      "엑셀 파일은 10MB 이하만 업로드할 수 있습니다."
    );
  }

  /*
   * 4. 엑셀 읽기
   */
  let rows: ValleyImportRow[];

  try {
    const buffer =
      await fileValue.arrayBuffer();

    rows = readValleyExcel(buffer);
  } catch (error) {
    console.error(
      "Excel update read error:",
      error
    );

    return redirectWithError(
      request,
      "엑셀 파일을 읽을 수 없습니다."
    );
  }

  if (rows.length === 0) {
    return redirectWithError(
      request,
      "엑셀 파일에 수정할 계곡 정보가 없습니다."
    );
  }

  /*
   * 5. 행별 데이터 검사
   */
  const validationErrors: string[] = [];

  for (const row of rows) {
    const errors = validateRow(row);

    if (errors.length > 0) {
      validationErrors.push(
        `${row.rowNumber}행: ${errors.join(
          " / "
        )}`
      );
    }
  }

  if (validationErrors.length > 0) {
    const preview =
      validationErrors
        .slice(0, 5)
        .join(" | ");

    const remaining =
      validationErrors.length > 5
        ? ` 외 ${
            validationErrors.length - 5
          }건`
        : "";

    return redirectWithError(
      request,
      `엑셀 입력 오류: ${preview}${remaining}`
    );
  }

  /*
   * 6. 엑셀 내부 slug 중복 검사
   */
  const slugCount =
    new Map<string, number>();

  for (const row of rows) {
    slugCount.set(
      row.slug,
      (slugCount.get(row.slug) ?? 0) + 1
    );
  }

  const duplicatedSlugs =
    Array.from(slugCount.entries())
      .filter(([, count]) => count > 1)
      .map(([slug]) => slug);

  if (duplicatedSlugs.length > 0) {
    return redirectWithError(
      request,
      `엑셀 안에 중복된 slug가 있습니다: ${duplicatedSlugs
        .slice(0, 5)
        .join(", ")}`
    );
  }

  /*
   * 7. 엑셀의 모든 slug가
   *    실제 DB에 존재하는지 먼저 확인
   *
   * 중요:
   * 존재하지 않는 slug가 하나라도 있으면
   * 아무것도 수정하지 않습니다.
   */
  const incomingSlugs =
    rows.map((row) => row.slug);

  const {
    data: existingValleys,
    error: existingError,
  } = await supabase
    .from("valleys")
    .select("slug")
    .in("slug", incomingSlugs);

  if (existingError) {
    return redirectWithError(
      request,
      `기존 계곡 확인 실패: ${existingError.message}`
    );
  }

  const existingSlugSet =
    new Set(
      (existingValleys ?? []).map(
        (valley) => valley.slug
      )
    );

  const missingSlugs =
    incomingSlugs.filter(
      (slug) =>
        !existingSlugSet.has(slug)
    );

  if (missingSlugs.length > 0) {
    return redirectWithError(
      request,
      `등록되어 있지 않은 slug가 있습니다: ${missingSlugs
        .slice(0, 5)
        .join(", ")}${
        missingSlugs.length > 5
          ? ` 외 ${missingSlugs.length - 5}개`
          : ""
      }. 안전을 위해 수정하지 않았습니다.`
    );
  }

  /*
   * 8. 기존 계곡 UPDATE
   *
   * slug는 검색 조건으로만 사용합니다.
   *
   * image_url
   * is_published
   * created_by
   * created_at
   *
   * 위 값들은 절대 건드리지 않습니다.
   */
  let updatedCount = 0;

  for (const row of rows) {
    const {
      error: updateError,
    } = await supabase
      .from("valleys")
      .update({
        name: row.name,
        region: row.region,
        city: row.city,
        address: row.address,
        phone: row.phone,
        summary: row.summary,
        tags: row.tags,

        parking: row.parking,
        restroom: row.restroom,
        family: row.family,
        pet: row.pet,

        latitude: row.latitude,
        longitude: row.longitude,
      })
      .eq("slug", row.slug);

    if (updateError) {
      console.error(
        `계곡 수정 실패: ${row.slug}`,
        updateError
      );

      return redirectWithError(
        request,
        `${row.rowNumber}행 ${row.name} 수정 중 오류가 발생했습니다: ${updateError.message} / ${updatedCount}개 수정 후 중단되었습니다.`
      );
    }

    updatedCount += 1;
  }

  /*
   * 9. 완료
   */
  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${updatedCount}개 기존 계곡 정보 수정 완료`
    ),
    303
  );
}