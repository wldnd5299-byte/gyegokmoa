"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type ValleyDetailMapProps = {
  name: string;
  latitude: number | null;
  longitude: number | null;
};

declare global {
  interface Window {
    kakao: any;
  }
}

export default function ValleyDetailMap({
  name,
  latitude,
  longitude,
}: ValleyDetailMapProps) {
  const mapContainer =
    useRef<HTMLDivElement>(null);

  const mapRef = useRef<any>(null);

  const initializedRef =
    useRef(false);

  const [mapError, setMapError] =
    useState("");

  const kakaoKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const initializeMap =
    useCallback(() => {
      if (!window.kakao?.maps) {
        return;
      }

      if (!mapContainer.current) {
        return;
      }

      // 좌표가 없는 계곡은 지도 생성 안 함
      if (
        latitude === null ||
        longitude === null
      ) {
        return;
      }

      if (
        initializedRef.current &&
        mapRef.current
      ) {
        mapRef.current.relayout();
        return;
      }

      window.kakao.maps.load(() => {
        try {
          if (!mapContainer.current) {
            return;
          }

          setMapError("");

          const position =
            new window.kakao.maps.LatLng(
              latitude,
              longitude
            );

          const map =
            new window.kakao.maps.Map(
              mapContainer.current,
              {
                center: position,
                level: 5,
              }
            );

          mapRef.current = map;
          initializedRef.current = true;

          // 확대 / 축소
          const zoomControl =
            new window.kakao.maps.ZoomControl();

          map.addControl(
            zoomControl,
            window.kakao.maps
              .ControlPosition.RIGHT
          );

          // 지도 / 스카이뷰
          const mapTypeControl =
            new window.kakao.maps
              .MapTypeControl();

          map.addControl(
            mapTypeControl,
            window.kakao.maps
              .ControlPosition.TOPRIGHT
          );

          // 계곡 마커
          const marker =
            new window.kakao.maps.Marker({
              map,
              position,
              title: name,
            });

          // 계곡 이름 표시
          const infoWindow =
            new window.kakao.maps.InfoWindow({
              content: `
                <div
                  style="
                    padding:8px 12px;
                    font-size:13px;
                    font-weight:700;
                    color:#222;
                    white-space:nowrap;
                  "
                >
                  ${name}
                </div>
              `,
            });

          infoWindow.open(
            map,
            marker
          );

          setTimeout(() => {
            map.relayout();
            map.setCenter(position);
          }, 100);
        } catch (error) {
          console.error(
            "상세페이지 지도 생성 실패:",
            error
          );

          setMapError(
            "지도를 불러오지 못했습니다."
          );
        }
      });
    }, [
      latitude,
      longitude,
      name,
    ]);

  useEffect(() => {
    if (window.kakao?.maps) {
      initializeMap();
    }
  }, [initializeMap]);

  // 좌표가 없는 경우
  if (
    latitude === null ||
    longitude === null
  ) {
    return (
      <div
        style={{
          padding: "30px 20px",
          textAlign: "center",
          borderRadius: "14px",
          background: "#f6f7f6",
          color: "#666",
        }}
      >
        지도 위치 정보가 아직
        등록되지 않았습니다.
      </div>
    );
  }

  if (!kakaoKey) {
    return (
      <div>
        카카오맵 환경변수가
        설정되지 않았습니다.
      </div>
    );
  }

  return (
    <>
      <Script
        id="kakao-detail-map-sdk"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
        strategy="afterInteractive"
        onReady={
          initializeMap
        }
        onError={() => {
          setMapError(
            "카카오 지도 SDK를 불러오지 못했습니다."
          );
        }}
      />

      {mapError && (
        <div
          style={{
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "10px",
            background: "#f6f7f6",
          }}
        >
          {mapError}
        </div>
      )}

      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "330px",
          minHeight: "330px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid #e5e5e5",
        }}
      />
    </>
  );
}