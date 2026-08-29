"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  Coffee,
  MapPin,
  Navigation,
  Search,
  Utensils,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import KakaoMap, {
  type MapPlace,
  type MapPlaceType,
  type MapFocusLocation,
} from "@/components/KakaoMap";

import {
  REGION_SEARCH_ITEMS,
  type RegionSearchItem,
} from "@/data/korea-regions";

export interface PlaceMapItem {
  id: string | number;
  name: string;
  slug: string;
  place_type: MapPlaceType;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  image_url?: string | null;
  summary?: string | null;
}

type PlaceFilter =
  | "all"
  | MapPlaceType;

interface PlaceMapExplorerProps {
  places: PlaceMapItem[];
  initialFilter?: MapPlaceType;
  initialSearch?: string;
  initialPlaceSlug?: string;
}

type SearchSuggestion =
  | {
      kind: "region";
      label: string;
      query: string;
      meta: string;
      region: RegionSearchItem;
    }
  | {
      kind: "address";
      label: string;
      query: string;
      meta: string;
      region: RegionSearchItem;
    }
  | {
      kind: "place";
      label: string;
      query: string;
      meta: string;
      placeId: string | number;
    };

const FILTERS: {
  value: MapPlaceType;
  label: string;
}[] = [
  { value: "attraction", label: "갈곳" },
  { value: "restaurant", label: "맛집" },
  { value: "cafe", label: "카페" },
  { value: "accommodation", label: "숙소" },
];

function FilterIcon({
  type,
}: {
  type: PlaceFilter;
}) {
  if (type === "restaurant") {
    return <Utensils size={17} aria-hidden="true" />;
  }

  if (type === "cafe") {
    return <Coffee size={17} aria-hidden="true" />;
  }

  if (type === "accommodation") {
    return <BedDouble size={17} aria-hidden="true" />;
  }

  return <MapPin size={17} aria-hidden="true" />;
}

function getTypeLabel(
  type: MapPlaceType
) {
  switch (type) {
    case "attraction":
      return "가볼만한 곳";
    case "restaurant":
      return "맛집";
    case "cafe":
      return "카페";
    case "accommodation":
      return "숙소";
    default:
      return "";
  }
}

function getShortTypeLabel(
  type: MapPlaceType
) {
  switch (type) {
    case "attraction":
      return "갈곳";
    case "restaurant":
      return "맛집";
    case "cafe":
      return "카페";
    case "accommodation":
      return "숙소";
    default:
      return "";
  }
}

function normalizeSearchText(
  value: string
) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/서울특별시/g, "서울")
    .replace(/부산광역시/g, "부산")
    .replace(/대구광역시/g, "대구")
    .replace(/인천광역시/g, "인천")
    .replace(/광주광역시/g, "광주")
    .replace(/대전광역시/g, "대전")
    .replace(/울산광역시/g, "울산")
    .replace(/세종특별자치시/g, "세종")
    .replace(/경기도/g, "경기")
    .replace(/강원특별자치도|강원도/g, "강원")
    .replace(/충청북도/g, "충북")
    .replace(/충청남도/g, "충남")
    .replace(/전북특별자치도|전라북도/g, "전북")
    .replace(/전라남도/g, "전남")
    .replace(/경상북도/g, "경북")
    .replace(/경상남도/g, "경남")
    .replace(/제주특별자치도|제주도/g, "제주")
    .replace(/(시|군|구|읍|면|동)$/g, "");
}

function compactRegionText(
  value: string
) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/서울특별시/g, "서울")
    .replace(/부산광역시/g, "부산")
    .replace(/대구광역시/g, "대구")
    .replace(/인천광역시/g, "인천")
    .replace(/광주광역시/g, "광주")
    .replace(/대전광역시/g, "대전")
    .replace(/울산광역시/g, "울산")
    .replace(/세종특별자치시/g, "세종")
    .replace(/경기도/g, "경기")
    .replace(/강원특별자치도|강원도/g, "강원")
    .replace(/충청북도/g, "충북")
    .replace(/충청남도/g, "충남")
    .replace(/전북특별자치도|전라북도/g, "전북")
    .replace(/전라남도/g, "전남")
    .replace(/경상북도/g, "경북")
    .replace(/경상남도/g, "경남")
    .replace(/제주특별자치도|제주도/g, "제주");
}

function findRegionItemForAddress(
  address: string
) {
  const normalizedAddress =
    normalizeSearchText(address);

  const cityMatches =
    REGION_SEARCH_ITEMS
      .filter((item) =>
        Boolean(item.city)
      )
      .filter((item) => {
        const provinceNames = [
          item.province,
          ...REGION_SEARCH_ITEMS
            .filter(
              (candidate) =>
                candidate.province ===
                  item.province &&
                !candidate.city
            )
            .flatMap(
              (candidate) =>
                candidate.aliases
            ),
        ].map(normalizeSearchText);

        const provinceMatch =
          provinceNames.some(
            (name) =>
              normalizedAddress.includes(
                name
              )
          );

        const cityMatch =
          item.city
            ? normalizedAddress.includes(
                normalizeSearchText(
                  item.city
                )
              )
            : false;

        return (
          provinceMatch &&
          cityMatch
        );
      });

  return cityMatches[0] || null;
}

function getAdministrativeAreaLabel(
  address: string
) {
  const parts = address
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 3) {
    return parts.join(" ");
  }

  const districtIndex =
    parts.findIndex(
      (part, index) =>
        index >= 1 &&
        /(읍|면|동)$/.test(part)
    );

  if (districtIndex >= 0) {
    return parts
      .slice(0, districtIndex + 1)
      .join(" ");
  }

  return parts.slice(0, 3).join(" ");
}

function getDistanceKm(
  from: {
    latitude: number;
    longitude: number;
  },
  to: {
    latitude: number;
    longitude: number;
  }
) {
  const earthRadiusKm =
    6371;

  const toRadians = (
    degree: number
  ) =>
    (degree * Math.PI) /
    180;

  const lat1 =
    toRadians(
      from.latitude
    );

  const lat2 =
    toRadians(
      to.latitude
    );

  const deltaLat =
    toRadians(
      to.latitude -
        from.latitude
    );

  const deltaLng =
    toRadians(
      to.longitude -
        from.longitude
    );

  const a =
    Math.sin(
      deltaLat / 2
    ) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(
        deltaLng / 2
      ) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return (
    earthRadiusKm * c
  );
}

function formatDistance(
  distanceKm: number
) {
  if (distanceKm < 1) {
    return `${Math.round(
      distanceKm * 1000
    )}m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(
      1
    )}km`;
  }

  return `${Math.round(
    distanceKm
  )}km`;
}


export default function PlaceMapExplorer({
  places,
  initialFilter,
  initialSearch = "",
  initialPlaceSlug = "",
}: PlaceMapExplorerProps) {
  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<PlaceFilter>(
      initialFilter ?? "attraction"
    );

  const [
    searchInput,
    setSearchInput,
  ] = useState(initialSearch);

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState(initialSearch);

  const [
    selectedRegionTarget,
    setSelectedRegionTarget,
  ] =
    useState<RegionSearchItem | null>(
      null
    );

  const [
    freeRegionSearch,
    setFreeRegionSearch,
  ] = useState("");

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    addressSuggestions,
    setAddressSuggestions,
  ] = useState<SearchSuggestion[]>(
    []
  );

  const addressSearchRequestRef =
    useRef(0);

  const initialSelectedPlace =
    initialPlaceSlug
      ? places.find(
          (place) =>
            place.slug ===
            initialPlaceSlug
        ) || null
      : null;

  const [
    selectedPlaceId,
    setSelectedPlaceId,
  ] = useState<string | number | null>(
    initialSelectedPlace?.id ??
      null
  );

  const [
    currentLocation,
    setCurrentLocation,
  ] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [
    sortByDistance,
    setSortByDistance,
  ] = useState(false);

  const [
    listOpen,
    setListOpen,
  ] = useState(false);

  const cardRefs =
    useRef<
      Record<
        string,
        HTMLElement | null
      >
    >({});

  const searchablePlaces =
    useMemo(() => {
      return places.map(
        (place) => ({
          ...place,
          searchableText:
            normalizeSearchText(
              [
                place.name,
                place.region,
                place.city,
                `${place.region} ${place.city}`,
              ].join(" ")
            ),
        })
      );
    }, [places]);

  useEffect(() => {
    if (initialPlaceSlug) {
      const directPlace =
        searchablePlaces.find(
          (place) =>
            place.slug ===
            initialPlaceSlug
        );

      if (directPlace) {
        setSelectedPlaceId(
          directPlace.id
        );
        setSelectedFilter(
          directPlace.place_type
        );
        setSearchInput(
          directPlace.name
        );
        setAppliedSearch(
          directPlace.name
        );
        setSelectedRegionTarget(
          null
        );
        setFreeRegionSearch("");
        return;
      }
    }

    const input =
      initialSearch.trim();

    if (!input) {
      return;
    }

    const normalized =
      normalizeSearchText(input);

    const exactPlace =
      searchablePlaces.find(
        (place) =>
          normalizeSearchText(
            place.name
          ) === normalized
      );

    if (exactPlace) {
      setSelectedPlaceId(
        exactPlace.id
      );
      return;
    }

    const region =
      REGION_SEARCH_ITEMS.find(
        (item) =>
          item.aliases.some(
            (alias) =>
              normalizeSearchText(
                alias
              ) === normalized
          ) ||
          normalizeSearchText(
            item.label
          ) === normalized
      );

    if (region) {
      setSelectedRegionTarget(
        region
      );
      setFreeRegionSearch("");
    }
  }, [
    initialSearch,
    initialPlaceSlug,
    searchablePlaces,
  ]);

  useEffect(() => {
    const input =
      searchInput.trim();

    if (!input) {
      setAddressSuggestions([]);
      return;
    }

    const compactInput =
      compactRegionText(input);

    const cityMatches =
      REGION_SEARCH_ITEMS
        .filter((item) =>
          Boolean(item.city)
        )
        .flatMap((item) => {
          const city =
            item.city!;

          const cityShort =
            city.replace(
              /(시|군|구)$/,
              ""
            );

          const prefixes =
            new Set<string>();

          item.aliases.forEach(
            (alias) => {
              prefixes.add(
                compactRegionText(
                  alias
                )
              );

              prefixes.add(
                compactRegionText(
                  alias.replace(
                    /(시|군|구)$/,
                    ""
                  )
                )
              );
            }
          );

          prefixes.add(
            compactRegionText(city)
          );

          prefixes.add(
            compactRegionText(
              cityShort
            )
          );

          const matchingPrefixes =
            Array.from(prefixes)
              .filter(
                (prefix) =>
                  prefix.length >= 2 &&
                  compactInput.startsWith(
                    prefix
                  ) &&
                  compactInput.length >
                    prefix.length
              )
              .sort(
                (a, b) =>
                  b.length -
                  a.length
              );

          if (
            matchingPrefixes.length ===
            0
          ) {
            return [];
          }

          return [
            {
              region: item,
              prefix:
                matchingPrefixes[0],
            },
          ];
        })
        .sort(
          (a, b) =>
            b.prefix.length -
            a.prefix.length
        );

    const bestMatch =
      cityMatches[0];

    const requestId =
      ++addressSearchRequestRef.current;

    const timer =
      window.setTimeout(() => {
        const kakao =
          (window as any).kakao;

        if (
          !kakao?.maps?.services
            ?.Geocoder
        ) {
          setAddressSuggestions([]);
          return;
        }

        const geocoder =
          new kakao.maps.services
            .Geocoder();

        const addressSearch = (
          address: string,
          region?: RegionSearchItem
        ) =>
          new Promise<
            SearchSuggestion[]
          >((resolve) => {
            geocoder.addressSearch(
              address,
              (
                result: any[],
                status: any
              ) => {
                if (
                  status !==
                    kakao.maps.services
                      .Status.OK ||
                  !result?.length
                ) {
                  resolve([]);
                  return;
                }

                const suggestions =
                  result
                    .slice(0, 5)
                    .flatMap((item: any) => {
                      const rawAddress =
                        item.address_name ||
                        item.address
                          ?.address_name ||
                        address;

                      const matchedRegion =
                        region ||
                        findRegionItemForAddress(
                          rawAddress
                        );

                      if (!matchedRegion) {
                        return [];
                      }

                      const label =
                        getAdministrativeAreaLabel(
                          rawAddress
                        );

                      return [
                        {
                          kind: "address" as const,
                          label,
                          query: label,
                          meta: "읍·면·동",
                          region:
                            matchedRegion,
                        },
                      ];
                    });

                resolve(suggestions);
              },
              {
                analyze_type:
                  kakao.maps.services
                    .AnalyzeType
                    ?.SIMILAR ||
                  "SIMILAR",
                size: 10,
              }
            );
          });

        const keywordSearch = (
          keyword: string
        ) =>
          new Promise<
            SearchSuggestion[]
          >((resolve) => {
            if (
              !kakao.maps.services
                ?.Places
            ) {
              resolve([]);
              return;
            }

            const placesService =
              new kakao.maps.services
                .Places();

            placesService.keywordSearch(
              keyword,
              (
                result: any[],
                status: any
              ) => {
                if (
                  status !==
                    kakao.maps.services
                      .Status.OK ||
                  !result?.length
                ) {
                  resolve([]);
                  return;
                }

                const suggestions =
                  result
                    .slice(0, 10)
                    .flatMap((item: any) => {
                      const rawAddress =
                        item.address_name ||
                        item.road_address_name ||
                        "";

                      if (!rawAddress) {
                        return [];
                      }

                      const matchedRegion =
                        findRegionItemForAddress(
                          rawAddress
                        );

                      if (!matchedRegion) {
                        return [];
                      }

                      const label =
                        getAdministrativeAreaLabel(
                          rawAddress
                        );

                      const normalizedLabel =
                        compactRegionText(label);

                      const normalizedKeyword =
                        compactRegionText(
                          keyword
                        ).replace(
                          /(읍|면|동)$/,
                          ""
                        );

                      if (
                        normalizedKeyword &&
                        !normalizedLabel.includes(
                          normalizedKeyword
                        )
                      ) {
                        return [];
                      }

                      return [
                        {
                          kind: "address" as const,
                          label,
                          query: label,
                          meta: "읍·면·동",
                          region:
                            matchedRegion,
                        },
                      ];
                    });

                resolve(suggestions);
              },
              { size: 15 }
            );
          });

        const jobs: Promise<
          SearchSuggestion[]
        >[] = [];

        if (bestMatch) {
          let remainder =
            compactInput.slice(
              bestMatch.prefix.length
            );

          remainder =
            remainder.replace(
              /^(시|군|구)/,
              ""
            );

          if (remainder) {
            const alreadyHasSuffix =
              /(읍|면|동)$/.test(
                remainder
              );

            const endings =
              alreadyHasSuffix
                ? [""]
                : ["", "읍", "면", "동"];

            endings.forEach(
              (ending) => {
                jobs.push(
                  addressSearch(
                    `${bestMatch.region.province} ${bestMatch.region.city} ${remainder}${ending}`,
                    bestMatch.region
                  )
                );
              }
            );
          }
        } else if (
          compactInput.length >= 2
        ) {
          const alreadyHasSuffix =
            /(읍|면|동)$/.test(
              compactInput
            );

          const endings =
            alreadyHasSuffix
              ? [""]
              : ["", "읍", "면", "동"];

          endings.forEach(
            (ending) => {
              const candidate =
                `${compactInput}${ending}`;

              jobs.push(
                addressSearch(candidate)
              );

              jobs.push(
                keywordSearch(candidate)
              );
            }
          );
        }

        if (jobs.length === 0) {
          setAddressSuggestions([]);
          return;
        }

        Promise.all(jobs).then(
          (groups) => {
            if (
              requestId !==
              addressSearchRequestRef.current
            ) {
              return;
            }

            const unique =
              new Map<
                string,
                SearchSuggestion
              >();

            groups
              .flat()
              .forEach((item) => {
                unique.set(
                  item.label,
                  item
                );
              });

            setAddressSuggestions(
              Array.from(
                unique.values()
              ).slice(0, 6)
            );
          }
        );
      }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const suggestions =
    useMemo<SearchSuggestion[]>(
      () => {
        const input =
          searchInput.trim();

        if (!input) {
          return [];
        }

        const normalized =
          normalizeSearchText(
            input
          );

        const regionSuggestions:
          SearchSuggestion[] =
          REGION_SEARCH_ITEMS
            .map((region) => {
              const aliasValues =
                region.aliases.map(
                  (alias) =>
                    normalizeSearchText(
                      alias
                    )
                );

              let score = 99;

              if (
                aliasValues.some(
                  (alias) =>
                    alias === normalized
                )
              ) {
                score = 0;
              } else if (
                aliasValues.some(
                  (alias) =>
                    alias.startsWith(
                      normalized
                    )
                )
              ) {
                score = 1;
              } else if (
                aliasValues.some(
                  (alias) =>
                    alias.includes(
                      normalized
                    )
                )
              ) {
                score = 2;
              } else {
                return null;
              }

              return {
                region,
                score,
              };
            })
            .filter(
              (
                item
              ): item is {
                region: RegionSearchItem;
                score: number;
              } =>
                item !== null
            )
            .sort(
              (a, b) =>
                a.score -
                  b.score ||
                Number(
                  Boolean(
                    a.region.city
                  )
                ) -
                  Number(
                    Boolean(
                      b.region.city
                    )
                  ) ||
                a.region.label.localeCompare(
                  b.region.label,
                  "ko"
                )
            )
            .slice(0, 6)
            .map(({ region }) => ({
              kind: "region",
              label:
                region.label,
              query:
                region.label,
              meta:
                region.city
                  ? "시·군·구"
                  : "시·도",
              region,
            }));

        const placeSuggestions:
          SearchSuggestion[] =
          searchablePlaces
            .filter((place) =>
              place.searchableText.includes(
                normalized
              )
            )
            .slice(0, 5)
            .map((place) => ({
              kind: "place",
              label:
                place.name,
              query:
                place.name,
              meta:
                [
                  place.region,
                  place.city,
                ]
                  .filter(Boolean)
                  .join(" "),
              placeId:
                place.id,
            }));

        return [
          ...regionSuggestions,
          ...addressSuggestions,
          ...placeSuggestions,
        ].slice(0, 10);
      },
      [
        searchInput,
        searchablePlaces,
        addressSuggestions,
      ]
    );

  const baseFilteredPlaces =
    useMemo(() => {
      const normalized =
        normalizeSearchText(
          appliedSearch
        );

      return places.filter(
        (place) => {
          let searchMatch = true;

          if (
            selectedRegionTarget
          ) {
            const placeRegion =
              normalizeSearchText(
                place.region
              );

            const targetProvinceNames =
              [
                selectedRegionTarget.province,
                ...REGION_SEARCH_ITEMS
                  .filter(
                    (item) =>
                      item.province ===
                        selectedRegionTarget.province &&
                      !item.city
                  )
                  .flatMap(
                    (item) =>
                      item.aliases
                  ),
              ].map(
                normalizeSearchText
              );

            const provinceMatch =
              targetProvinceNames.some(
                (name) =>
                  placeRegion.includes(
                    name
                  ) ||
                  name.includes(
                    placeRegion
                  )
              );

            const cityMatch =
              !selectedRegionTarget.city ||
              normalizeSearchText(
                place.city
              ).includes(
                normalizeSearchText(
                  selectedRegionTarget.city
                )
              ) ||
              normalizeSearchText(
                selectedRegionTarget.city
              ).includes(
                normalizeSearchText(
                  place.city
                )
              );

            searchMatch =
              provinceMatch &&
              cityMatch;
          } else if (normalized) {
            searchMatch =
              normalizeSearchText(
                [
                  place.name,
                  place.region,
                  place.city,
                  `${place.region} ${place.city}`,
                ].join(" ")
              ).includes(
                normalized
              );
          }

          const typeMatch =
            selectedFilter ===
              "all" ||
            place.place_type ===
              selectedFilter;

          return (
            searchMatch &&
            typeMatch
          );
        }
      );
    }, [
      places,
      appliedSearch,
      selectedFilter,
      selectedRegionTarget,
    ]);

  const filteredPlaces =
    useMemo(() => {
      if (
        !sortByDistance ||
        !currentLocation
      ) {
        return baseFilteredPlaces;
      }

      return [
        ...baseFilteredPlaces,
      ].sort(
        (a, b) =>
          getDistanceKm(
            currentLocation,
            {
              latitude:
                a.latitude,
              longitude:
                a.longitude,
            }
          ) -
          getDistanceKm(
            currentLocation,
            {
              latitude:
                b.latitude,
              longitude:
                b.longitude,
            }
          )
      );
    }, [
      baseFilteredPlaces,
      sortByDistance,
      currentLocation,
    ]);

  const mapPlaces: MapPlace[] =
    useMemo(
      () =>
        filteredPlaces.map(
          (place) => ({
            id: place.id,
            name: place.name,
            slug: place.slug,
            place_type:
              place.place_type,
            latitude:
              place.latitude,
            longitude:
              place.longitude,
          })
        ),
      [filteredPlaces]
    );

  useEffect(() => {
    if (
      selectedPlaceId === null
    ) {
      return;
    }

    const selectedExists =
      filteredPlaces.some(
        (place) =>
          String(place.id) ===
          String(
            selectedPlaceId
          )
      );

    if (!selectedExists) {
      setSelectedPlaceId(
        null
      );
    }
  }, [
    filteredPlaces,
    selectedPlaceId,
  ]);

  useEffect(() => {
    if (
      selectedPlaceId === null
    ) {
      return;
    }

    const selectedCard =
      cardRefs.current[
        String(selectedPlaceId)
      ];

    selectedCard?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedPlaceId]);

  const getFilterCount = (
    filter: PlaceFilter
  ) => {
    const basePlaces =
      places.filter(
        (place) => {
          if (
            selectedRegionTarget
          ) {
            const provinceNames =
              [
                selectedRegionTarget.province,
                ...REGION_SEARCH_ITEMS
                  .filter(
                    (item) =>
                      item.province ===
                        selectedRegionTarget.province &&
                      !item.city
                  )
                  .flatMap(
                    (item) =>
                      item.aliases
                  ),
              ].map(
                normalizeSearchText
              );

            const provinceMatch =
              provinceNames.some(
                (name) => {
                  const placeRegion =
                    normalizeSearchText(
                      place.region
                    );

                  return (
                    placeRegion.includes(
                      name
                    ) ||
                    name.includes(
                      placeRegion
                    )
                  );
                }
              );

            const cityMatch =
              !selectedRegionTarget.city ||
              normalizeSearchText(
                place.city
              ).includes(
                normalizeSearchText(
                  selectedRegionTarget.city
                )
              ) ||
              normalizeSearchText(
                selectedRegionTarget.city
              ).includes(
                normalizeSearchText(
                  place.city
                )
              );

            return (
              provinceMatch &&
              cityMatch
            );
          }

          const normalized =
            normalizeSearchText(
              appliedSearch
            );

          if (!normalized) {
            return true;
          }

          return normalizeSearchText(
            [
              place.name,
              place.region,
              place.city,
              `${place.region} ${place.city}`,
            ].join(" ")
          ).includes(
            normalized
          );
        }
      );

    if (filter === "all") {
      return basePlaces.length;
    }

    return basePlaces.filter(
      (place) =>
        place.place_type ===
        filter
    ).length;
  };

  const applySearch = (
    value: string
  ) => {
    const nextValue =
      value.trim();

    setSearchInput(
      nextValue
    );

    setAppliedSearch(
      nextValue
    );

    setSelectedRegionTarget(
      null
    );

    setFreeRegionSearch(
      nextValue
    );

    setSelectedPlaceId(
      null
    );

    setSearchOpen(
      false
    );

    setAddressSuggestions([]);
  };

  const handleSubmit = (
    event: FormEvent
  ) => {
    event.preventDefault();

    const input = searchInput.trim();

    if (!input) {
      return;
    }

    const normalizedInput =
      normalizeSearchText(input);

    /*
     * 1. 등록된 장소명이 정확하게 일치하면
     *    장소 검색을 최우선 처리
     */
    const exactPlaceSuggestion =
      suggestions.find(
        (
          suggestion
        ): suggestion is Extract<
          SearchSuggestion,
          { kind: "place" }
        > =>
          suggestion.kind === "place" &&
          normalizeSearchText(
            suggestion.label
          ) === normalizedInput
      );

    if (exactPlaceSuggestion) {
      applySearch(
        exactPlaceSuggestion.query
      );

      setSelectedPlaceId(
        exactPlaceSuggestion.placeId
      );

      return;
    }

    /*
     * 2. 읍·면·동 주소 후보가 있으면
     *    자동완성을 클릭한 것과 동일하게 처리
     */
    const addressSuggestion =
      suggestions.find(
        (
          suggestion
        ): suggestion is Extract<
          SearchSuggestion,
          { kind: "address" }
        > =>
          suggestion.kind === "address"
      );

    if (addressSuggestion) {
      applyAddressSearch(
        addressSuggestion
      );

      return;
    }

    /*
     * 3. 시·도 / 시·군·구 검색 후보가 있으면
     *    해당 행정지역으로 이동
     */
    const regionSuggestion =
      suggestions.find(
        (
          suggestion
        ): suggestion is Extract<
          SearchSuggestion,
          { kind: "region" }
        > =>
          suggestion.kind === "region"
      );

    if (regionSuggestion) {
      applyRegionSearch(
        regionSuggestion.region
      );

      return;
    }

    /*
     * 4. 자동완성 후보가 없는 일반 검색어
     */
    applySearch(input);
  };

  const clearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    setSelectedRegionTarget(
      null
    );
    setFreeRegionSearch("");
    setSelectedPlaceId(
      null
    );
    setSearchOpen(
      false
    );

    setAddressSuggestions([]);
  };

  const applyRegionSearch = (
    region: RegionSearchItem
  ) => {
    setSearchInput(
      region.label
    );

    setAppliedSearch(
      region.label
    );

    setSelectedRegionTarget(
      region
    );

    setFreeRegionSearch("");

    setSelectedPlaceId(
      null
    );

    setSearchOpen(
      false
    );
  };

  const applyAddressSearch = (
    suggestion: Extract<
      SearchSuggestion,
      { kind: "address" }
    >
  ) => {
    setSearchInput(
      suggestion.label
    );

    setAppliedSearch(
      suggestion.label
    );

    // 목록은 해당 시·군·구 기준으로 유지
    setSelectedRegionTarget(
      suggestion.region
    );

    // 지도는 선택한 읍·면·동으로 정확히 이동
    setFreeRegionSearch(
      suggestion.label
    );

    setSelectedPlaceId(
      null
    );

    setSearchOpen(
      false
    );
  };

  const mapFocusLocation:
    MapFocusLocation | null =
    freeRegionSearch
      ? {
          key:
            `free-${freeRegionSearch}`,
          address:
            freeRegionSearch,
          level: 6,
        }
      : selectedRegionTarget
        ? {
            key:
              selectedRegionTarget.key,
            address:
              selectedRegionTarget.label,
            latitude:
              selectedRegionTarget.latitude,
            longitude:
              selectedRegionTarget.longitude,
            level:
              selectedRegionTarget.level,
          }
        : null;

  const selectPlace = (
    placeId: string | number
  ) => {
    setSelectedPlaceId(
      placeId
    );
  };

  return (
    <section className="mom-map-explorer">
      <div className="mom-map-shell">
        <div className="mom-map-desktop-list">
          <div className="mom-map-list-heading">
            <div>
              <span>
                {appliedSearch
                  ? appliedSearch
                  : "현재 지도"}
              </span>

              <strong>
                {getTypeLabel(
                  selectedFilter === "all"
                    ? "attraction"
                    : selectedFilter
                )}{" "}
                {filteredPlaces.length}곳
              </strong>
            </div>

            <button
              type="button"
              className={[
                "mom-map-distance-button",
                sortByDistance
                  ? "active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={!currentLocation}
              onClick={() =>
                setSortByDistance(
                  (current) => !current
                )
              }
            >
              <Navigation
                size={14}
                aria-hidden="true"
              />
              가까운순
            </button>
          </div>

          <div className="mom-map-list-scroll">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map(
                (place) => {
                  const isSelected =
                    String(place.id) ===
                    String(
                      selectedPlaceId
                    );

                  const imageSrc =
                    place.image_url ||
                    "/main-valley.jpg";

                  return (
                    <article
                      key={String(
                        place.id
                      )}
                      ref={(element) => {
                        cardRefs.current[
                          String(place.id)
                        ] = element;
                      }}
                      className={[
                        "mom-map-place-card",
                        isSelected
                          ? "is-selected"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        selectPlace(
                          place.id
                        )
                      }
                    >
                      <div
                        className="mom-map-place-thumb"
                        style={{
                          backgroundImage:
                            `url("${imageSrc}")`,
                        }}
                      />

                      <div className="mom-map-place-copy">
                        <span>
                          {place.region}{" "}
                          {place.city}
                          {currentLocation && (
                            <>
                              {" · "}
                              {formatDistance(
                                getDistanceKm(
                                  currentLocation,
                                  {
                                    latitude:
                                      place.latitude,
                                    longitude:
                                      place.longitude,
                                  }
                                )
                              )}
                            </>
                          )}
                        </span>

                        <strong>
                          {place.name}
                        </strong>

                        <p>
                          {place.summary ||
                            "부모님과 함께 둘러보기 좋은 장소입니다."}
                        </p>

                        <Link
                          href={`/places/${place.slug}`}
                          onClick={(
                            event
                          ) =>
                            event.stopPropagation()
                          }
                        >
                          자세히 보기
                        </Link>
                      </div>
                    </article>
                  );
                }
              )
            ) : (
              <div className="mom-map-empty">
                <MapPin
                  size={24}
                  aria-hidden="true"
                />
                <strong>
                  등록된 장소가 없어요.
                </strong>
                <p>
                  다른 지역이나 카테고리를
                  확인해보세요.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mom-map-stage">
          <KakaoMap
            places={mapPlaces}
            selectedPlaceId={
              selectedPlaceId
            }
            onSelectPlace={
              selectPlace
            }
            focusLocation={
              mapFocusLocation
            }
            onCurrentLocation={(
              location
            ) => {
              setCurrentLocation(
                location
              );
            }}
          />

          <div className="mom-map-search-overlay">
            <button
              type="button"
              className="mom-map-back-button"
              onClick={() => {
                if (
                  typeof window !==
                  "undefined"
                ) {
                  window.history.back();
                }
              }}
              aria-label="뒤로 가기"
            >
              <ArrowLeft
                size={21}
                aria-hidden="true"
              />
            </button>

            <form
              className="mom-map-search-form"
              onSubmit={
                handleSubmit
              }
            >
              <Search
                size={20}
                aria-hidden="true"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(
                  event
                ) => {
                  setSearchInput(
                    event.target.value
                  );
                  setSearchOpen(true);
                }}
                onFocus={() =>
                  setSearchOpen(true)
                }
                placeholder="지역이나 장소를 검색해보세요"
                aria-label="지역 또는 장소 검색"
                autoComplete="off"
              />

              {searchInput && (
                <button
                  type="button"
                  className="mom-map-search-clear"
                  onClick={
                    clearSearch
                  }
                  aria-label="검색어 지우기"
                >
                  <X
                    size={17}
                    aria-hidden="true"
                  />
                </button>
              )}

              <button
                type="submit"
                className="mom-map-search-submit"
              >
                검색
              </button>

              {searchOpen &&
                suggestions.length >
                  0 && (
                <div className="mom-map-search-suggestions">
                  {suggestions.map(
                    (
                      suggestion,
                      index
                    ) => (
                      <button
                        key={`${suggestion.kind}-${suggestion.label}-${index}`}
                        type="button"
                        className="mom-map-search-suggestion"
                        onClick={() => {
                          if (
                            suggestion.kind ===
                            "region"
                          ) {
                            applyRegionSearch(
                              suggestion.region
                            );
                          } else if (
                            suggestion.kind ===
                            "address"
                          ) {
                            applyAddressSearch(
                              suggestion
                            );
                          } else {
                            applySearch(
                              suggestion.query
                            );
                            setSelectedPlaceId(
                              suggestion.placeId
                            );
                          }
                        }}
                      >
                        <span>
                          {suggestion.kind ===
                          "place" ? (
                            <MapPin
                              size={15}
                              aria-hidden="true"
                            />
                          ) : (
                            <Search
                              size={15}
                              aria-hidden="true"
                            />
                          )}
                        </span>

                        <div>
                          <strong>
                            {suggestion.label}
                          </strong>
                          <small>
                            {suggestion.meta}
                          </small>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </form>
          </div>

          <div
            className="mom-map-category-rail"
            role="group"
            aria-label="장소 유형 선택"
          >
            {FILTERS.map(
              (filter) => {
                const isActive =
                  selectedFilter ===
                  filter.value;

                return (
                  <button
                    key={
                      filter.value
                    }
                    type="button"
                    onClick={() => {
                      setSelectedFilter(
                        filter.value
                      );
                      setSelectedPlaceId(
                        null
                      );
                    }}
                    className={[
                      "mom-map-category-button",
                      `is-${filter.value}`,
                      isActive
                        ? "active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={
                      isActive
                    }
                  >
                    <FilterIcon
                      type={
                        filter.value
                      }
                    />

                    <span>
                      {filter.label}
                    </span>

                    <small>
                      {getFilterCount(
                        filter.value
                      )}
                    </small>
                  </button>
                );
              }
            )}
          </div>

          <button
            type="button"
            className="mom-map-list-toggle"
            onClick={() =>
              setListOpen(
                (current) =>
                  !current
              )
            }
            aria-expanded={
              listOpen
            }
          >
            <span aria-hidden="true">
              ≡
            </span>
            목록
            <small>
              {filteredPlaces.length}
            </small>
          </button>
        </div>

        <div
          className={[
            "mom-map-mobile-sheet",
            listOpen
              ? "is-open"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="mom-map-sheet-handle" />

          <div className="mom-map-sheet-heading">
            <div>
              <span>
                {appliedSearch
                  ? appliedSearch
                  : "현재 지도"}
              </span>
              <strong>
                {getTypeLabel(
                  selectedFilter === "all"
                    ? "attraction"
                    : selectedFilter
                )}{" "}
                {filteredPlaces.length}곳
              </strong>
            </div>

            <button
              type="button"
              onClick={() =>
                setListOpen(false)
              }
              aria-label="목록 닫기"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mom-map-mobile-list">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map(
                (place) => {
                  const imageSrc =
                    place.image_url ||
                    "/main-valley.jpg";

                  return (
                    <article
                      key={String(
                        place.id
                      )}
                      className="mom-map-mobile-card"
                      onClick={() => {
                        selectPlace(
                          place.id
                        );
                        setListOpen(
                          false
                        );
                      }}
                    >
                      <div
                        className="mom-map-mobile-thumb"
                        style={{
                          backgroundImage:
                            `url("${imageSrc}")`,
                        }}
                      />

                      <div>
                        <span>
                          {place.region}{" "}
                          {place.city}
                        </span>

                        <strong>
                          {place.name}
                        </strong>

                        <p>
                          {place.summary ||
                            "부모님과 함께 둘러보기 좋은 장소입니다."}
                        </p>

                        <Link
                          href={`/places/${place.slug}`}
                          onClick={(
                            event
                          ) =>
                            event.stopPropagation()
                          }
                        >
                          자세히 보기
                        </Link>
                      </div>
                    </article>
                  );
                }
              )
            ) : (
              <div className="mom-map-empty">
                <strong>
                  등록된 장소가 없어요.
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
