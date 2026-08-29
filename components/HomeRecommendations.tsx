"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  ChevronRight,
  Coffee,
  Footprints,
  ImageIcon,
  MapPin,
  ParkingCircle,
  Sparkles,
  Utensils,
} from "lucide-react";
import {
  ReactNode,
  useMemo,
  useState,
} from "react";

import RegionTabs from "@/components/RegionTabs";
import type { Place } from "@/lib/places";

type HomeRecommendationsProps = {
  places: Place[];
};

type PlaceType =
  | "attraction"
  | "restaurant"
  | "cafe"
  | "accommodation";

type FeatureItem = {
  key: string;
  label: string;
  icon: ReactNode;
};

const SECTION_INFO: {
  type: PlaceType;
  title: string;
  description: string;
}[] = [
  {
    type: "attraction",
    title: "부모님과 가볼만한 곳",
    description: "함께 천천히 둘러보기 좋은 곳",
  },
  {
    type: "restaurant",
    title: "부모님과 가기 좋은 맛집",
    description: "함께 맛있는 한 끼를 즐기세요",
  },
  {
    type: "cafe",
    title: "분위기 좋은 카페",
    description: "차 한잔하며 쉬어가기 좋은 곳",
  },
  {
    type: "accommodation",
    title: "편하게 쉬기 좋은 숙소",
    description: "부모님과 머물기 좋은 곳",
  },
];

const NORTH_GYEONGGI = [
  "가평","고양","구리","남양주","동두천",
  "양주","연천","의정부","파주","포천",
];

const SOUTH_GYEONGGI = [
  "과천","광명","광주","군포","김포","부천","성남",
  "수원","시흥","안산","안성","안양","양평","여주",
  "오산","용인","의왕","이천","평택","하남","화성",
];

function normalize(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/특별자치도|특별자치시|특별시|광역시|도/g, "")
    .replace(/시|군|구/g, "");
}

function matchesRegion(
  place: Place,
  selectedRegion: string
) {
  if (selectedRegion === "전체") {
    return true;
  }

  const region = normalize(place.region || "");
  const city = normalize(place.city || "");

  if (selectedRegion === "경기북부") {
    return (
      region.includes("경기") &&
      NORTH_GYEONGGI.some((name) =>
        city.includes(name)
      )
    );
  }

  if (selectedRegion === "경기남부") {
    return (
      region.includes("경기") &&
      SOUTH_GYEONGGI.some((name) =>
        city.includes(name)
      )
    );
  }

  const target = normalize(selectedRegion);

  return (
    region.includes(target) ||
    city.includes(target)
  );
}

function getSeatingLabel(
  seatingType:
    | "chair"
    | "floor"
    | "mixed"
    | null
) {
  switch (seatingType) {
    case "chair":
      return "의자식";
    case "floor":
      return "좌식";
    case "mixed":
      return "의자식·좌식";
    default:
      return null;
  }
}

function getPlaceFeatures(
  place: Place
): FeatureItem[] {
  const features: FeatureItem[] = [];

  if (place.place_type === "attraction") {
    if (place.parking === true) {
      features.push({
        key: "parking",
        label: "주차 가능",
        icon: <ParkingCircle size={13} aria-hidden="true" />,
      });
    }

    if (place.restroom === true) {
      features.push({
        key: "restroom",
        label: "화장실",
        icon: (
          <span
            aria-hidden="true"
            className="home-place-feature-emoji"
          >
            🚻
          </span>
        ),
      });
    }

    if (place.walking_easy === true) {
      features.push({
        key: "walking",
        label: "걷기 편함",
        icon: <Footprints size={13} aria-hidden="true" />,
      });
    }

    if (place.nearby_cafe === true) {
      features.push({
        key: "cafe",
        label: "주변 카페",
        icon: <Coffee size={13} aria-hidden="true" />,
      });
    }
  }

  if (place.place_type === "restaurant") {
    if (place.parking === true) {
      features.push({
        key: "parking",
        label: "주차 가능",
        icon: <ParkingCircle size={13} aria-hidden="true" />,
      });
    }

    const seatingLabel =
      getSeatingLabel(place.seating_type);

    if (seatingLabel) {
      features.push({
        key: "seating",
        label: seatingLabel,
        icon: <Armchair size={13} aria-hidden="true" />,
      });
    }

    if (place.cuisine_type?.trim()) {
      features.push({
        key: "cuisine",
        label: place.cuisine_type.trim(),
        icon: <Utensils size={13} aria-hidden="true" />,
      });
    }
  }

  if (place.place_type === "cafe") {
    if (place.parking === true) {
      features.push({
        key: "parking",
        label: "주차 가능",
        icon: <ParkingCircle size={13} aria-hidden="true" />,
      });
    }

    if (place.restroom === true) {
      features.push({
        key: "restroom",
        label: "화장실",
        icon: (
          <span
            aria-hidden="true"
            className="home-place-feature-emoji"
          >
            🚻
          </span>
        ),
      });
    }
  }

  if (
    place.place_type === "accommodation" &&
    place.parking === true
  ) {
    features.push({
      key: "parking",
      label: "주차 가능",
      icon: <ParkingCircle size={13} aria-hidden="true" />,
    });
  }

  return features;
}

function PlaceFeatures({
  place,
}: {
  place: Place;
}) {
  const features = getPlaceFeatures(place);

  if (features.length === 0) {
    return null;
  }

  return (
    <div className="home-place-features">
      {features.slice(0, 3).map((feature) => (
        <span
          key={feature.key}
          className="home-place-feature"
        >
          {feature.icon}
          {feature.label}
        </span>
      ))}
    </div>
  );
}

function PlaceCard({
  place,
}: {
  place: Place;
}) {
  const description =
    place.summary ||
    place.parent_recommendation ||
    "부모님과 함께 둘러보기 좋은 장소입니다.";

  return (
    <Link
      href={`/places/${place.slug}`}
      className="home-place-card home-place-card-v2"
    >
      <div className="home-place-image">
        {place.image_url ? (
          <Image
            src={place.image_url}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 74vw, (max-width: 1200px) 31vw, 20vw"
            style={{
              objectFit: "cover",
            }}
          />
        ) : (
          <div className="home-place-placeholder">
            <ImageIcon size={28} />
            <span>사진 준비 중</span>
          </div>
        )}

        <span className="home-place-location-pill">
          <MapPin size={12} />
          {place.region}{" "}
          {place.city}
        </span>
      </div>

      <div className="home-place-info">
        <strong>{place.name}</strong>

        <p>{description}</p>

        <PlaceFeatures place={place} />
      </div>
    </Link>
  );
}

export default function HomeRecommendations({
  places,
}: HomeRecommendationsProps) {
  const [
    selectedRegion,
    setSelectedRegion,
  ] = useState("전체");

  const filteredPlaces =
    useMemo(() => {
      return places.filter(
        (place) =>
          matchesRegion(
            place,
            selectedRegion
          )
      );
    }, [
      places,
      selectedRegion,
    ]);

  return (
    <>
      <section className="home-region-section">
        <div className="container">
          <RegionTabs
            selectedRegion={selectedRegion}
            onChange={setSelectedRegion}
          />
        </div>
      </section>

      {SECTION_INFO.map((section) => {
        const sectionPlaces =
          filteredPlaces
            .filter(
              (place) =>
                place.place_type ===
                section.type
            )
            .slice(0, 5);

        return (
          <section
            key={section.type}
            className={[
              "home-content-section",
              sectionPlaces.length === 0
                ? "is-empty"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="container">
              <div className="home-section-heading">
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>

                <Link
                  href={`/places?type=${section.type}`}
                  className="home-section-more"
                >
                  더보기
                  <ChevronRight size={17} />
                </Link>
              </div>

              {sectionPlaces.length > 0 ? (
                <div className="home-place-scroll-wrap">
                  <div className="home-place-scroll">
                    {sectionPlaces.map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                      />
                    ))}
                  </div>

                  {sectionPlaces.length > 1 && (
                    <div
                      className="home-place-swipe-arrow"
                      aria-hidden="true"
                    >
                      <ChevronRight
                        size={30}
                        strokeWidth={3.2}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={`/places?type=${section.type}`}
                  className="home-empty-section home-empty-section-v2"
                >
                  <span className="home-empty-icon">
                    <Sparkles size={17} />
                  </span>

                  <div>
                    <strong>
                      준비 중인 장소예요
                    </strong>
                    <p>
                      좋은 곳을 하나씩 채워가고 있습니다.
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="home-empty-arrow"
                  />
                </Link>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
