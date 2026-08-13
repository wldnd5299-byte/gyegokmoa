import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  geocodeAddress,
  geocodeValleyByKeyword,
} from "@/lib/kakao-geocode";

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL("/admin", request.url);

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
   * 1. 로그인 사용자 확인
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
   * 3. 현재 등록된 계곡 중
   * 좌표가 하나라도 없는 계곡 조회
   */
  const {
    data: valleys,
    error: valleyError,
  } =
    await supabase
      .from("valleys")
      .select(
        `
          id,
          name,
          region,
          city,
          address,
          latitude,
          longitude
        `
      )
      .or(
        "latitude.is.null,longitude.is.null"
      );

  if (valleyError) {
    return redirectWithError(
      request,
      `좌표 미등록 계곡 조회 실패: ${valleyError.message}`
    );
  }

  const targetValleys =
    valleys ?? [];

  if (
    targetValleys.length === 0
  ) {
    return NextResponse.redirect(
      adminUrl(
        request,
        "success",
        "좌표를 보완할 계곡이 없습니다. 모든 계곡에 좌표가 등록되어 있습니다."
      ),
      303
    );
  }

  let addressSuccessCount = 0;
  let keywordSuccessCount = 0;
  let failedCount = 0;
  let updateFailedCount = 0;

  const failedNames: string[] = [];

  /*
   * 4. 좌표 없는 계곡만
   * 하나씩 다시 검색
   */
  for (
    const valley of targetValleys
  ) {
    try {
      let latitude:
        number | null = null;

      let longitude:
        number | null = null;

      /*
       * 1차
       * 주소 → 좌표
       */
      if (
        valley.address &&
        valley.address.trim()
      ) {
        const addressResult =
          await geocodeAddress(
            valley.address
          );

        if (addressResult) {
          latitude =
            addressResult.latitude;

          longitude =
            addressResult.longitude;

          addressSuccessCount += 1;
        }
      }

      /*
       * 2차
       * 주소검색 실패 시
       * 지역 + 시군 + 계곡명 검색
       */
      if (
        latitude === null ||
        longitude === null
      ) {
        const keywordResult =
          await geocodeValleyByKeyword(
            valley.name,
            valley.region,
            valley.city
          );

        if (keywordResult) {
          latitude =
            keywordResult.latitude;

          longitude =
            keywordResult.longitude;

          keywordSuccessCount += 1;

          console.log(
            "좌표 자동 보완 성공:",
            {
              name:
                valley.name,

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
        }
      }

      /*
       * 둘 다 실패
       */
      if (
        latitude === null ||
        longitude === null
      ) {
        failedCount += 1;

        failedNames.push(
          valley.name
        );

        continue;
      }

      /*
       * 5. DB 좌표 업데이트
       */
      const {
        error: updateError,
      } =
        await supabase
          .from("valleys")
          .update({
            latitude,
            longitude,
          })
          .eq(
            "id",
            valley.id
          );

      if (updateError) {
        updateFailedCount += 1;

        failedNames.push(
          valley.name
        );

        console.error(
          "좌표 DB 업데이트 실패:",
          {
            name:
              valley.name,
            error:
              updateError,
          }
        );
      }
    } catch (error) {
      failedCount += 1;

      failedNames.push(
        valley.name
      );

      console.error(
        `좌표 자동 보완 실패: ${valley.name}`,
        error
      );
    }
  }

  /*
   * 6. 결과 메시지
   */
  let message =
    `좌표 자동 보완 완료`;

  message +=
    ` / 주소좌표 ${addressSuccessCount}개`;

  message +=
    ` / 계곡명좌표 ${keywordSuccessCount}개`;

  if (failedCount > 0) {
    message +=
      ` / 검색 실패 ${failedCount}개`;
  }

  if (
    updateFailedCount > 0
  ) {
    message +=
      ` / DB 저장 실패 ${updateFailedCount}개`;
  }

  if (
    failedNames.length > 0
  ) {
    message +=
      ` / 확인 필요: ${failedNames
        .slice(0, 5)
        .join(", ")}`;

    if (
      failedNames.length >
      5
    ) {
      message +=
        ` 외 ${failedNames.length - 5}개`;
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