import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  readPlaceExcel,
  type PlaceImportRow,
} from "@/lib/places-import";

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

const ALLOWED_PLACE_TYPES = new Set([
  "attraction",
  "restaurant",
  "cafe",
  "accommodation",
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

function validateRow(
  row: PlaceImportRow
): string[] {
  const errors: string[] = [];

  if (!row.place_type) {
    errors.push(
      "장소 유형(place_type)이 없습니다."
    );
  } else if (
    !ALLOWED_PLACE_TYPES.has(
      row.place_type
    )
  ) {
    errors.push(
      "장소 유형은 attraction, restaurant, cafe, accommodation 중 하나여야 합니다."
    );
  }

  if (!row.name) {
    errors.push(
      "장소명이 없습니다."
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
      "한줄 소개(summary)가 없습니다."
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
 * 좌표가 없는 장소:
 *
 * 1차 주소 검색
 * 2차 지역 + 시군구 + 장소명 검색
 */
async function fillCoordinates(
  rows: PlaceImportRow[]
) {
  let addressSuccessCount = 0;
  let keywordSuccessCount = 0;
  let failedCount = 0;

  for (const row of rows) {
    if (
      row.latitude !== null &&
      row.longitude !== null
    ) {
      continue;
    }

    try {
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
       * 기존 카카오 장소검색 함수를
       * 일반 장소 검색에도 재사용합니다.
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

        continue;
      }

      failedCount += 1;

      console.warn(
        "장소 좌표 검색 결과 없음:",
        {
          name: row.name,
          address: row.address,
          region: row.region,
          city: row.city,
        }
      );
    } catch (error) {
      failedCount += 1;

      console.error(
        `장소 좌표 자동 검색 실패: ${row.name}`,
        error
      );
    }
  }

  return {
    addressSuccessCount,
    keywordSuccessCount,
    failedCount,
  };
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
   * 3. 엑셀 파일 확인
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
   * 4. 엑셀 읽기
   */
  let rows: PlaceImportRow[];

  try {
    const buffer =
      await fileValue.arrayBuffer();

    rows =
      readPlaceExcel(
        buffer
      );
  } catch (error) {
    console.error(
      "Place Excel read error:",
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
      "엑셀 파일에 등록할 장소 정보가 없습니다."
    );
  }

  /*
   * 5. 각 행 검사
   */
  const validationErrors:
    string[] = [];

  for (const row of rows) {
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
   * 7. places에 이미 존재하는 slug 확인
   */
  const incomingSlugs =
    rows.map(
      (row) =>
        row.slug
    );

  const {
    data: existingPlaces,
    error: existingError,
  } =
    await supabase
      .from("places")
      .select("slug")
      .in(
        "slug",
        incomingSlugs
      );

  if (existingError) {
    return redirectWithError(
      request,
      `기존 장소 확인 실패: ${existingError.message}`
    );
  }

  const existingSlugSet =
    new Set(
      (
        existingPlaces ??
        []
      ).map(
        (place) =>
          place.slug
      )
    );

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
      `등록할 새로운 장소가 없습니다. ${skippedCount}개 모두 이미 등록되어 있습니다.`
    );
  }

  /*
   * 8. 좌표 자동 검색
   */
  const coordinateResult =
    await fillCoordinates(
      newRows
    );

  /*
   * 9. DB 저장 데이터 생성
   */
  const insertRows =
    newRows.map(
      (row) => ({
        place_type:
          row.place_type,

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

        latitude:
          row.latitude,

        longitude:
          row.longitude,

        phone:
          row.phone,

        website_url:
          row.website_url,

        summary:
          row.summary,

        description:
          row.description,

        parent_recommendation:
          row.parent_recommendation,

        business_hours:
          row.business_hours,

        closed_days: 
          row.closed_days,

        admission_fee:
          row.admission_fee,

        parking:
          row.parking,

        restroom:
          row.restroom,

        walking_easy:
          row.walking_easy,

        nearby_cafe:
          row.nearby_cafe,

        environment_type:
          row.environment_type,

        seating_type:
          row.seating_type,

        cuisine_type:
          row.cuisine_type,

        tags:
          row.tags,

        /*
         * 일괄등록 후 직접 확인한 다음
         * 공개하도록 비공개로 시작합니다.
         */
        is_published:
          false,

        image_url:
          null,

        is_editor_pick:
          false,

        is_partner:
          false,

      })
    );

  /*
   * 10. Supabase 일괄등록
   */
  const {
    error: insertError,
  } =
    await supabase
      .from("places")
      .insert(
        insertRows
      );

  if (insertError) {
    return redirectWithError(
      request,
      `엑셀 일괄 등록 실패: ${insertError.message}`
    );
  }

  /*
   * 11. 결과
   */
  let message =
    `${newRows.length}개 장소 등록 완료`;

  if (
    skippedCount > 0
  ) {
    message +=
      ` / 중복 ${skippedCount}개 제외`;
  }

  message +=
    ` / 주소좌표 ${coordinateResult.addressSuccessCount}개`;

  message +=
    ` / 장소명좌표 ${coordinateResult.keywordSuccessCount}개`;

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