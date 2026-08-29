import { createClient } from "@/lib/supabase/server";
import type {
  Place,
} from "@/lib/places";

export type Course = {
  id: number;

  title: string;
  slug: string;

  region: string;
  city: string | null;

  duration_label: string | null;

  summary: string;
  description: string | null;

  image_url: string | null;

  is_published: boolean;
  recommendation_score: number;

  created_at: string;
  updated_at: string;
};

export type CoursePlace = {
  id: number;

  course_id: number;
  place_id: number;

  stop_order: number;

  stop_note: string | null;

  created_at: string;

  place: Place;
};

export type CourseWithPlaces = Course & {
  places: CoursePlace[];
};

const COURSE_SELECT = `
  id,
  title,
  slug,
  region,
  city,
  duration_label,
  summary,
  description,
  image_url,
  is_published,
  recommendation_score,
  created_at,
  updated_at
`;

const COURSE_PLACE_SELECT = `
  id,
  course_id,
  place_id,
  stop_order,
  stop_note,
  created_at,
  place:places (
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
  )
`;

export async function getPublishedCourses(
  limit = 12
): Promise<Course[]> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("courses")
    .select(
      COURSE_SELECT
    )
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
    )
    .limit(limit);

  if (error) {
    console.error(
      "추천코스 불러오기 실패:",
      error
    );

    return [];
  }

  return (
    data ?? []
  ) as Course[];
}

export async function getPublishedCourseBySlug(
  slug: string
): Promise<CourseWithPlaces | null> {
  const supabase =
    await createClient();

  const {
    data: course,
    error: courseError,
  } = await supabase
    .from("courses")
    .select(
      COURSE_SELECT
    )
    .eq(
      "slug",
      slug
    )
    .eq(
      "is_published",
      true
    )
    .maybeSingle();

  if (
    courseError ||
    !course
  ) {
    if (courseError) {
      console.error(
        "추천코스 상세정보 불러오기 실패:",
        courseError
      );
    }

    return null;
  }

  const {
    data: coursePlaces,
    error: placesError,
  } = await supabase
    .from(
      "course_places"
    )
    .select(
      COURSE_PLACE_SELECT
    )
    .eq(
      "course_id",
      course.id
    )
    .order(
      "stop_order",
      {
        ascending: true,
      }
    );

  if (placesError) {
    console.error(
      "추천코스 장소 불러오기 실패:",
      placesError
    );

    return {
      ...(course as Course),
      places: [],
    };
  }

  return {
    ...(course as Course),

    places:
      (
        coursePlaces ?? []
      ) as unknown as CoursePlace[],
  };
}

export async function getPublishedCoursesWithPlaces(
  limit = 12
): Promise<CourseWithPlaces[]> {
  const courses =
    await getPublishedCourses(
      limit
    );

  if (
    courses.length === 0
  ) {
    return [];
  }

  const results =
    await Promise.all(
      courses.map(
        async (
          course
        ) => {
          const detail =
            await getPublishedCourseBySlug(
              course.slug
            );

          return (
            detail ?? {
              ...course,
              places: [],
            }
          );
        }
      )
    );

  return results;
}