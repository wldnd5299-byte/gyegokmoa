"use client";

import Link from "next/link";
import {
  BedDouble,
  Coffee,
  MapPin,
  Search,
  Utensils,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export type SearchAutocompletePlace = {
  id: number;
  name: string;
  slug: string;
  place_type:
    | "attraction"
    | "restaurant"
    | "cafe"
    | "accommodation";
  region: string;
  city: string;
  address: string;
  summary: string | null;
  tags: string[];
  cuisine_type: string | null;
};

type Props = {
  places: SearchAutocompletePlace[];
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  maxSuggestions?: number;
};

type Suggestion =
  | {
      kind: "region";
      label: string;
      query: string;
      meta: string;
    }
  | {
      kind: "place";
      label: string;
      query: string;
      meta: string;
      placeId: number;
      slug: string;
      placeType: SearchAutocompletePlace["place_type"];
    };

const TYPE_LABELS: Record<
  SearchAutocompletePlace["place_type"],
  string
> = {
  attraction: "가볼만한 곳",
  restaurant: "맛집",
  cafe: "카페",
  accommodation: "숙소",
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/강원특별자치도/g, "강원")
    .replace(/전북특별자치도/g, "전북")
    .replace(/제주특별자치도/g, "제주")
    .replace(/경기도/g, "경기")
    .replace(/충청북도/g, "충북")
    .replace(/충청남도/g, "충남")
    .replace(/전라북도/g, "전북")
    .replace(/전라남도/g, "전남")
    .replace(/경상북도/g, "경북")
    .replace(/경상남도/g, "경남")
    .replace(/서울특별시/g, "서울")
    .replace(/부산광역시/g, "부산")
    .replace(/대구광역시/g, "대구")
    .replace(/인천광역시/g, "인천")
    .replace(/광주광역시/g, "광주")
    .replace(/대전광역시/g, "대전")
    .replace(/울산광역시/g, "울산")
    .replace(/세종특별자치시/g, "세종")
    .replace(/[(){}\[\],./\\|"'`~!@#$%^&*+=?<>:;_-]/g, "");
}

function typeKeywords(
  type: SearchAutocompletePlace["place_type"]
) {
  switch (type) {
    case "restaurant":
      return ["맛집", "식당", "음식점", "밥집", "먹거리"];
    case "cafe":
      return ["카페", "커피", "찻집"];
    case "accommodation":
      return ["숙소", "호텔", "펜션", "리조트", "숙박", "풀빌라"];
    default:
      return ["가볼만한곳", "갈곳", "나들이", "관광", "여행", "체험"];
  }
}

function searchable(place: SearchAutocompletePlace) {
  return normalize(
    [
      place.name,
      place.region,
      place.city,
      place.address,
      place.summary,
      place.cuisine_type,
      ...(place.tags ?? []),
      TYPE_LABELS[place.place_type],
      ...typeKeywords(place.place_type),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function scorePlace(
  place: SearchAutocompletePlace,
  query: string
) {
  const q = normalize(query);
  if (!q) return 0;

  const name = normalize(place.name);
  const region = normalize(place.region);
  const city = normalize(place.city);
  const address = normalize(place.address);
  const all = searchable(place);

  let score = 0;

  if (name === q) score = 160;
  else if (name.startsWith(q)) score = 140;
  else if (name.includes(q)) score = 125;

  if (city === q || region === q) score = Math.max(score, 115);
  else if (city.includes(q) || region.includes(q)) score = Math.max(score, 100);

  if (address.includes(q)) score = Math.max(score, 90);
  if (all.includes(q)) score = Math.max(score, 70);

  const tokens = query
    .trim()
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);

  if (
    tokens.length > 1 &&
    tokens.every((token) => all.includes(token))
  ) {
    score += tokens.length * 18;
  }

  return score;
}

function PlaceIcon({
  type,
}: {
  type: SearchAutocompletePlace["place_type"];
}) {
  if (type === "restaurant") return <Utensils size={16} />;
  if (type === "cafe") return <Coffee size={16} />;
  if (type === "accommodation") return <BedDouble size={16} />;
  return <MapPin size={16} />;
}

export default function SearchAutocomplete({
  places,
  defaultValue = "",
  className = "",
  placeholder = "지역, 장소, 맛집 등을 검색해보세요",
  ariaLabel = "지역 또는 장소 검색",
  maxSuggestions = 8,
}: Props) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const trimmed = value.trim();
    if (!trimmed) return [];

    const q = normalize(trimmed);

    const regionMap = new Map<string, Suggestion>();

    for (const place of places) {
      const regionCity = `${place.region} ${place.city}`.trim();
      const normalizedRegionCity = normalize(regionCity);

      if (
        normalize(place.region).includes(q) ||
        normalize(place.city).includes(q) ||
        normalizedRegionCity.includes(q)
      ) {
        if (!regionMap.has(normalizedRegionCity)) {
          regionMap.set(normalizedRegionCity, {
            kind: "region",
            label: regionCity,
            query: regionCity,
            meta: "지역 검색",
          });
        }
      }
    }

    const placeSuggestions: Suggestion[] = places
      .map((place) => ({
        place,
        score: scorePlace(place, trimmed),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
      .map(({ place }) => ({
        kind: "place",
        label: place.name,
        query: place.name,
        meta: [
          TYPE_LABELS[place.place_type],
          place.region,
          place.city,
        ]
          .filter(Boolean)
          .join(" · "),
        placeId: place.id,
        slug: place.slug,
        placeType: place.place_type,
      }));

    return [
      ...Array.from(regionMap.values()).slice(0, 3),
      ...placeSuggestions,
    ].slice(0, maxSuggestions);
  }, [places, value, maxSuggestions]);

  const goSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setOpen(false);
    setActiveIndex(-1);

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.kind === "place") {
      setOpen(false);
      setActiveIndex(-1);
      router.push(`/places/${suggestion.slug}`);
      return;
    }

    setValue(suggestion.query);
    goSearch(suggestion.query);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    goSearch(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1
      );
    }

    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`search-autocomplete-wrap ${className}`.trim()}
    >
      <form
        onSubmit={handleSubmit}
        className="search-autocomplete-form"
      >
        <Search size={20} aria-hidden="true" />

        <input
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
        />

        <button type="submit">검색</button>
      </form>

      {open && value.trim() && suggestions.length > 0 && (
        <div
          className="search-autocomplete-panel"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={
                suggestion.kind === "place"
                  ? `place-${suggestion.placeId}`
                  : `region-${suggestion.query}`
              }
              type="button"
              className={[
                "search-autocomplete-item",
                index === activeIndex ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectSuggestion(suggestion)}
            >
              <span className="search-autocomplete-icon">
                {suggestion.kind === "place" ? (
                  <PlaceIcon type={suggestion.placeType} />
                ) : (
                  <Search size={16} aria-hidden="true" />
                )}
              </span>

              <span className="search-autocomplete-copy">
                <strong>{suggestion.label}</strong>
                <small>{suggestion.meta}</small>
              </span>
            </button>
          ))}

          <Link
            href={`/search?q=${encodeURIComponent(value.trim())}`}
            className="search-autocomplete-all"
            onClick={() => setOpen(false)}
          >
            ‘{value.trim()}’ 전체 검색결과 보기
          </Link>
        </div>
      )}
    </div>
  );
}
