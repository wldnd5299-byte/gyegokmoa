"use client";

import {
  ArrowDown,
  ArrowUp,
  Coffee,
  Hotel,
  MapPin,
  Plus,
  Search,
  Trash2,
  Utensils,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

type AdminPlace = {
  id: number;
  name: string;
  slug: string;
  place_type: string;
  region: string;
  city: string;
  image_url: string | null;
};

export type AdminCourseInitialStop = {
  placeId: string | number;
  note?: string | null;
};

type AdminCoursePlaceSelectorProps = {
  places: AdminPlace[];
  maxStops?: number;
  initialStops?: AdminCourseInitialStop[];
};

type StopItem = {
  key: number;
  placeId: string;
  note: string;
};

function placeTypeLabel(type: string) {
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
      return type;
  }
}

function PlaceIcon({
  type,
}: {
  type: string;
}) {
  if (type === "restaurant") {
    return <Utensils size={15} />;
  }

  if (type === "cafe") {
    return <Coffee size={15} />;
  }

  if (type === "accommodation") {
    return <Hotel size={15} />;
  }

  return <MapPin size={15} />;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "");
}

export default function AdminCoursePlaceSelector({
  places,
  maxStops = 10,
  initialStops = [],
}: AdminCoursePlaceSelectorProps) {
  const initialItems: StopItem[] =
    initialStops.length > 0
      ? initialStops.map(
          (stop, index) => ({
            key: index + 1,
            placeId: String(
              stop.placeId
            ),
            note: stop.note ?? "",
          })
        )
      : [
          {
            key: 1,
            placeId: "",
            note: "",
          },
          {
            key: 2,
            placeId: "",
            note: "",
          },
          {
            key: 3,
            placeId: "",
            note: "",
          },
        ];

  const [stops, setStops] =
    useState<StopItem[]>(
      initialItems
    );

  const [nextKey, setNextKey] =
    useState(
      initialItems.length + 1
    );

  const [
    searchTerms,
    setSearchTerms,
  ] = useState<
    Record<number, string>
  >({});

  const [
    openStopKey,
    setOpenStopKey,
  ] = useState<number | null>(
    null
  );

  const selectedIds =
    useMemo(
      () =>
        stops
          .map(
            (stop) =>
              stop.placeId
          )
          .filter(Boolean)
          .map(Number),
      [stops]
    );

  function updateStop(
    key: number,
    patch: Partial<StopItem>
  ) {
    setStops((current) =>
      current.map((stop) =>
        stop.key === key
          ? {
              ...stop,
              ...patch,
            }
          : stop
      )
    );
  }

  function addStop() {
    if (
      stops.length >= maxStops
    ) {
      return;
    }

    setStops((current) => [
      ...current,
      {
        key: nextKey,
        placeId: "",
        note: "",
      },
    ]);

    setNextKey(
      (current) =>
        current + 1
    );
  }

  function removeStop(
    key: number
  ) {
    if (
      stops.length <= 1
    ) {
      return;
    }

    setStops((current) =>
      current.filter(
        (stop) =>
          stop.key !== key
      )
    );

    if (
      openStopKey === key
    ) {
      setOpenStopKey(null);
    }
  }

  function moveStop(
    index: number,
    direction:
      | "up"
      | "down"
  ) {
    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        stops.length
    ) {
      return;
    }

    setStops((current) => {
      const next = [
        ...current,
      ];

      [
        next[index],
        next[targetIndex],
      ] = [
        next[targetIndex],
        next[index],
      ];

      return next;
    });
  }

  function getFilteredPlaces(
    stopKey: number
  ) {
    const search =
      normalize(
        searchTerms[stopKey] ||
          ""
      );

    if (!search) {
      return places;
    }

    return places.filter(
      (place) => {
        const target =
          normalize(
            [
              place.name,
              place.region,
              place.city,
              placeTypeLabel(
                place.place_type
              ),
            ].join(" ")
          );

        return target.includes(
          search
        );
      }
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      {stops.map(
        (stop, index) => {
          const order =
            index + 1;

          const selectedPlace =
            places.find(
              (place) =>
                String(
                  place.id
                ) ===
                stop.placeId
            );

          const filteredPlaces =
            getFilteredPlaces(
              stop.key
            );

          return (
            <div
              key={stop.key}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "48px minmax(0, 1fr)",
                gap: "12px",
                padding: "14px",
                border:
                  "1px solid #dde7e2",
                borderRadius:
                  "14px",
                background:
                  "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "42px",
                    height: "42px",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    borderRadius:
                      "50%",
                    background:
                      "#e8f2ed",
                    color:
                      "#2e6654",
                    fontWeight: 900,
                  }}
                >
                  {order}
                </span>

                <button
                  type="button"
                  disabled={
                    index === 0
                  }
                  onClick={() =>
                    moveStop(
                      index,
                      "up"
                    )
                  }
                  title="위로 이동"
                  style={{
                    ...smallIconButton,
                    opacity:
                      index === 0
                        ? 0.35
                        : 1,
                  }}
                >
                  <ArrowUp
                    size={14}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    index ===
                    stops.length - 1
                  }
                  onClick={() =>
                    moveStop(
                      index,
                      "down"
                    )
                  }
                  title="아래로 이동"
                  style={{
                    ...smallIconButton,
                    opacity:
                      index ===
                      stops.length -
                        1
                        ? 0.35
                        : 1,
                  }}
                >
                  <ArrowDown
                    size={14}
                  />
                </button>
              </div>

              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0,1fr) auto",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      position:
                        "relative",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenStopKey(
                          openStopKey ===
                            stop.key
                            ? null
                            : stop.key
                        )
                      }
                      style={
                        selectButtonStyle
                      }
                    >
                      {selectedPlace ? (
                        <span
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            minWidth: 0,
                          }}
                        >
                          <PlaceIcon
                            type={
                              selectedPlace.place_type
                            }
                          />

                          <strong>
                            {
                              selectedPlace.name
                            }
                          </strong>

                          <small
                            style={{
                              color:
                                "#8b9691",
                            }}
                          >
                            {
                              selectedPlace.region
                            }{" "}
                            {
                              selectedPlace.city
                            }
                          </small>
                        </span>
                      ) : (
                        <span>
                          장소 선택
                        </span>
                      )}

                      <Search
                        size={16}
                      />
                    </button>

                    {openStopKey ===
                      stop.key && (
                      <div
                        style={
                          dropdownStyle
                        }
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            padding:
                              "11px 12px",
                            borderBottom:
                              "1px solid #edf1ef",
                          }}
                        >
                          <Search
                            size={16}
                          />

                          <input
                            value={
                              searchTerms[
                                stop.key
                              ] || ""
                            }
                            onChange={(
                              event
                            ) =>
                              setSearchTerms(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  [stop.key]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder="장소명, 지역, 시·군·구 검색"
                            autoFocus
                            style={{
                              flex: 1,
                              border: 0,
                              outline: 0,
                              fontSize:
                                "14px",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            maxHeight:
                              "300px",
                            overflowY:
                              "auto",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              updateStop(
                                stop.key,
                                {
                                  placeId:
                                    "",
                                }
                              );
                              setOpenStopKey(
                                null
                              );
                            }}
                            style={
                              dropdownButtonStyle
                            }
                          >
                            선택 안 함
                          </button>

                          {filteredPlaces.map(
                            (place) => {
                              const alreadyUsed =
                                selectedIds.includes(
                                  place.id
                                ) &&
                                String(
                                  place.id
                                ) !==
                                  stop.placeId;

                              return (
                                <button
                                  key={
                                    place.id
                                  }
                                  type="button"
                                  disabled={
                                    alreadyUsed
                                  }
                                  onClick={() => {
                                    updateStop(
                                      stop.key,
                                      {
                                        placeId:
                                          String(
                                            place.id
                                          ),
                                      }
                                    );
                                    setOpenStopKey(
                                      null
                                    );
                                  }}
                                  style={{
                                    ...dropdownButtonStyle,
                                    opacity:
                                      alreadyUsed
                                        ? 0.45
                                        : 1,
                                    cursor:
                                      alreadyUsed
                                        ? "not-allowed"
                                        : "pointer",
                                  }}
                                >
                                  [
                                  {placeTypeLabel(
                                    place.place_type
                                  )}
                                  ]{" "}
                                  {
                                    place.region
                                  }{" "}
                                  {
                                    place.city
                                  }{" "}
                                  -{" "}
                                  {
                                    place.name
                                  }

                                  {alreadyUsed
                                    ? " · 이미 선택됨"
                                    : ""}
                                </button>
                              );
                            }
                          )}

                          {filteredPlaces.length ===
                            0 && (
                            <div
                              style={{
                                padding:
                                  "22px",
                                color:
                                  "#8b9691",
                                textAlign:
                                  "center",
                                fontSize:
                                  "12px",
                              }}
                            >
                              검색되는 장소가 없습니다.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeStop(
                        stop.key
                      )
                    }
                    disabled={
                      stops.length <= 1
                    }
                    title="삭제"
                    style={
                      deleteButtonStyle
                    }
                  >
                    <Trash2
                      size={17}
                    />
                  </button>
                </div>

                <input
                  type="hidden"
                  name={`place_${order}`}
                  value={
                    stop.placeId
                  }
                />

                <input
                  type="text"
                  name={`note_${order}`}
                  value={stop.note}
                  onChange={(
                    event
                  ) =>
                    updateStop(
                      stop.key,
                      {
                        note:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="선택사항: 이 장소에서의 추천 포인트"
                  style={
                    noteStyle
                  }
                />
              </div>
            </div>
          );
        }
      )}

      <button
        type="button"
        onClick={addStop}
        disabled={
          stops.length >=
          maxStops
        }
        style={
          addButtonStyle
        }
      >
        <Plus size={17} />
        장소 추가
      </button>

      <p
        style={{
          margin: 0,
          color: "#929e98",
          fontSize: "11px",
        }}
      >
        장소는 최대 {maxStops}곳까지
        추가할 수 있습니다.
      </p>
    </div>
  );
}

const smallIconButton = {
  width: "26px",
  height: "26px",
  display: "flex",
  alignItems: "center",
  justifyContent:
    "center",
  border:
    "1px solid #d7e2dd",
  borderRadius: "7px",
  background: "#fff",
  color: "#507166",
  cursor: "pointer",
};

const selectButtonStyle = {
  width: "100%",
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
  gap: "10px",
  padding: "0 14px",
  border:
    "1px solid #ccd9d4",
  borderRadius: "11px",
  background: "#fff",
  color: "#284d40",
  cursor: "pointer",
};

const dropdownStyle = {
  position:
    "absolute" as const,
  zIndex: 40,
  left: 0,
  right: 0,
  top: "calc(100% + 7px)",
  overflow: "hidden",
  border:
    "1px solid #dbe5e0",
  borderRadius: "13px",
  background: "#fff",
  boxShadow:
    "0 12px 32px rgba(27,63,51,.14)",
};

const dropdownButtonStyle = {
  width: "100%",
  minHeight: "44px",
  padding: "9px 14px",
  border: 0,
  borderBottom:
    "1px solid #edf1ef",
  background: "#fff",
  textAlign:
    "left" as const,
  color: "#37574c",
  cursor: "pointer",
};

const deleteButtonStyle = {
  width: "46px",
  height: "46px",
  display: "flex",
  alignItems: "center",
  justifyContent:
    "center",
  border:
    "1px solid #ead9d4",
  borderRadius: "11px",
  background: "#fffafa",
  color: "#a75f52",
  cursor: "pointer",
};

const noteStyle = {
  width: "100%",
  minHeight: "46px",
  marginTop: "9px",
  padding: "0 13px",
  border:
    "1px solid #ccd9d4",
  borderRadius: "11px",
  fontSize: "14px",
};

const addButtonStyle = {
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent:
    "center",
  gap: "7px",
  border:
    "1px dashed #9fbab0",
  borderRadius: "13px",
  background: "#f9fcfa",
  color: "#356b59",
  fontWeight: 800,
  cursor: "pointer",
};