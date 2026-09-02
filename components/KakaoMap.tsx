"use client";

import Script from "next/script";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Crosshair,
  RotateCcw,
} from "lucide-react";

export type MapPlaceType =
  | "attraction"
  | "restaurant"
  | "cafe"
  | "accommodation";

export interface MapPlace {
  id: string | number;

  name: string;
  slug: string;

  place_type: MapPlaceType;

  latitude: number;
  longitude: number;
}

export interface MapFocusLocation {
  key: string;

  address?: string;

  latitude?: number;
  longitude?: number;

  level?: number;
}

interface CourseRoutePoint {
  latitude: number;
  longitude: number;
}

interface KakaoMapProps {
  places: MapPlace[];

  selectedPlaceId?:
    | string
    | number
    | null;

  onSelectPlace?: (
    placeId:
      | string
      | number
  ) => void;

  focusLocation?:
    | MapFocusLocation
    | null;

  onCurrentLocation?: (
    location: {
      latitude: number;
      longitude: number;
    }
  ) => void;

  /*
   * 추천코스 지도에서만 true
   *
   * 일반 /map에서는
   * 전달하지 않으므로
   * 기존 장소 마커 그대로 사용
   */
  courseMode?: boolean;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const TYPE_LABELS: Record<
  MapPlaceType,
  string
> = {
  attraction:
    "가볼만한 곳",

  restaurant:
    "맛집",

  cafe:
    "카페",

  accommodation:
    "숙소",
};

const TYPE_COLORS: Record<
  MapPlaceType,
  string
> = {
  attraction:
    "#3f725d",

  restaurant:
    "#c87548",

  cafe:
    "#8b674f",

  accommodation:
    "#557b91",
};

function getMarkerIconSvg(
  type: MapPlaceType
) {
  const common =
    `width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;

  switch (type) {
    case "restaurant":
      return `
        <svg ${common} aria-hidden="true">
          <path d="M3 2v7c0 1.7 1.3 3 3 3V2" />
          <path d="M6 12v10" />
          <path d="M15 2v8" />
          <path d="M15 6c3 0 5-1.8 5-4v20" />
        </svg>
      `;

    case "cafe":
      return `
        <svg ${common} aria-hidden="true">
          <path d="M3 8h13v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <path d="M16 10h2a3 3 0 0 1 0 6h-2" />
          <path d="M6 2v2" />
          <path d="M10 2v2" />
          <path d="M14 2v2" />
        </svg>
      `;

    case "accommodation":
      return `
        <svg ${common} aria-hidden="true">
          <path d="M3 11h18v8H3z" />
          <path d="M5 11V7h6a3 3 0 0 1 3 3v1" />
          <path d="M3 19v2" />
          <path d="M21 19v2" />
        </svg>
      `;

    case "attraction":
    default:
      return `
        <svg ${common} aria-hidden="true">
          <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      `;
  }
}

export default function KakaoMap({
  places,

  selectedPlaceId = null,

  onSelectPlace,

  focusLocation = null,

  onCurrentLocation,

  courseMode = false,
}: KakaoMapProps) {
  const mapContainer =
    useRef<HTMLDivElement>(
      null
    );

  const mapRef =
    useRef<any>(
      null
    );

  /*
   * 장소 CustomOverlay
   */
  const overlaysRef =
    useRef<any[]>(
      []
    );

  /*
   * 추천코스 실제 도로 경로선
   */
  const courseLinesRef =
    useRef<any[]>(
      []
    );

  /*
   * 현재 위치
   */
  const currentMarkerRef =
    useRef<any>(
      null
    );

  const currentInfoWindowRef =
    useRef<any>(
      null
    );

  const initializedRef =
    useRef(
      false
    );

  /*
   * 일반 장소 지도에서 장소 선택만으로
   * 사용자가 보고 있던 지도 위치/확대 수준이
   * 바뀌지 않도록 마지막 장소 구성을 기억합니다.
   */
  const lastPlacesSignatureRef =
    useRef("");

  const [
    mapError,
    setMapError,
  ] = useState("");

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(
    false
  );

  const [
    courseRoutePaths,
    setCourseRoutePaths,
  ] = useState<CourseRoutePoint[][]>([]);

  const kakaoKey =
    process.env
      .NEXT_PUBLIC_KAKAO_MAP_KEY;

  /*
   * 장소 마커 +
   * 코스 연결선 제거
   */
  const clearPlaceMarkers =
    useCallback(() => {
      overlaysRef.current.forEach(
        (
          overlay
        ) => {
          overlay.setMap(
            null
          );
        }
      );

      overlaysRef.current =
        [];

      courseLinesRef.current.forEach(
        (line) => {
          line.setMap(null);
        }
      );

      courseLinesRef.current = [];
    }, []);

  /*
   * 현재 위치 마커 제거
   */
  const clearCurrentLocation =
    useCallback(() => {
      if (
        currentInfoWindowRef.current
      ) {
        currentInfoWindowRef.current.close();

        currentInfoWindowRef.current =
          null;
      }

      if (
        currentMarkerRef.current
      ) {
        currentMarkerRef.current.setMap(
          null
        );

        currentMarkerRef.current =
          null;
      }
    }, []);

  /*
   * 추천코스 실제 자동차 도로 경로 불러오기
   */
  useEffect(() => {
    if (
      !courseMode ||
      places.length < 2
    ) {
      setCourseRoutePaths([]);
      return;
    }

    let cancelled = false;

    async function loadCourseRoutes() {
      try {
        const requests = [];

        for (
          let index = 0;
          index < places.length - 1;
          index += 1
        ) {
          const from = places[index];
          const to = places[index + 1];

          const params = new URLSearchParams({
            originLng: String(from.longitude),
            originLat: String(from.latitude),
            destinationLng: String(to.longitude),
            destinationLat: String(to.latitude),
          });

          requests.push(
            fetch(
              `/api/routes/driving?${params.toString()}`,
              { cache: "no-store" }
            ).then(async (response) => {
              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data?.error ||
                    `${from.name} → ${to.name} 경로를 불러오지 못했습니다.`
                );
              }

              const path = Array.isArray(data?.path)
                ? data.path.filter(
                    (point: any) =>
                      typeof point?.latitude === "number" &&
                      typeof point?.longitude === "number"
                  )
                : [];

              return path as CourseRoutePoint[];
            })
          );
        }

        const paths = await Promise.all(requests);

        if (!cancelled) {
          setCourseRoutePaths(paths);
        }
      } catch (error) {
        console.error(
          "추천코스 실제 도로 경로 불러오기 실패:",
          error
        );

        if (!cancelled) {
          setCourseRoutePaths([]);
        }
      }
    }

    loadCourseRoutes();

    return () => {
      cancelled = true;
    };
  }, [courseMode, places]);

  /*
   * 장소 마커 그리기
   */
  const renderPlaceMarkers =
    useCallback(
      (
        map: any
      ) => {
        if (
          !window.kakao
            ?.maps
        ) {
          return;
        }

        clearPlaceMarkers();

        if (
          places.length ===
          0
        ) {
          return;
        }

        const bounds =
          new window.kakao.maps
            .LatLngBounds();

        /*
         * 코스 모드에서는 카카오 길찾기 API가 반환한
         * 실제 자동차 도로 경로를 구간별로 그립니다.
         */
        if (
          courseMode &&
          courseRoutePaths.length > 0
        ) {
          courseRoutePaths.forEach((routePath) => {
            if (routePath.length < 2) {
              return;
            }

            const polylinePath = routePath.map(
              (point) =>
                new window.kakao.maps.LatLng(
                  point.latitude,
                  point.longitude
                )
            );

            const routeLine =
              new window.kakao.maps.Polyline({
                path: polylinePath,
                strokeWeight: 5,
                strokeColor: "#2f6956",
                strokeOpacity: 0.86,
                strokeStyle: "solid",
              });

            routeLine.setMap(map);
            courseLinesRef.current.push(routeLine);
          });
        }

        places.forEach(
          (
            place,
            index
          ) => {
            const position =
              new window.kakao.maps.LatLng(
                place.latitude,
                place.longitude
              );

            bounds.extend(
              position
            );

            const color =
              TYPE_COLORS[
                place.place_type
              ];

            const isSelected =
              selectedPlaceId !==
                null &&
              String(
                place.id
              ) ===
                String(
                  selectedPlaceId
                );

            const markerContent =
              document.createElement(
                "button"
              );

            markerContent.type =
              "button";

            markerContent.setAttribute(
              "aria-label",
              courseMode
                ? `${index + 1}번 ${place.name}`
                : `${place.name} 선택`
            );

            /*
             * 공통 마커 형태
             */
            markerContent.style.cssText = `
              width: ${
                courseMode
                  ? isSelected
                    ? 44
                    : 40
                  : isSelected
                    ? 34
                    : 28
              }px;

              height: ${
                courseMode
                  ? isSelected
                    ? 44
                    : 40
                  : isSelected
                    ? 34
                    : 28
              }px;

              display: flex;
              align-items: center;
              justify-content: center;

              padding: 0;

              border: ${
                courseMode
                  ? isSelected
                    ? 4
                    : 3
                  : isSelected
                    ? 3
                    : 2
              }px solid #ffffff;

              border-radius:
                ${
                  courseMode
                    ? "50%"
                    : "50% 50% 50% 0"
                };

              background:
                ${color};

              box-shadow:
                0 ${
                  isSelected
                    ? 6
                    : 3
                }px
                ${
                  isSelected
                    ? 18
                    : 10
                }px
                rgba(
                  0,
                  0,
                  0,
                  ${
                    isSelected
                      ? 0.30
                      : 0.22
                  }
                );

              transform:
                ${
                  courseMode
                    ? "none"
                    : "rotate(-45deg)"
                };

              cursor: pointer;

              transition:
                width .15s ease,
                height .15s ease,
                box-shadow .15s ease;
            `;

            /*
             * 추천코스:
             * 숫자 마커
             *
             * 일반 지도:
             * 기존 장소 아이콘
             */
            if (
              courseMode
            ) {
              markerContent.textContent =
                String(
                  index + 1
                );

              markerContent.style.fontSize =
                isSelected
                  ? "16px"
                  : "14px";

              markerContent.style.fontWeight =
                "900";

              markerContent.style.color =
                "#ffffff";

              markerContent.style.lineHeight =
                "1";
            } else {
              markerContent.innerHTML =
                getMarkerIconSvg(
                  place.place_type
                );

              const markerSvg =
                markerContent.querySelector(
                  "svg"
                );

              if (
                markerSvg
              ) {
                markerSvg.setAttribute(
                  "width",
                  isSelected
                    ? "16"
                    : "14"
                );

                markerSvg.setAttribute(
                  "height",
                  isSelected
                    ? "16"
                    : "14"
                );
              }
            }

            const markerOverlay =
              new window.kakao.maps
                .CustomOverlay(
                  {
                    position,

                    content:
                      markerContent,

                    yAnchor:
                      courseMode
                        ? 0.5
                        : 1,

                    zIndex:
                      isSelected
                        ? 8
                        : 5,
                  }
                );

            markerOverlay.setMap(
              map
            );

            overlaysRef.current.push(
              markerOverlay
            );

            /*
             * 마커 hover 안내
             */
            const infoContent =
              document.createElement(
                "div"
              );

            infoContent.style.cssText = `
              min-width: 120px;

              padding: 9px 12px;

              border:
                1px solid
                rgba(
                  0,
                  0,
                  0,
                  0.08
                );

              border-radius: 10px;

              background:
                #ffffff;

              box-shadow:
                0 5px 18px
                rgba(
                  0,
                  0,
                  0,
                  0.13
                );

              text-align: center;

              white-space:
                nowrap;

              pointer-events:
                none;
            `;

            const typeText =
              document.createElement(
                "span"
              );

            typeText.textContent =
              courseMode
                ? `${index + 1}번째 · ${
                    TYPE_LABELS[
                      place.place_type
                    ]
                  }`
                : TYPE_LABELS[
                    place.place_type
                  ];

            typeText.style.cssText = `
              display: block;

              margin-bottom:
                3px;

              color:
                ${color};

              font-size:
                10px;

              font-weight:
                800;
            `;

            const nameText =
              document.createElement(
                "strong"
              );

            nameText.textContent =
              place.name;

            nameText.style.cssText = `
              display: block;

              color:
                #24352e;

              font-size:
                13px;

              font-weight:
                800;
            `;

            infoContent.appendChild(
              typeText
            );

            infoContent.appendChild(
              nameText
            );

            const infoOverlay =
              new window.kakao.maps
                .CustomOverlay(
                  {
                    position,

                    content:
                      infoContent,

                    yAnchor:
                      courseMode
                        ? 1.35
                        : isSelected
                          ? 2.35
                          : 2.15,

                    zIndex:
                      20,
                  }
                );

            markerContent.addEventListener(
              "mouseenter",
              () => {
                infoOverlay.setMap(
                  map
                );
              }
            );

            markerContent.addEventListener(
              "mouseleave",
              () => {
                infoOverlay.setMap(
                  null
                );
              }
            );

            markerContent.addEventListener(
              "click",
              () => {
                onSelectPlace?.(
                  place.id
                );

                /*
                 * 일반 장소 지도에서는 마커를 눌러도
                 * 현재 지도 중심/확대 수준을 그대로 유지합니다.
                 * 추천코스 지도만 기존 동작을 유지합니다.
                 */
                if (courseMode) {
                  map.panTo(
                    position
                  );

                  if (
                    map.getLevel() >
                    6
                  ) {
                    map.setLevel(
                      5
                    );
                  }
                }
              }
            );
          }
        );

        /*
         * 일반 장소 지도에서는 장소 목록 자체가 바뀔 때만
         * 전체 장소가 보이도록 지도를 맞춥니다.
         * 마커 선택(selectedPlaceId 변경)만으로는
         * 지도 중심이나 확대 수준을 바꾸지 않습니다.
         */
        const placesSignature =
          places
            .map(
              (place) =>
                `${place.id}:${place.latitude}:${place.longitude}`
            )
            .join("|");

        const shouldFitPlaces =
          courseMode ||
          lastPlacesSignatureRef.current !==
            placesSignature;

        if (!courseMode) {
          lastPlacesSignatureRef.current =
            placesSignature;
        }

        if (!shouldFitPlaces) {
          return;
        }

        /*
         * 장소가 2개 이상이면
         * 전체가 보이도록
         */
        if (
          places.length >=
          2
        ) {
          map.setBounds(
            bounds
          );

          return;
        }

        /*
         * 한 곳만 있을 때
         */
        if (
          places.length ===
          1
        ) {
          map.setCenter(
            new window.kakao.maps.LatLng(
              places[0]
                .latitude,

              places[0]
                .longitude
            )
          );

          map.setLevel(
            6
          );
        }
      },
      [
        places,
        selectedPlaceId,
        onSelectPlace,
        clearPlaceMarkers,
        courseMode,
        courseRoutePaths,
      ]
    );

  /*
   * 전체 보기
   */
  const showAllPlaces =
    useCallback(() => {
      if (
        !mapRef.current ||
        !window.kakao
          ?.maps
      ) {
        return;
      }

      clearCurrentLocation();

      if (
        places.length ===
        0
      ) {
        mapRef.current.setCenter(
          new window.kakao.maps.LatLng(
            36.5,
            127.8
          )
        );

        mapRef.current.setLevel(
          13
        );

        return;
      }

      if (
        places.length ===
        1
      ) {
        mapRef.current.setCenter(
          new window.kakao.maps.LatLng(
            places[0]
              .latitude,

            places[0]
              .longitude
          )
        );

        mapRef.current.setLevel(
          6
        );

        return;
      }

      const bounds =
        new window.kakao.maps
          .LatLngBounds();

      places.forEach(
        (
          place
        ) => {
          bounds.extend(
            new window.kakao.maps.LatLng(
              place.latitude,
              place.longitude
            )
          );
        }
      );

      mapRef.current.setBounds(
        bounds
      );
    }, [
      places,
      clearCurrentLocation,
    ]);

  /*
   * 지도 생성
   */
  const initializeMap =
    useCallback(() => {
      if (
        !window.kakao
          ?.maps ||
        !mapContainer.current
      ) {
        return;
      }

      window.kakao.maps.load(
        () => {
          try {
            if (
              !mapContainer.current
            ) {
              return;
            }

            setMapError("");

            /*
             * 이미 초기화되었으면
             * 지도 다시 생성하지 않음
             */
            if (
              initializedRef.current &&
              mapRef.current
            ) {
              mapRef.current.relayout();

              renderPlaceMarkers(
                mapRef.current
              );

              return;
            }

            const centerLat =
              typeof focusLocation
                ?.latitude ===
              "number"
                ? focusLocation.latitude
                : places.length >
                    0
                  ? places[0]
                      .latitude
                  : 36.5;

            const centerLng =
              typeof focusLocation
                ?.longitude ===
              "number"
                ? focusLocation.longitude
                : places.length >
                    0
                  ? places[0]
                      .longitude
                  : 127.8;

            const map =
              new window.kakao.maps.Map(
                mapContainer.current,
                {
                  center:
                    new window.kakao.maps.LatLng(
                      centerLat,
                      centerLng
                    ),

                  level:
                    focusLocation
                      ?.level ??
                    (places.length >
                    0
                      ? 8
                      : 13),
                }
              );

            mapRef.current =
              map;

            initializedRef.current =
              true;

            /*
             * 확대/축소 컨트롤
             */
            const zoomControl =
              new window.kakao.maps.ZoomControl();

            map.addControl(
              zoomControl,

              window.kakao.maps
                .ControlPosition
                .RIGHT
            );

            /*
             * 지도 타입 컨트롤
             */
            const mapTypeControl =
              new window.kakao.maps.MapTypeControl();

            map.addControl(
              mapTypeControl,

              window.kakao.maps
                .ControlPosition
                .TOPRIGHT
            );

            renderPlaceMarkers(
              map
            );

            setTimeout(
              () => {
                map.relayout();
              },
              100
            );
          } catch (
            error
          ) {
            console.error(
              "카카오 지도 생성 실패:",
              error
            );

            setMapError(
              "카카오 지도를 생성하지 못했습니다."
            );
          }
        }
      );
    }, [
      places,
      renderPlaceMarkers,
      focusLocation,
    ]);

  /*
   * Kakao SDK 준비된 경우
   */
  useEffect(() => {
    if (
      window.kakao
        ?.maps
    ) {
      initializeMap();
    }
  }, [
    initializeMap,
  ]);

  /*
   * 지역 검색 후
   * 해당 지역으로 이동
   */
  useEffect(() => {
    if (
      !focusLocation ||
      !mapRef.current ||
      !window.kakao
        ?.maps
    ) {
      return;
    }

    const moveMap = (
      latitude: number,
      longitude: number
    ) => {
      const position =
        new window.kakao.maps.LatLng(
          latitude,
          longitude
        );

      mapRef.current.panTo(
        position
      );

      mapRef.current.setLevel(
        focusLocation.level ??
          7
      );
    };

    if (
      focusLocation.address &&
      window.kakao.maps
        .services
        ?.Geocoder
    ) {
      const geocoder =
        new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(
        focusLocation.address,

        (
          result: any[],
          status: any
        ) => {
          if (
            status ===
              window.kakao.maps
                .services
                .Status.OK &&
            result.length >
              0
          ) {
            moveMap(
              Number(
                result[0].y
              ),

              Number(
                result[0].x
              )
            );

            return;
          }

          /*
           * 주소검색 실패 시
           * 대표 좌표 이용
           */
          if (
            typeof focusLocation
              .latitude ===
              "number" &&
            typeof focusLocation
              .longitude ===
              "number"
          ) {
            moveMap(
              focusLocation.latitude,

              focusLocation.longitude
            );
          }
        }
      );

      return;
    }

    if (
      typeof focusLocation
        .latitude ===
        "number" &&
      typeof focusLocation
        .longitude ===
        "number"
    ) {
      moveMap(
        focusLocation.latitude,

        focusLocation.longitude
      );
    }
  }, [
    focusLocation?.key,
    focusLocation?.address,
    focusLocation?.latitude,
    focusLocation?.longitude,
    focusLocation?.level,
  ]);

  /*
   * 화면 크기 변경
   */
  useEffect(() => {
    const handleResize =
      () => {
        if (
          mapRef.current
        ) {
          mapRef.current.relayout();
        }
      };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  /*
   * 현재 위치 이동
   */
  const moveToCurrentLocation =
    () => {
      if (
        !mapRef.current
      ) {
        return;
      }

      if (
        !navigator.geolocation
      ) {
        alert(
          "현재 위치 기능을 지원하지 않는 브라우저입니다."
        );

        return;
      }

      setLocationLoading(
        true
      );

      navigator.geolocation.getCurrentPosition(
        (
          position
        ) => {
          const latitude =
            position.coords
              .latitude;

          const longitude =
            position.coords
              .longitude;

          onCurrentLocation?.({
            latitude,
            longitude,
          });

          const currentPosition =
            new window.kakao.maps.LatLng(
              latitude,
              longitude
            );

          clearCurrentLocation();

          const currentMarker =
            new window.kakao.maps.Marker(
              {
                position:
                  currentPosition,

                map:
                  mapRef.current,

                title:
                  "현재 위치",
              }
            );

          currentMarkerRef.current =
            currentMarker;

          const currentInfoWindow =
            new window.kakao.maps.InfoWindow(
              {
                content: `
                  <div
                    style="
                      padding: 9px 12px;
                      font-size: 13px;
                      font-weight: 700;
                      color: #222;
                      white-space: nowrap;
                    "
                  >
                    현재 위치
                  </div>
                `,
              }
            );

          currentInfoWindowRef.current =
            currentInfoWindow;

          currentInfoWindow.open(
            mapRef.current,
            currentMarker
          );

          mapRef.current.panTo(
            currentPosition
          );

          mapRef.current.setLevel(
            5
          );

          setLocationLoading(
            false
          );
        },

        (
          error
        ) => {
          console.error(
            "현재 위치 확인 실패:",
            error
          );

          setLocationLoading(
            false
          );

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            alert(
              "현재 위치를 확인하려면 브라우저의 위치 권한을 허용해 주세요."
            );
          } else {
            alert(
              "현재 위치를 확인할 수 없습니다."
            );
          }
        },

        {
          enableHighAccuracy:
            true,

          timeout:
            10000,

          maximumAge:
            60000,
        }
      );
    };

  if (
    !kakaoKey
  ) {
    return (
      <div className="places-map-error">
        카카오맵 환경변수가 설정되지 않았습니다.
      </div>
    );
  }

  return (
    <>
      <Script
        id="kakao-map-sdk"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onReady={
          initializeMap
        }
        onError={() => {
          setMapError(
            "카카오 지도 SDK 로딩에 실패했습니다."
          );
        }}
      />

      {mapError && (
        <div className="places-map-error">
          {mapError}
        </div>
      )}

      <div className="places-map-wrapper">
        <div
          ref={
            mapContainer
          }
          className="places-map-canvas"
        />

        {/* 일반 지도에서는 기존 범례 */}
        {!courseMode && (
          <div className="places-map-legend">
            <span>
              <i className="legend-attraction" />
              가볼만한 곳
            </span>

            <span>
              <i className="legend-restaurant" />
              맛집
            </span>

            <span>
              <i className="legend-cafe" />
              카페
            </span>

            <span>
              <i className="legend-accommodation" />
              숙소
            </span>
          </div>
        )}

        {/* 코스 모드용 안내 */}
        {courseMode &&
          places.length >
            0 && (
            <div
              style={{
                position:
                  "absolute",

                left:
                  "14px",

                bottom:
                  "14px",

                zIndex:
                  10,

                padding:
                  "9px 12px",

                borderRadius:
                  "12px",

                background:
                  "rgba(255,255,255,.94)",

                boxShadow:
                  "0 5px 16px rgba(0,0,0,.12)",

                color:
                  "#456056",

                fontSize:
                  "11px",

                fontWeight:
                  800,
              }}
            >
              번호 순서대로
              이동하는 추천코스
            </div>
          )}

        <div className="places-map-controls">
          <button
            type="button"
            onClick={
              moveToCurrentLocation
            }
            disabled={
              locationLoading
            }
            className="places-map-control-button"
          >
            <Crosshair
              size={18}
              aria-hidden="true"
            />

            {locationLoading
              ? "위치 확인 중..."
              : "내 위치"}
          </button>

          <button
            type="button"
            onClick={
              showAllPlaces
            }
            className="places-map-control-button"
          >
            <RotateCcw
              size={17}
              aria-hidden="true"
            />

            {courseMode
              ? "코스 전체 보기"
              : "전체 보기"}
          </button>
        </div>
      </div>
    </>
  );
}