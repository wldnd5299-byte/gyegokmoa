import {
  NextRequest,
  NextResponse,
} from "next/server";

type RoutePoint = {
  latitude: number;
  longitude: number;
};

type DrivingRouteResponse = {
  distanceMeters: number;
  durationSeconds: number;

  distanceText: string;
  durationText: string;

  /*
   * 실제 도로 경로 좌표
   */
  path: RoutePoint[];
};

function parseCoordinate(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return null;
  }

  return number;
}

function formatDistance(
  meters: number
) {
  if (
    meters < 1000
  ) {
    return `${Math.round(
      meters
    )}m`;
  }

  const kilometers =
    meters / 1000;

  if (
    kilometers < 10
  ) {
    return `${kilometers.toFixed(
      1
    )}km`;
  }

  return `${Math.round(
    kilometers
  )}km`;
}

function formatDuration(
  seconds: number
) {
  const totalMinutes =
    Math.max(
      1,
      Math.round(
        seconds / 60
      )
    );

  if (
    totalMinutes < 60
  ) {
    return `약 ${totalMinutes}분`;
  }

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  if (
    minutes === 0
  ) {
    return `약 ${hours}시간`;
  }

  return `약 ${hours}시간 ${minutes}분`;
}

/*
 * 카카오 길찾기 응답에서
 * 실제 도로 좌표를 꺼냅니다.
 *
 * vertexes:
 * [경도, 위도, 경도, 위도 ...]
 */
function extractRoutePath(
  route: any
): RoutePoint[] {
  const path:
    RoutePoint[] = [];

  const sections =
    Array.isArray(
      route?.sections
    )
      ? route.sections
      : [];

  for (
    const section of sections
  ) {
    const roads =
      Array.isArray(
        section?.roads
      )
        ? section.roads
        : [];

    for (
      const road of roads
    ) {
      const vertexes =
        Array.isArray(
          road?.vertexes
        )
          ? road.vertexes
          : [];

      for (
        let index = 0;
        index <
        vertexes.length -
          1;
        index += 2
      ) {
        const longitude =
          Number(
            vertexes[
              index
            ]
          );

        const latitude =
          Number(
            vertexes[
              index + 1
            ]
          );

        if (
          !Number.isFinite(
            latitude
          ) ||
          !Number.isFinite(
            longitude
          )
        ) {
          continue;
        }

        const previous =
          path[
            path.length - 1
          ];

        /*
         * 도로 구간 경계에서
         * 같은 좌표가 반복되는 경우 제거
         */
        if (
          previous &&
          previous.latitude ===
            latitude &&
          previous.longitude ===
            longitude
        ) {
          continue;
        }

        path.push({
          latitude,
          longitude,
        });
      }
    }
  }

  return path;
}

export async function GET(
  request: NextRequest
) {
  const kakaoRestApiKey =
    process.env
      .KAKAO_REST_API_KEY;

  if (
    !kakaoRestApiKey
  ) {
    return NextResponse.json(
      {
        error:
          "KAKAO_REST_API_KEY가 설정되지 않았습니다.",
      },
      {
        status: 500,
      }
    );
  }

  const {
    searchParams,
  } =
    request.nextUrl;

  /*
   * 카카오는
   * 경도, 위도 순서입니다.
   */
  const originLng =
    parseCoordinate(
      searchParams.get(
        "originLng"
      )
    );

  const originLat =
    parseCoordinate(
      searchParams.get(
        "originLat"
      )
    );

  const destinationLng =
    parseCoordinate(
      searchParams.get(
        "destinationLng"
      )
    );

  const destinationLat =
    parseCoordinate(
      searchParams.get(
        "destinationLat"
      )
    );

  if (
    originLng === null ||
    originLat === null ||
    destinationLng ===
      null ||
    destinationLat ===
      null
  ) {
    return NextResponse.json(
      {
        error:
          "출발지와 도착지의 경도·위도가 필요합니다.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * 좌표 유효 범위
   */
  if (
    originLat < -90 ||
    originLat > 90 ||
    destinationLat <
      -90 ||
    destinationLat >
      90 ||
    originLng < -180 ||
    originLng > 180 ||
    destinationLng <
      -180 ||
    destinationLng >
      180
  ) {
    return NextResponse.json(
      {
        error:
          "좌표 값이 올바르지 않습니다.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * 같은 위치
   */
  if (
    originLng ===
      destinationLng &&
    originLat ===
      destinationLat
  ) {
    const response:
      DrivingRouteResponse =
      {
        distanceMeters:
          0,

        durationSeconds:
          0,

        distanceText:
          "0m",

        durationText:
          "0분",

        path: [
          {
            latitude:
              originLat,

            longitude:
              originLng,
          },
        ],
      };

    return NextResponse.json(
      response
    );
  }

  const kakaoUrl =
    new URL(
      "https://apis-navi.kakaomobility.com/v1/directions"
    );

  kakaoUrl.searchParams.set(
    "origin",
    `${originLng},${originLat}`
  );

  kakaoUrl.searchParams.set(
    "destination",
    `${destinationLng},${destinationLat}`
  );

  /*
   * 추천 경로
   */
  kakaoUrl.searchParams.set(
    "priority",
    "RECOMMEND"
  );

  /*
   * 대안 경로 불필요
   */
  kakaoUrl.searchParams.set(
    "alternatives",
    "false"
  );

  /*
   * 중요:
   *
   * 실제 도로 좌표를 받으려면
   * summary=true가 아니라
   * 전체 경로정보를 받아야 합니다.
   */
  kakaoUrl.searchParams.set(
    "summary",
    "false"
  );

  try {
    const response =
      await fetch(
        kakaoUrl.toString(),
        {
          method:
            "GET",

          headers: {
            Authorization:
              `KakaoAK ${kakaoRestApiKey}`,

            "Content-Type":
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {
      console.error(
        "카카오 길찾기 API 오류:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.msg ||
            data?.message ||
            "카카오 길찾기 요청에 실패했습니다.",

          code:
            data?.code ??
            null,
        },
        {
          status:
            response.status,
        }
      );
    }

    const route =
      data?.routes?.[0];

    const summary =
      route?.summary;

    if (
      !route ||
      !summary
    ) {
      return NextResponse.json(
        {
          error:
            "길찾기 결과를 찾을 수 없습니다.",
        },
        {
          status: 404,
        }
      );
    }

    const distanceMeters =
      Number(
        summary.distance
      );

    const durationSeconds =
      Number(
        summary.duration
      );

    if (
      !Number.isFinite(
        distanceMeters
      ) ||
      !Number.isFinite(
        durationSeconds
      )
    ) {
      return NextResponse.json(
        {
          error:
            "길찾기 응답의 거리 또는 시간을 확인할 수 없습니다.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * 실제 도로 경로 좌표
     */
    const path =
      extractRoutePath(
        route
      );

    /*
     * 아주 예외적으로
     * 도로 좌표가 없을 경우에도
     * 최소 출발/도착점은 반환
     */
    const safePath =
      path.length >= 2
        ? path
        : [
            {
              latitude:
                originLat,

              longitude:
                originLng,
            },

            {
              latitude:
                destinationLat,

              longitude:
                destinationLng,
            },
          ];

    const result:
      DrivingRouteResponse =
      {
        distanceMeters,

        durationSeconds,

        distanceText:
          formatDistance(
            distanceMeters
          ),

        durationText:
          formatDuration(
            durationSeconds
          ),

        path:
          safePath,
      };

    return NextResponse.json(
      result
    );
  } catch (
    error
  ) {
    console.error(
      "카카오 길찾기 서버 요청 실패:",
      error
    );

    return NextResponse.json(
      {
        error:
          "길찾기 정보를 불러오는 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}