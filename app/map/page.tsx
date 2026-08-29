import PlaceMapExplorer, {
  type PlaceMapItem,
} from "@/components/PlaceMapExplorer";

import {
  getPublishedPlaces,
} from "@/lib/places";

type MapPageProps = {
  searchParams: Promise<{
    type?: string;
    q?: string;
    place?: string;
  }>;
};

function getInitialType(
  value: string | undefined
): PlaceMapItem["place_type"] | undefined {
  if (
    value === "attraction" ||
    value === "restaurant" ||
    value === "cafe" ||
    value === "accommodation"
  ) {
    return value;
  }

  return undefined;
}

export default async function MapPage({
  searchParams,
}: MapPageProps) {
  const params =
    await searchParams;

  const initialFilter =
    getInitialType(params.type);

  const initialSearch =
    params.q?.trim() ?? "";

  const initialPlaceSlug =
    params.place?.trim() ?? "";

  const places =
    await getPublishedPlaces();

  const mapPlaces: PlaceMapItem[] =
    places
      .filter(
        (place) =>
          typeof place.latitude === "number" &&
          typeof place.longitude === "number" &&
          (
            place.place_type === "attraction" ||
            place.place_type === "restaurant" ||
            place.place_type === "cafe" ||
            place.place_type === "accommodation"
          )
      )
      .map((place) => ({
        id: place.id,
        name: place.name,
        slug: place.slug,
        place_type:
          place.place_type as
            PlaceMapItem["place_type"],
        region:
          place.region || "",
        city:
          place.city || "",
        latitude:
          place.latitude as number,
        longitude:
          place.longitude as number,
        image_url:
          place.image_url || null,
        summary:
          place.summary || null,
      }));

  return (
    <main className="places-map-page places-map-page-v2">
      <PlaceMapExplorer
        places={mapPlaces}
        initialFilter={initialFilter}
        initialSearch={initialSearch}
        initialPlaceSlug={initialPlaceSlug}
      />
    </main>
  );
}
