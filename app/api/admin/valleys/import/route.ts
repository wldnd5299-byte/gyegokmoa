import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  readValleyExcel,
  type ValleyImportRow,
} from "@/lib/valleys-import";

import {
  geocodeAddress,
  geocodeValleyByKeyword,
} from "@/lib/kakao-geocode";

const ALLOWED_FILE_EXTENSIONS = [
  ".xlsx",
  ".xls",
];

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL(
    "/admin",
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

function validateRow(
  row: ValleyImportRow
): string[] {
  const errors: string[] = [];

  if (!row.name) {
    errors.push(
      "계곡명이 없습니다."
    );
  }

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

  if (!row.region) {
    errors.push(
      "지역(region)이 없습니다."
    );
  }

  if (!row.city) {
    errors.push(
      "시/군/구(city)가 없습니다."
    );
  }

  if (!row.address) {
    errors.push(
      "주소(address)가 없습니다."
    );
  }

  if (!row.summary) {
    errors.push(
      "소개(summary)가 없습니다."
    );
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

/*
 * 주소 → 좌표
 *
 * 1차:
 * 주소 검색
 *
 * 2차:
 * 주소 검색 실패 시
 * 지역 + 시군 + 계곡명으로
 * 카카오 장소 검색
 */
async function fillCoordinates(
  rows: ValleyImportRow[]
) {
  let addressSuccessCount = 0;
  let keywordSuccessCount = 0;
  let failedCount = 0;

  const failedRows: string[] = [];

  for (const row of rows) {
    /*
     * 엑셀에 좌표가 이미 있으면
     * 그대로 사용합니다.
     */
    if (
      row.latitude !== null &&
      row.longitude !== null
    ) {
      continue;
    }

    try {
      /*
       * =========================
       * 1차 검색
       * 주소 → 좌표
       * =========================
       */
      const addressResult =
        await geocodeAddress(
          row.address
        );

      if (addressResult) {
        row.latitude =
          addressResult.latitude;

        row.longitude =
          addressResult.longitude;

        addressSuccessCount += 1;

        continue;
      }

      /*
       * =========================
       * 2차 검색
       * 지역 + 시군 + 계곡명
       * =========================
       */
      const keywordResult =
        await geocodeValleyByKeyword(
          row.name,
          row.region,
          row.city
        );

      if (keywordResult) {
        row.latitude =
          keywordResult.latitude;

        row.longitude =
          keywordResult.longitude;

        keywordSuccessCount += 1;

        console.log(
          "계곡 키워드 좌표 검색 성공:",
          {
            name:
              row.name,

            query:
              `${row.region} ${row.city} ${row.name}`,

            matchedPlace:
              keywordResult.matchedPlaceName,

            matchedAddress:
              keywordResult.matchedAddress,

            latitude:
              keywordResult.latitude,

            longitude:
              keywordResult.longitude,
          }
        );

        continue;
      }

      /*
       * 주소검색과 키워드검색
       * 둘 다 실패
       */
      failedCount += 1;

      failedRows.push(
        `${row.rowNumber}행 ${row.name}`
      );

      console.warn(
        "계곡 좌표 검색 결과 없음:",
        {
          name: row.name,
          address: row.address,
          region: row.region,
          city: row.city,
        }
      );
    } catch (error) {
      console.error(
        `좌표 자동 검색 실패: ${row.name}`,
        error
      );

      failedCount += 1;

      failedRows.push(
        `${row.rowNumber}행 ${row.name}`
      );
    }
  }

  return {
    addressSuccessCount,
    keywordSuccessCount,

    successCount:
      addressSuccessCount +
      keywordSuccessCount,

    failedCount,
    failedRows,
  };
}

export async function POST(
  request: Request
) {
  const supabase =
    await createClient();

  /*
   * =========================
   * 1. 로그인 사용자 확인
   * =========================
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
   * =========================
   * 2. 관리자 권한 확인
   * =========================
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
   * =========================
   * 3. 업로드 파일 가져오기
   * =========================
   */
  const formData =
    await request.formData();

  const fileValue =
    formData.get("excel");

  if (
    !(fileValue instanceof File) ||
    fileValue.size === 0
  ) {
    return redirectWithError(
      request,
      "업로드할 엑셀 파일을 선택해 주세요."
    );
  }

  const fileName =
    fileValue.name.toLowerCase();

  const isAllowedFile =
    ALLOWED_FILE_EXTENSIONS.some(
      (extension) =>
        fileName.endsWith(
          extension
        )
    );

  if (!isAllowedFile) {
    return redirectWithError(
      request,
      "XLSX 또는 XLS 엑셀 파일만 업로드할 수 있습니다."
    );
  }

  if (
    fileValue.size >
    MAX_FILE_SIZE
  ) {
    return redirectWithError(
      request,
      "엑셀 파일은 10MB 이하만 업로드할 수 있습니다."
    );
  }

  /*
   * =========================
   * 4. 엑셀 읽기
   * =========================
   */
  let rows:
    ValleyImportRow[];

  try {
    const buffer =
      await fileValue.arrayBuffer();

    rows =
      readValleyExcel(
        buffer
      );
  } catch (error) {
    console.error(
      "Excel read error:",
      error
    );

    return redirectWithError(
      request,
      "엑셀 파일을 읽을 수 없습니다. 파일 형식을 확인해 주세요."
    );
  }

  if (
    rows.length === 0
  ) {
    return redirectWithError(
      request,
      "엑셀 파일에 등록할 계곡 정보가 없습니다."
    );
  }

  /*
   * =========================
   * 5. 각 행 기본 검사
   * =========================
   */
  const validationErrors:
    string[] = [];

  for (
    const row of rows
  ) {
    const errors =
      validateRow(row);

    if (
      errors.length > 0
    ) {
      validationErrors.push(
        `${row.rowNumber}행: ${errors.join(
          " / "
        )}`
      );
    }
  }

  if (
    validationErrors.length >
    0
  ) {
    const preview =
      validationErrors
        .slice(0, 5)
        .join(" | ");

    const remaining =
      validationErrors.length >
      5
        ? ` 외 ${
            validationErrors.length -
            5
          }건`
        : "";

    return redirectWithError(
      request,
      `엑셀 입력 오류: ${preview}${remaining}`
    );
  }

  /*
   * =========================
   * 6. 엑셀 내부 slug 중복 검사
   * =========================
   */
  const slugCount =
    new Map<
      string,
      number
    >();

  for (
    const row of rows
  ) {
    slugCount.set(
      row.slug,
      (
        slugCount.get(
          row.slug
        ) ?? 0
      ) + 1
    );
  }

  const duplicatedExcelSlugs =
    Array.from(
      slugCount.entries()
    )
      .filter(
        ([, count]) =>
          count > 1
      )
      .map(
        ([slug]) =>
          slug
      );

  if (
    duplicatedExcelSlugs.length >
    0
  ) {
    return redirectWithError(
      request,
      `엑셀 안에 중복된 slug가 있습니다: ${duplicatedExcelSlugs
        .slice(0, 5)
        .join(", ")}`
    );
  }

  /*
   * =========================
   * 7. 기존 DB slug 확인
   * =========================
   */
  const incomingSlugs =
    rows.map(
      (row) =>
        row.slug
    );

  const {
    data:
      existingValleys,
    error:
      existingError,
  } =
    await supabase
      .from("valleys")
      .select("slug")
      .in(
        "slug",
        incomingSlugs
      );

  if (
    existingError
  ) {
    return redirectWithError(
      request,
      `기존 계곡 확인 실패: ${existingError.message}`
    );
  }

  const existingSlugSet =
    new Set(
      (
        existingValleys ??
        []
      ).map(
        (valley) =>
          valley.slug
      )
    );

  /*
   * 기존 DB에 있는 계곡은
   * 다시 등록하지 않습니다.
   */
  const newRows =
    rows.filter(
      (row) =>
        !existingSlugSet.has(
          row.slug
        )
    );

  const skippedCount =
    rows.length -
    newRows.length;

  if (
    newRows.length === 0
  ) {
    return redirectWithError(
      request,
      `등록할 새로운 계곡이 없습니다. ${skippedCount}개 모두 이미 등록되어 있습니다.`
    );
  }

  /*
   * =========================
   * 8. 좌표 자동검색
   *
   * 1차 주소검색
   * 2차 계곡명 장소검색
   * =========================
   */
  const coordinateResult =
    await fillCoordinates(
      newRows
    );

  /*
   * 좌표 검색 실패가 있어도
   * 전체 업로드는 중단하지 않습니다.
   *
   * 좌표가 없는 계곡은
   * 관리자에서 정보 보완 필요로
   * 표시됩니다.
   */

  /*
   * =========================
   * 9. DB 저장용 데이터 생성
   * =========================
   */
  const insertRows =
    newRows.map(
      (row) => ({
        name:
          row.name,

        slug:
          row.slug,

        region:
          row.region,

        city:
          row.city,

        address:
          row.address,

        phone:
          row.phone,

        summary:
          row.summary,

        tags:
          row.tags,

        parking:
          row.parking,

        restroom:
          row.restroom,

        family:
          row.family,

        pet:
          row.pet,

        latitude:
          row.latitude,

        longitude:
          row.longitude,

        theme:
          "emerald",

        image_url:
          null,

        /*
         * 엑셀 일괄등록 계곡은
         * 항상 비공개 상태로 시작
         */
        is_published:
          false,

        created_by:
          user.id,
      })
    );

  /*
   * =========================
   * 10. Supabase 일괄 등록
   * =========================
   */
  const {
    error:
      insertError,
  } =
    await supabase
      .from("valleys")
      .insert(
        insertRows
      );

  if (
    insertError
  ) {
    return redirectWithError(
      request,
      `엑셀 일괄 등록 실패: ${insertError.message}`
    );
  }

  /*
   * =========================
   * 11. 결과 메시지
   * =========================
   */
  let message =
    `${newRows.length}개 계곡 등록 완료`;

  if (
    skippedCount > 0
  ) {
    message +=
      ` / 중복 ${skippedCount}개 제외`;
  }

  message +=
    ` / 주소좌표 ${coordinateResult.addressSuccessCount}개`;

  message +=
    ` / 계곡명좌표 ${coordinateResult.keywordSuccessCount}개`;

  if (
    coordinateResult.failedCount >
    0
  ) {
    message +=
      ` / 좌표 확인 필요 ${coordinateResult.failedCount}개`;
  }

  message +=
    ". 모두 비공개 상태입니다.";

  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      message
    ),
    303
  );
}