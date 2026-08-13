"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair } from "lucide-react";

interface Valley {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
}

interface KakaoMapProps {
  valleys: Valley[];
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMap({
  valleys,
}: KakaoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const router = useRouter();

  const [mapError, setMapError] = useState("");
  const [locationLoading, setLocationLoading] =
    useState(false);

  const kakaoKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const initializeMap = useCallback(() => {
    if (!window.kakao?.maps) {
      return;
    }

    if (!mapContainer.current) {
      return;
    }

    // 같은 DOM에 지도를 불필요하게 여러 번 생성하지 않도록 방지
    if (initializedRef.current && mapRef.current) {
      mapRef.current.relayout();
      return;
    }

    window.kakao.maps.load(() => {
      try {
        if (!mapContainer.current) return;

        setMapError("");

        const centerLat =
          valleys.length > 0
            ? valleys[0].latitude
            : 36.5;

        const centerLng =
          valleys.length > 0
            ? valleys[0].longitude
            : 127.8;

        const map = new window.kakao.maps.Map(
          mapContainer.current,
          {
            center:
              new window.kakao.maps.LatLng(
                centerLat,
                centerLng
              ),
            level:
              valleys.length > 0
                ? 8
                : 13,
          }
        );

        mapRef.current = map;
        initializedRef.current = true;

        // 확대 / 축소
        const zoomControl =
          new window.kakao.maps.ZoomControl();

        map.addControl(
          zoomControl,
          window.kakao.maps.ControlPosition.RIGHT
        );

        // 지도 / 스카이뷰
        const mapTypeControl =
          new window.kakao.maps.MapTypeControl();

        map.addControl(
          mapTypeControl,
          window.kakao.maps.ControlPosition.TOPRIGHT
        );

        const bounds =
          new window.kakao.maps.LatLngBounds();

        valleys.forEach((valley) => {
          const position =
            new window.kakao.maps.LatLng(
              valley.latitude,
              valley.longitude
            );

          bounds.extend(position);

          const marker =
            new window.kakao.maps.Marker({
              map,
              position,
              title: valley.name,
            });
            marker.setClickable(true);

          const infoWindow =
            new window.kakao.maps.InfoWindow({
              content: `
                <div
                  style="
                    padding:9px 12px;
                    font-size:13px;
                    font-weight:700;
                    color:#222;
                    white-space:nowrap;
                  "
                >
                  ${valley.name}
                </div>
              `,
            });

          window.kakao.maps.event.addListener(
            marker,
            "mouseover",
            () => {
              infoWindow.open(map, marker);
            }
          );

          window.kakao.maps.event.addListener(
            marker,
            "mouseout",
            () => {
              infoWindow.close();
            }
          );

          window.kakao.maps.event.addListener(
            marker,
            "click",
            () => {
              router.push(
                `/valleys/${valley.slug}`
              );
            }
          );
        });

        // 여러 계곡 → 전부 보이도록 자동 맞춤
        if (valleys.length >= 2) {
          map.setBounds(bounds);
        }

        // 한 개 → 적당히 확대
        if (valleys.length === 1) {
          map.setCenter(
            new window.kakao.maps.LatLng(
              valleys[0].latitude,
              valleys[0].longitude
            )
          );

          map.setLevel(7);
        }

        // 지도 컨테이너 크기 재계산
        setTimeout(() => {
          map.relayout();
        }, 100);
      } catch (error) {
        console.error(
          "카카오 지도 생성 실패:",
          error
        );

        setMapError(
          "카카오 지도를 생성하지 못했습니다."
        );
      }
    });
  }, [valleys, router]);

  // 이미 SDK가 로드돼 있는 상태에서도 지도 생성
  useEffect(() => {
    if (window.kakao?.maps) {
      initializeMap();
    }
  }, [initializeMap]);

  // 브라우저 크기가 바뀔 때 지도 재계산
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
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

  const moveToCurrentLocation = () => {
    if (!mapRef.current) {
      return;
    }

    if (!navigator.geolocation) {
      alert(
        "현재 위치 기능을 지원하지 않는 브라우저입니다."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const currentPosition =
          new window.kakao.maps.LatLng(
            latitude,
            longitude
          );

        if (currentMarkerRef.current) {
          currentMarkerRef.current.setMap(
            null
          );
        }

        const currentMarker =
          new window.kakao.maps.Marker({
            position: currentPosition,
            map: mapRef.current,
            title: "현재 위치",
          });

        currentMarkerRef.current =
          currentMarker;

        const currentInfoWindow =
          new window.kakao.maps.InfoWindow({
            content: `
              <div
                style="
                  padding:9px 12px;
                  font-size:13px;
                  font-weight:700;
                  color:#222;
                  white-space:nowrap;
                "
              >
                현재 위치
              </div>
            `,
          });

        currentInfoWindow.open(
          mapRef.current,
          currentMarker
        );

        mapRef.current.panTo(
          currentPosition
        );

        mapRef.current.setLevel(6);

        setLocationLoading(false);
      },

      (error) => {
        console.error(
          "현재 위치 확인 실패:",
          error
        );

        setLocationLoading(false);

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
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  if (!kakaoKey) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #ddd",
          borderRadius: "18px",
        }}
      >
        카카오맵 환경변수가 설정되지 않았습니다.
      </div>
    );
  }

  return (
    <>
      <Script
        id="kakao-map-sdk"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
        strategy="afterInteractive"

        // 핵심: 최초 로드 + 재마운트 모두 처리
        onReady={initializeMap}

        onError={() => {
          setMapError(
            "카카오 지도 SDK 로딩에 실패했습니다."
          );
        }}
      />

      {mapError && (
        <div
          style={{
            padding: "16px",
            marginBottom: "12px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          {mapError}
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: "100%",
        }}
      >
        <div
          ref={mapContainer}
          style={{
            width: "100%",
            height: "520px",
            minHeight: "520px",
            borderRadius: "18px",
            overflow: "hidden",
            border: "1px solid #ddd",
          }}
        />

        <button
          type="button"
          onClick={
            moveToCurrentLocation
          }
          disabled={locationLoading}
          aria-label="현재 위치 보기"
          style={{
            position: "absolute",
            left: "14px",
            bottom: "14px",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            background: "#fff",
            color: "#222",
            fontSize: "13px",
            fontWeight: 700,
            cursor: locationLoading
              ? "wait"
              : "pointer",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          <Crosshair
            size={17}
            aria-hidden="true"
          />

          {locationLoading
            ? "위치 확인 중..."
            : "내 위치"}
        </button>
      </div>
    </>
  );
}