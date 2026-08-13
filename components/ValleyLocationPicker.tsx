"use client";

import Script from "next/script";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Crosshair,
  MapPin,
  Search,
} from "lucide-react";

type ValleyLocationPickerProps = {
  initialAddress?: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
};

declare global {
  interface Window {
    kakao: any;
  }
}

export default function ValleyLocationPicker({
  initialAddress = "",
  initialLatitude = null,
  initialLongitude = null,
}: ValleyLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const [address, setAddress] =
    useState(initialAddress);

  const [latitude, setLatitude] =
    useState(
      initialLatitude !== null
        ? String(initialLatitude)
        : ""
    );

  const [longitude, setLongitude] =
    useState(
      initialLongitude !== null
        ? String(initialLongitude)
        : ""
    );

  const [status, setStatus] =
    useState("");

  const kakaoKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const setMarkerPosition = useCallback(
    (
      lat: number,
      lng: number,
      moveMap = true
    ) => {
      if (!mapRef.current) return;

      const position =
        new window.kakao.maps.LatLng(
          lat,
          lng
        );

      if (markerRef.current) {
        markerRef.current.setPosition(
          position
        );
      } else {
        markerRef.current =
          new window.kakao.maps.Marker({
            map: mapRef.current,
            position,
          });
      }

      if (moveMap) {
        mapRef.current.setCenter(
          position
        );

        mapRef.current.setLevel(4);
      }
    },
    []
  );

  const initializeMap =
    useCallback(() => {
      if (!window.kakao?.maps) {
        return;
      }

      if (!mapContainer.current) {
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
        if (!mapContainer.current) {
          return;
        }

        // 기존 좌표가 있으면 기존 위치,
        // 없으면 대한민국 중심 부근
        const hasInitialLocation =
          initialLatitude !== null &&
          initialLongitude !== null;

        const centerLat =
          hasInitialLocation
            ? initialLatitude!
            : 36.5;

        const centerLng =
          hasInitialLocation
            ? initialLongitude!
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

              level: hasInitialLocation
                ? 4
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
          window.kakao.maps
            .ControlPosition.RIGHT
        );

        // 지도 / 스카이뷰
        const mapTypeControl =
          new window.kakao.maps.MapTypeControl();

        map.addControl(
          mapTypeControl,
          window.kakao.maps
            .ControlPosition.TOPRIGHT
        );

        // 기존 좌표가 있다면 마커 표시
        if (hasInitialLocation) {
          setMarkerPosition(
            initialLatitude!,
            initialLongitude!,
            false
          );
        }

        // 지도 클릭 → 좌표 직접 조정
        window.kakao.maps.event.addListener(
          map,
          "click",
          (mouseEvent: any) => {
            const latLng =
              mouseEvent.latLng;

            const lat =
              latLng.getLat();

            const lng =
              latLng.getLng();

            setLatitude(
              lat.toFixed(7)
            );

            setLongitude(
              lng.toFixed(7)
            );

            setMarkerPosition(
              lat,
              lng,
              false
            );

            setStatus(
              "지도에서 위치를 지정했습니다."
            );
          }
        );

        setTimeout(() => {
          map.relayout();
        }, 100);
      });
    }, [
      initialLatitude,
      initialLongitude,
      setMarkerPosition,
    ]);

  useEffect(() => {
    if (window.kakao?.maps) {
      initializeMap();
    }
  }, [initializeMap]);

  // 주소 → 좌표 찾기
  const findAddress = (
    event?: FormEvent
  ) => {
    event?.preventDefault();

    const trimmedAddress =
      address.trim();

    if (!trimmedAddress) {
      setStatus(
        "주소를 먼저 입력해 주세요."
      );
      return;
    }

    if (
      !window.kakao?.maps?.services
    ) {
      setStatus(
        "카카오 주소 검색 서비스를 불러오는 중입니다."
      );
      return;
    }

    const geocoder =
      new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(
      trimmedAddress,
      (
        result: any[],
        searchStatus: string
      ) => {
        if (
          searchStatus ===
            window.kakao.maps.services
              .Status.OK &&
          result.length > 0
        ) {
          const lat =
            Number(result[0].y);

          const lng =
            Number(result[0].x);

          setLatitude(
            lat.toFixed(7)
          );

          setLongitude(
            lng.toFixed(7)
          );

          setMarkerPosition(
            lat,
            lng
          );

          setStatus(
            "주소의 위치를 찾았습니다. 정확한 위치가 다르면 지도를 클릭해 조정해 주세요."
          );

          return;
        }

        setStatus(
          "주소의 위치를 찾지 못했습니다. 주소를 확인하거나 지도에서 직접 위치를 선택해 주세요."
        );
      }
    );
  };

  // 현재 위치
  const moveToCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setStatus(
          "현재 위치 기능을 지원하지 않는 브라우저입니다."
        );
        return;
      }

      setStatus(
        "현재 위치를 확인하고 있습니다..."
      );

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat =
            position.coords.latitude;

          const lng =
            position.coords.longitude;

          setLatitude(
            lat.toFixed(7)
          );

          setLongitude(
            lng.toFixed(7)
          );

          setMarkerPosition(
            lat,
            lng
          );

          setStatus(
            "현재 위치로 지정했습니다."
          );
        },

        () => {
          setStatus(
            "현재 위치를 확인할 수 없습니다. 브라우저의 위치 권한을 확인해 주세요."
          );
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
      <div>
        카카오맵 환경변수가
        설정되지 않았습니다.
      </div>
    );
  }

  return (
    <>
      <Script
        id="kakao-admin-location-sdk"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onReady={
          initializeMap
        }
        onError={() => {
          setStatus(
            "카카오 지도 SDK를 불러오지 못했습니다."
          );
        }}
      />

      {/* 주소 */}
      <label className="admin-full-field">
        <span>주소 *</span>

        <div className="admin-input-with-icon">
          <MapPin
            size={18}
            aria-hidden="true"
          />

          <input
            type="text"
            name="address"
            value={address}
            onChange={(event) => {
              setAddress(
                event.target.value
              );
            }}
            placeholder="계곡의 도로명 또는 지번 주소"
            required
          />
        </div>
      </label>

      {/* 주소 검색 버튼 */}
      <div
        className="admin-full-field"
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "-8px",
        }}
      >
        <button
          type="button"
          onClick={() =>
            findAddress()
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <Search
            size={17}
            aria-hidden="true"
          />
          주소로 위치 찾기
        </button>

        <button
          type="button"
          onClick={
            moveToCurrentLocation
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <Crosshair
            size={17}
            aria-hidden="true"
          />
          현재 위치 사용
        </button>
      </div>

      {/* 위도 */}
      <label>
        <span>위도</span>

        <input
          type="number"
          name="latitude"
          value={latitude}
          onChange={(event) => {
            const value =
              event.target.value;

            setLatitude(value);

            const lat =
              Number(value);

            const lng =
              Number(longitude);

            if (
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              longitude !== ""
            ) {
              setMarkerPosition(
                lat,
                lng
              );
            }
          }}
          placeholder="예: 37.821234"
          step="any"
          min="-90"
          max="90"
        />

        <small>
          주소 검색 또는 지도 클릭 시
          자동 입력됩니다.
        </small>
      </label>

      {/* 경도 */}
      <label>
        <span>경도</span>

        <input
          type="number"
          name="longitude"
          value={longitude}
          onChange={(event) => {
            const value =
              event.target.value;

            setLongitude(value);

            const lat =
              Number(latitude);

            const lng =
              Number(value);

            if (
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              latitude !== ""
            ) {
              setMarkerPosition(
                lat,
                lng
              );
            }
          }}
          placeholder="예: 127.512345"
          step="any"
          min="-180"
          max="180"
        />

        <small>
          주소 검색 또는 지도 클릭 시
          자동 입력됩니다.
        </small>
      </label>

      {/* 안내 */}
      <div
        className="admin-full-field"
        style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background:
            "rgba(0,0,0,0.04)",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        {status ||
          "주소를 입력하고 위치 찾기를 누르거나, 지도에서 정확한 계곡 위치를 클릭해 주세요."}
      </div>

      {/* 지도 */}
      <div
        className="admin-full-field"
        style={{
          position: "relative",
        }}
      >
        <div
          ref={mapContainer}
          style={{
            width: "100%",
            height: "380px",
            minHeight: "380px",
            borderRadius: "14px",
            overflow: "hidden",
            border:
              "1px solid #ddd",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "12px",
            bottom: "12px",
            zIndex: 10,
            padding: "8px 11px",
            borderRadius: "8px",
            background:
              "rgba(255,255,255,0.94)",
            fontSize: "12px",
            fontWeight: 700,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.12)",
            pointerEvents: "none",
          }}
        >
          지도를 클릭하면 위치를
          조정할 수 있습니다.
        </div>
      </div>
    </>
  );
}