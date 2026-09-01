import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PLACE_TYPES = new Set([
  "attraction",
  "restaurant",
  "cafe",
  "accommodation",
]);

const ALLOWED_ENVIRONMENT_TYPES = new Set([
  "",
  "indoor",
  "outdoor",
  "mixed",
]);

const ALLOWED_SEATING_TYPES = new Set([
  "",
  "chair",
  "floor",
  "mixed",
]);

function text(
  value: FormDataEntryValue | null
) {
  if (
    value === null ||
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function nullableText(
  value: FormDataEntryValue | null
) {
  const valueText = text(value);
  return valueText || null;
}

function nullableNumber(
  value: FormDataEntryValue | null
) {
  const valueText = text(value);

  if (!valueText) {
    return null;
  }

  const number = Number(valueText);

  return Number.isFinite(number)
    ? number
    : null;
}

function tagsValue(
  value: FormDataEntryValue | null
) {
  return text(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function visitTipsValue(
  value: FormDataEntryValue | null
): string[] | null {
  const valueText = text(value);

  if (!valueText) {
    return null;
  }

  const items = valueText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0
    ? items
    : null;
}

type FaqItem = {
  question: string;
  answer: string;
};

function faqValue(
  value: FormDataEntryValue | null
): FaqItem[] | null {
  const valueText = text(value);

  if (!valueText) {
    return null;
  }

  const items = valueText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex =
        line.indexOf("|");

      if (separatorIndex === -1) {
        return null;
      }

      const question =
        line
          .slice(0, separatorIndex)
          .trim();

      const answer =
        line
          .slice(separatorIndex + 1)
          .trim();

      if (!question || !answer) {
        return null;
      }

      return {
        question,
        answer,
      };
    })
    .filter(
      (item): item is FaqItem =>
        item !== null
    );

  return items.length > 0
    ? items
    : null;
}

type BlogReviewItem = {
  title: string;
  url: string;
  source: string | null;
  description: string | null;
};

function blogReviewsValue(
  value: FormDataEntryValue | null
): BlogReviewItem[] | null {
  const valueText = text(value);

  if (!valueText) {
    return null;
  }

  const items = valueText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line
        .split("|")
        .map((part) => part.trim());

      const title =
        parts[0] || "";

      const url =
        parts[1] || "";

      const source =
        parts[2] || null;

      const description =
        parts[3] || null;

      if (!title || !url) {
        return null;
      }

      try {
        const parsedUrl =
          new URL(url);

        if (
          ![
            "http:",
            "https:",
          ].includes(
            parsedUrl.protocol
          )
        ) {
          return null;
        }
      } catch {
        return null;
      }

      return {
        title,
        url,
        source,
        description,
      };
    })
    .filter(
      (
        item
      ): item is BlogReviewItem =>
        item !== null
    );

  return items.length > 0
    ? items
    : null;
}

function editUrl(
  request: Request,
  slug: string,
  type: "success" | "error",
  message: string
) {
  const safeSlug =
    encodeURIComponent(slug);

  const url = new URL(
    `/admin/places/${safeSlug}/edit`,
    request.url
  );

  url.searchParams.set(
    type,
    message
  );

  return url;
}

function redirectWithError(
  request: Request,
  slug: string,
  message: string
) {
  return NextResponse.redirect(
    editUrl(
      request,
      slug,
      "error",
      message
    ),
    303
  );
}

export async function POST(
  request: Request
) {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return NextResponse.redirect(
      new URL(
        "/admin/login?error=로그인이 필요합니다.",
        request.url
      ),
      303
    );
  }

  const {
    data: adminUser,
    error: adminError,
  } =
    await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    adminError ||
    !adminUser
  ) {
    return NextResponse.redirect(
      new URL(
        "/admin/login?error=관리자 권한이 없습니다.",
        request.url
      ),
      303
    );
  }

  const formData =
    await request.formData();

  const originalSlug =
    text(
      formData.get(
        "original_slug"
      )
    ).toLowerCase();

  const slug =
    text(
      formData.get(
        "slug"
      )
    ).toLowerCase();

  if (!originalSlug) {
    return NextResponse.redirect(
      new URL(
        "/admin/places?error=수정할 장소 정보가 없습니다.",
        request.url
      ),
      303
    );
  }

  if (
    slug !== originalSlug
  ) {
    return redirectWithError(
      request,
      originalSlug,
      "영문 식별자는 수정할 수 없습니다."
    );
  }

  const placeType =
    text(
      formData.get(
        "place_type"
      )
    );

  const name =
    text(
      formData.get(
        "name"
      )
    );

  const region =
    text(
      formData.get(
        "region"
      )
    );

  const city =
    text(
      formData.get(
        "city"
      )
    );

  const address =
    text(
      formData.get(
        "address"
      )
    );

  const phone =
    nullableText(
      formData.get(
        "phone"
      )
    );

  const websiteUrl =
    nullableText(
      formData.get(
        "website_url"
      )
    );

  const summary =
    text(
      formData.get(
        "summary"
      )
    );

  const description =
    nullableText(
      formData.get(
        "description"
      )
    );

  const parentRecommendation =
    nullableText(
      formData.get(
        "parent_recommendation"
      )
    );

  const businessHours =
    nullableText(
      formData.get(
        "business_hours"
      )
    );

  const closedDays =
    nullableText(
      formData.get(
        "closed_days"
      )
    );

  const admissionFee =
    nullableText(
      formData.get(
        "admission_fee"
      )
    );

  const environmentType =
    text(
      formData.get(
        "environment_type"
      )
    );

  const seatingType =
    text(
      formData.get(
        "seating_type"
      )
    );

  const cuisineType =
    nullableText(
      formData.get(
        "cuisine_type"
      )
    );

  const latitude =
    nullableNumber(
      formData.get(
        "latitude"
      )
    );

  const longitude =
    nullableNumber(
      formData.get(
        "longitude"
      )
    );

  const tags =
    tagsValue(
      formData.get(
        "tags"
      )
    );

  const visitTips =
    visitTipsValue(
      formData.get(
        "visit_tips"
      )
    );

  const faq =
    faqValue(
      formData.get(
        "faq"
      )
    );

  const blogReviews =
    blogReviewsValue(
      formData.get(
        "blog_reviews"
      )
    );

  const parking =
    formData.has(
      "parking"
    );

  const restroom =
    formData.has(
      "restroom"
    );

  const walkingEasy =
    formData.has(
      "walking_easy"
    )
      ? true
      : null;

  const nearbyCafe =
    formData.has(
      "nearby_cafe"
    )
      ? true
      : null;

  const isEditorPick =
    formData.has(
      "is_editor_pick"
    );

  const isPublished =
    formData.has(
      "is_published"
    );

  if (
    !ALLOWED_PLACE_TYPES.has(
      placeType
    )
  ) {
    return redirectWithError(
      request,
      originalSlug,
      "장소 유형이 올바르지 않습니다."
    );
  }

  if (!name) {
    return redirectWithError(
      request,
      originalSlug,
      "장소명을 입력해 주세요."
    );
  }

  if (!region) {
    return redirectWithError(
      request,
      originalSlug,
      "지역을 선택해 주세요."
    );
  }

  if (!city) {
    return redirectWithError(
      request,
      originalSlug,
      "시·군·구를 입력해 주세요."
    );
  }

  if (!address) {
    return redirectWithError(
      request,
      originalSlug,
      "주소를 입력해 주세요."
    );
  }

  if (!summary) {
    return redirectWithError(
      request,
      originalSlug,
      "한줄 소개를 입력해 주세요."
    );
  }

  if (
    !ALLOWED_ENVIRONMENT_TYPES.has(
      environmentType
    )
  ) {
    return redirectWithError(
      request,
      originalSlug,
      "실내/실외 값이 올바르지 않습니다."
    );
  }

  if (
    !ALLOWED_SEATING_TYPES.has(
      seatingType
    )
  ) {
    return redirectWithError(
      request,
      originalSlug,
      "좌석 형태 값이 올바르지 않습니다."
    );
  }

  if (
    latitude !== null &&
    (
      latitude < -90 ||
      latitude > 90
    )
  ) {
    return redirectWithError(
      request,
      originalSlug,
      "위도가 올바르지 않습니다."
    );
  }

  if (
    longitude !== null &&
    (
      longitude < -180 ||
      longitude > 180
    )
  ) {
    return redirectWithError(
      request,
      originalSlug,
      "경도가 올바르지 않습니다."
    );
  }

  const {
    data: existingPlace,
    error: existingPlaceError,
  } =
    await supabase
      .from("places")
      .select("id")
      .eq(
        "slug",
        originalSlug
      )
      .maybeSingle();

  if (
    existingPlaceError ||
    !existingPlace
  ) {
    return NextResponse.redirect(
      new URL(
        "/admin/places?error=수정할 장소를 찾을 수 없습니다.",
        request.url
      ),
      303
    );
  }

  const {
    error: updateError,
  } =
    await supabase
      .from("places")
      .update({
        name,
        place_type:
          placeType,
        region,
        city,
        address,
        latitude,
        longitude,
        phone,
        website_url:
          websiteUrl,
        summary,
        description,
        parent_recommendation:
          parentRecommendation,
        business_hours:
          businessHours,
        closed_days:
          closedDays,
        admission_fee:
          admissionFee,
        parking,
        restroom,
        walking_easy:
          walkingEasy,
        nearby_cafe:
          nearbyCafe,
        seating_type:
          seatingType || null,
        cuisine_type:
          cuisineType,
        environment_type:
          environmentType || null,
        visit_tips:
          visitTips,
        faq,
        blog_reviews:
          blogReviews,
        tags,
        is_editor_pick:
          isEditorPick,
        is_published:
          isPublished,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "slug",
        originalSlug
      );

  if (updateError) {
    return redirectWithError(
      request,
      originalSlug,
      `장소 수정 실패: ${updateError.message}`
    );
  }

  return NextResponse.redirect(
    editUrl(
      request,
      originalSlug,
      "success",
      `${name} 정보 수정 완료`
    ),
    303
  );
}
