"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";

type PlacePhoto = {
  id: number;
  image_url: string;
  photographer_name:
    | string
    | null;
  source_url:
    | string
    | null;
};

type PlaceGalleryProps = {
  placeName: string;
  photos: PlacePhoto[];
  fallbackImage?: string | null;
};

export function PlaceGallery({
  placeName,
  photos,
  fallbackImage,
}: PlaceGalleryProps) {
  const scrollRef =
    useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  /*
   * place_photos가 없으면
   * 기존 대표사진을 사용합니다.
   */
  const galleryPhotos =
    photos.length > 0
      ? photos
      : fallbackImage
        ? [
            {
              id: -1,
              image_url:
                fallbackImage,
              photographer_name:
                null,
              source_url: null,
            },
          ]
        : [];

  const total =
    galleryPhotos.length;

  function moveTo(
    nextIndex: number
  ) {
    if (
      !scrollRef.current ||
      total === 0
    ) {
      return;
    }

    const safeIndex =
      Math.max(
        0,
        Math.min(
          nextIndex,
          total - 1
        )
      );

    const container =
      scrollRef.current;

    container.scrollTo({
      left:
        container.clientWidth *
        safeIndex,
      behavior: "smooth",
    });

    setCurrentIndex(
      safeIndex
    );
  }

  function previousPhoto() {
    if (total <= 1) {
      return;
    }

    /*
     * 첫 사진에서 왼쪽을 누르면
     * 마지막 사진으로 이동
     */
    if (currentIndex === 0) {
      moveTo(total - 1);
      return;
    }

    moveTo(
      currentIndex - 1
    );
  }

  function nextPhoto() {
    if (total <= 1) {
      return;
    }

    /*
     * 마지막 사진에서 오른쪽을 누르면
     * 첫 사진으로 이동
     */
    if (
      currentIndex ===
      total - 1
    ) {
      moveTo(0);
      return;
    }

    moveTo(
      currentIndex + 1
    );
  }

  function handleScroll() {
    const container =
      scrollRef.current;

    if (!container) {
      return;
    }

    const width =
      container.clientWidth;

    if (width <= 0) {
      return;
    }

    const nextIndex =
      Math.round(
        container.scrollLeft /
          width
      );

    setCurrentIndex(
      Math.max(
        0,
        Math.min(
          nextIndex,
          total - 1
        )
      )
    );
  }

  if (total === 0) {
    return (
      <div className="place-hero-placeholder">
        <span>
          대표사진 준비 중
        </span>
      </div>
    );
  }

  return (
    <div className="place-hero-gallery">
      <div
        ref={scrollRef}
        className="place-gallery-scroll"
        onScroll={
          handleScroll
        }
      >
        {galleryPhotos.map(
          (photo, index) => (
            <div
              className="place-gallery-slide"
              key={photo.id}
            >
              <img
                src={
                  photo.image_url
                }
                alt={`${placeName} 사진 ${
                  index + 1
                }`}
                draggable={
                  false
                }
              />

              {photo.photographer_name && (
                <div className="place-gallery-credit">
                  {photo.source_url ? (
                    <a
                      href={
                        photo.source_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      사진 제공{" "}
                      {
                        photo.photographer_name
                      }
                    </a>
                  ) : (
                    <span>
                      사진 제공{" "}
                      {
                        photo.photographer_name
                      }
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* 사진이 2장 이상일 때만 화살표 표시 */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="place-gallery-arrow place-gallery-arrow-left"
            onClick={
              previousPhoto
            }
            aria-label="이전 사진"
          >
            <ChevronLeft
              size={24}
            />
          </button>

          <button
            type="button"
            className="place-gallery-arrow place-gallery-arrow-right"
            onClick={
              nextPhoto
            }
            aria-label="다음 사진"
          >
            <ChevronRight
              size={24}
            />
          </button>

          <div className="place-gallery-counter">
            {currentIndex + 1}
            {" / "}
            {total}
          </div>
        </>
      )}
    </div>
  );
}