"use client";

import {
  AlertCircle,
  Car,
  Clock3,
  Info,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type DrivingPlace = {
  id: string | number;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

type CourseDrivingSummaryProps = {
  places: DrivingPlace[];
};

type DrivingLegSuccess = {
  status: "success";

  fromId: string | number;
  toId: string | number;

  fromName: string;
  toName: string;

  distanceMeters: number;
  durationSeconds: number;

  distanceText: string;
  durationText: string;
};

type DrivingLegError = {
  status: "error";

  fromId: string | number;
  toId: string | number;

  fromName: string;
  toName: string;

  errorMessage: string;
};

type DrivingLeg =
  | DrivingLegSuccess
  | DrivingLegError;

type DrivingApiResponse = {
  distanceMeters?: number;
  durationSeconds?: number;
  distanceText?: string;
  durationText?: string;
  error?: string;
};

function formatTotalDistance(
  meters: number
) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }

  const km =
    meters / 1000;

  if (km < 10) {
    return `${km.toFixed(1)}km`;
  }

  return `${Math.round(km)}km`;
}

function formatTotalDuration(
  seconds: number
) {
  const totalMinutes =
    Math.max(
      0,
      Math.round(
        seconds / 60
      )
    );

  if (totalMinutes < 60) {
    return `약 ${totalMinutes}분`;
  }

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  if (minutes === 0) {
    return `약 ${hours}시간`;
  }

  return `약 ${hours}시간 ${minutes}분`;
}

export default function CourseDrivingSummary({
  places,
}: CourseDrivingSummaryProps) {
  const [
    legs,
    setLegs,
  ] =
    useState<
      DrivingLeg[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const validPlaces =
    useMemo(
      () =>
        places.filter(
          (
            place
          ) =>
            typeof place.latitude ===
              "number" &&
            Number.isFinite(
              place.latitude
            ) &&
            typeof place.longitude ===
              "number" &&
            Number.isFinite(
              place.longitude
            )
        ),
      [places]
    );

  useEffect(() => {
    if (
      validPlaces.length <
      2
    ) {
      setLegs([]);
      setLoading(false);
      return;
    }

    let cancelled =
      false;

    async function loadRoutes() {
      setLoading(true);
      setLegs([]);

      const requests:
        Promise<DrivingLeg>[] =
        [];

      for (
        let index = 0;
        index <
        validPlaces.length -
          1;
        index += 1
      ) {
        const from =
          validPlaces[index];

        const to =
          validPlaces[
            index + 1
          ];

        requests.push(
          (async () => {
            try {
              const params =
                new URLSearchParams({
                  originLng:
                    String(
                      from.longitude
                    ),

                  originLat:
                    String(
                      from.latitude
                    ),

                  destinationLng:
                    String(
                      to.longitude
                    ),

                  destinationLat:
                    String(
                      to.latitude
                    ),
                });

              const response =
                await fetch(
                  `/api/routes/driving?${params.toString()}`,
                  {
                    method:
                      "GET",

                    cache:
                      "no-store",
                  }
                );

              const data =
                (
                  await response.json()
                ) as DrivingApiResponse;

              if (
                !response.ok ||
                typeof data.distanceMeters !==
                  "number" ||
                typeof data.durationSeconds !==
                  "number" ||
                !data.distanceText ||
                !data.durationText
              ) {
                return {
                  status:
                    "error" as const,

                  fromId:
                    from.id,

                  toId:
                    to.id,

                  fromName:
                    from.name,

                  toName:
                    to.name,

                  errorMessage:
                    data.error ||
                    "자동차 경로를 확인할 수 없습니다.",
                };
              }

              return {
                status:
                  "success" as const,

                fromId:
                  from.id,

                toId:
                  to.id,

                fromName:
                  from.name,

                toName:
                  to.name,

                distanceMeters:
                  data.distanceMeters,

                durationSeconds:
                  data.durationSeconds,

                distanceText:
                  data.distanceText,

                durationText:
                  data.durationText,
              };
            } catch {
              return {
                status:
                  "error" as const,

                fromId:
                  from.id,

                toId:
                  to.id,

                fromName:
                  from.name,

                toName:
                  to.name,

                errorMessage:
                  "자동차 경로를 확인할 수 없습니다.",
              };
            }
          })()
        );
      }

      const results =
        await Promise.all(
          requests
        );

      if (
        cancelled
      ) {
        return;
      }

      setLegs(results);
      setLoading(false);
    }

    loadRoutes();

    return () => {
      cancelled =
        true;
    };
  }, [validPlaces]);

  const successfulLegs =
    useMemo(
      () =>
        legs.filter(
          (
            leg
          ): leg is DrivingLegSuccess =>
            leg.status ===
            "success"
        ),
      [legs]
    );

  const failedLegCount =
    legs.filter(
      (
        leg
      ) =>
        leg.status ===
        "error"
    ).length;

  const totals =
    useMemo(
      () =>
        successfulLegs.reduce(
          (
            total,
            leg
          ) => ({
            distanceMeters:
              total.distanceMeters +
              leg.distanceMeters,

            durationSeconds:
              total.durationSeconds +
              leg.durationSeconds,
          }),
          {
            distanceMeters:
              0,

            durationSeconds:
              0,
          }
        ),
      [successfulLegs]
    );

  if (
    validPlaces.length <
    2
  ) {
    return null;
  }

  return (
    <section className="course-driving-card">
      <div className="course-driving-card-heading">
        <div>
          <span>
            자동차 이동 기준
          </span>

          <h2>
            코스 이동거리와 예상시간
          </h2>

          <p>
            실제 도로 기준으로 각 장소 사이의 이동거리와 예상시간을 확인할 수 있습니다.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="course-driving-state">
          <Car size={20} />

          <div>
            <strong>
              이동경로를 계산하고 있어요
            </strong>

            <span>
              잠시만 기다려주세요.
            </span>
          </div>
        </div>
      ) : (
        <>
          {successfulLegs.length >
            0 && (
            <div className="course-driving-summary-grid">
              <div className="course-driving-summary-box">
                <span className="course-driving-summary-icon">
                  <Car
                    size={25}
                  />
                </span>

                <div>
                  <small>
                    {failedLegCount >
                    0
                      ? "확인된 이동거리"
                      : "총 이동거리"}
                  </small>

                  <strong>
                    {formatTotalDistance(
                      totals.distanceMeters
                    )}
                  </strong>
                </div>
              </div>

              <div className="course-driving-summary-box">
                <span className="course-driving-summary-icon">
                  <Clock3
                    size={25}
                  />
                </span>

                <div>
                  <small>
                    {failedLegCount >
                    0
                      ? "확인된 이동시간"
                      : "예상 이동시간"}
                  </small>

                  <strong>
                    {formatTotalDuration(
                      totals.durationSeconds
                    )}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="course-driving-route-list">
            {legs.map(
              (
                leg,
                index
              ) => (
                <div
                  key={`${leg.fromId}-${leg.toId}`}
                  className="course-driving-route-row"
                >
                  <div className="course-driving-route-step">
                    <span>
                      {index + 1}
                    </span>

                    {index <
                      legs.length -
                        1 && (
                      <i />
                    )}
                  </div>

                  <div
                    className={[
                      "course-driving-route-box",

                      leg.status ===
                      "error"
                        ? "course-driving-route-box-error"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="course-driving-route-names">
                      <strong>
                        {
                          leg.fromName
                        }
                      </strong>

                      <span>
                        →
                      </span>

                      <strong>
                        {
                          leg.toName
                        }
                      </strong>
                    </div>

                    {leg.status ===
                    "success" ? (
                      <div className="course-driving-route-data">
                        <span>
                          <Car
                            size={15}
                          />

                          {
                            leg.distanceText
                          }
                        </span>

                        <span>
                          <Clock3
                            size={15}
                          />

                          {
                            leg.durationText
                          }
                        </span>
                      </div>
                    ) : (
                      <div className="course-driving-route-warning">
                        <AlertCircle
                          size={15}
                        />

                        <span>
                          차량 경로 확인 필요
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <div
            className={[
              "course-driving-info",

              failedLegCount >
              0
                ? "course-driving-info-warning"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Info
              size={17}
            />

            <span>
              {failedLegCount >
                0
                ? `일부 구간(${failedLegCount}개)은 자동차 경로를 확인할 수 없습니다. 표시된 합계는 확인 가능한 구간 기준입니다.`
                : "예상시간은 교통상황에 따라 달라질 수 있습니다."}
            </span>
          </div>
        </>
      )}
    </section>
  );
}