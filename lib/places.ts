import { createClient } from "@/lib/supabase/server";

export type PlaceType =
  | "attraction"
  | "restaurant"
  | "cafe"
  | "accommodation";

export type SeatingType =
  | "chair"
  | "floor"
  | "mixed";

export type PlaceFaqItem = {
  question: string;
  answer: string;
};

export type PlaceBlogReview = {
  title: string;
  url: string;
  source?: string | null;
  description?: string | null;
};
export type PlacePhoto = {
  id: number;
  place_id: number;
  image_url: string;
  sort_order: number;
  photographer_name: string | null;
  source_url: string | null;
  is_cover: boolean;
  created_at: string;
};
export type Place = {
  id: number;
  name: string;
  slug: string;

  place_type: PlaceType;

  region: string;
  city: string;
  address: string;

  /*
   * 지도 표시용 실제 장소 좌표
   */
  latitude: number | null;
  longitude: number | null;

  /*
   * 자동차 길찾기용 접근 좌표
   *
   * 주차장, 입구, 진입로 등
   * 자동차가 실제 접근할 수 있는 지점입니다.
   *
   * 값이 없으면 latitude / longitude를
   * 대신 사용합니다.
   */
  driving_latitude: number | null;
  driving_longitude: number | null;

  phone: string | null;
  website_url: string | null;

  summary: string;
  description: string | null;

  parent_recommendation: string | null;

  business_hours: string | null;
  closed_days: string | null;
  admission_fee: string | null;

  parking: boolean | null;
  restroom: boolean | null;

  walking_easy: boolean | null;
  nearby_cafe: boolean | null;

  seating_type: SeatingType | null;
  cuisine_type: string | null;

  environment_type:
    | "indoor"
    | "outdoor"
    | "mixed"
    | null;

  visit_tips: string[] | null;
  faq: PlaceFaqItem[] | null;
  blog_reviews: PlaceBlogReview[] | null;

  image_url: string | null;

  tags: string[];

  is_published: boolean;

  recommendation_score: number;

  is_editor_pick: boolean;
  is_partner: boolean;

  created_at: string;
  updated_at: string;
};

const PLACE_SELECT = `
  id,
  name,
  slug,
  place_type,
  region,
  city,
  address,
  latitude,
  longitude,
  driving_latitude,
  driving_longitude,
  phone,
  website_url,
  summary,
  description,
  parent_recommendation,
  business_hours,
  closed_days,
  admission_fee,
  parking,
  restroom,
  walking_easy,
  nearby_cafe,
  seating_type,
  cuisine_type,
  environment_type,
  visit_tips,
  faq,
  blog_reviews,
  image_url,
  tags,
  is_published,
  recommendation_score,
  is_editor_pick,
  is_partner,
  created_at,
  updated_at
`;

export async function getPublishedPlaces(): Promise<
  Place[]
> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq(
      "is_published",
      true
    )
    .order(
      "recommendation_score",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      "공개 장소 불러오기 실패:",
      error
    );

    return [];
  }

  return (data ?? []) as Place[];
}

export async function getPublishedPlacesByType(
  placeType: PlaceType,
  limit = 6
): Promise<Place[]> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq(
      "is_published",
      true
    )
    .eq(
      "place_type",
      placeType
    )
    .order(
      "recommendation_score",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(limit);

  if (error) {
    console.error(
      `${placeType} 장소 불러오기 실패:`,
      error
    );

    return [];
  }

  return (data ?? []) as Place[];
}

export async function getPublishedPlacesByRegion(
  region: string
): Promise<Place[]> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq(
      "is_published",
      true
    )
    .eq(
      "region",
      region
    )
    .order(
      "recommendation_score",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      `${region} 장소 불러오기 실패:`,
      error
    );

    return [];
  }

  return (data ?? []) as Place[];
}

export async function getPublishedPlaceBySlug(
  slug: string
): Promise<
  (Place & { photos: PlacePhoto[] }) | null
> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq(
      "slug",
      slug
    )
    .eq(
      "is_published",
      true
    )
    .maybeSingle();

  if (error) {
    console.error(
      "장소 상세정보 불러오기 실패:",
      error
    );

    return null;
  }

  if (!data) {
    return null;
  }

  const {
    data: photos,
    error: photosError,
  } = await supabase
    .from("place_photos")
    .select(`
      id,
      place_id,
      image_url,
      sort_order,
      photographer_name,
      source_url,
      is_cover,
      created_at
    `)
    .eq("place_id", data.id)
    .order("sort_order", {
      ascending: true,
    });

  if (photosError) {
    console.error(
      "장소 갤러리 사진 불러오기 실패:",
      photosError
    );
  }

  return {
    ...(data as Place),
    photos:
      (photos ?? []) as PlacePhoto[],
  };
}

/*
 * 상세페이지 주변 추천
 *
 * 1순위:
 * 같은 지역 + 같은 시·군·구
 *
 * 2순위:
 * 같은 지역의 다른 시·군·구
 *
 * 현재 보고 있는 장소는 제외합니다.
 */
export async function getRelatedPublishedPlaces({
  currentPlaceId,
  placeType,
  region,
  city,
  limit = 3,
}: {
  currentPlaceId: number;
  placeType: PlaceType;
  region: string;
  city: string;
  limit?: number;
}): Promise<Place[]> {
  const supabase =
    await createClient();

  /*
   * 1. 같은 시·군·구
   */
  const {
    data: cityData,
    error: cityError,
  } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq(
      "is_published",
      true
    )
    .eq(
      "place_type",
      placeType
    )
    .eq(
      "region",
      region
    )
    .eq(
      "city",
      city
    )
    .neq(
      "id",
      currentPlaceId
    )
    .order(
      "is_editor_pick",
      {
        ascending: false,
      }
    )
    .order(
      "recommendation_score",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(limit);

  if (cityError) {
    console.error(
      "주변 장소 시·군·구 검색 실패:",
      cityError
    );
  }

  const cityPlaces =
    (cityData ?? []) as Place[];

  if (
    cityPlaces.length >= limit
  ) {
    return cityPlaces.slice(
      0,
      limit
    );
  }

  /*
   * 같은 시·군·구에 부족하면
   * 같은 지역의 장소로 보충합니다.
   */
  const remaining =
    limit - cityPlaces.length;

  const {
    data: regionData,
    error: regionError,
  } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq(
      "is_published",
      true
    )
    .eq(
      "place_type",
      placeType
    )
    .eq(
      "region",
      region
    )
    .neq(
      "city",
      city
    )
    .neq(
      "id",
      currentPlaceId
    )
    .order(
      "is_editor_pick",
      {
        ascending: false,
      }
    )
    .order(
      "recommendation_score",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(remaining);

  if (regionError) {
    console.error(
      "주변 장소 지역 검색 실패:",
      regionError
    );

    return cityPlaces;
  }

  return [
    ...cityPlaces,
    ...((regionData ??
      []) as Place[]),
  ].slice(
    0,
    limit
  );
}