import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "valley-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

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

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL(
    "/admin/places",
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
  message: string
) {
  return NextResponse.redirect(
    adminUrl(
      request,
      "error",
      message
    ),
    303
  );
}

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

  const number = Number(
    valueText
  );

  return Number.isFinite(number)
    ? number
    : null;
}

function tagsValue(
  value: FormDataEntryValue | null
) {
  return text(value)
    .split(",")
    .map((tag) =>
      tag.trim()
    )
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
    .map((item) =>
      item.trim()
    )
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
    .map((line) =>
      line.trim()
    )
    .filter(Boolean)
    .map((line) => {
      const separatorIndex =
        line.indexOf("|");

      if (
        separatorIndex === -1
      ) {
        return null;
      }

      const question =
        line
          .slice(
            0,
            separatorIndex
          )
          .trim();

      const answer =
        line
          .slice(
            separatorIndex + 1
          )
          .trim();

      if (
        !question ||
        !answer
      ) {
        return null;
      }

      return {
        question,
        answer,
      };
    })
    .filter(
      (
        item
      ): item is FaqItem =>
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
    .map((line) =>
      line.trim()
    )
    .filter(Boolean)
    .map((line) => {
      const parts = line
        .split("|")
        .map((part) =>
          part.trim()
        );

      const title =
        parts[0] || "";

      const url =
        parts[1] || "";

      const source =
        parts[2] || null;

      const description =
        parts[3] || null;

      if (
        !title ||
        !url
      ) {
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

export async function POST(
  request: Request
) {
  const supabase =
    await createClient();

  /*
   * 1. 로그인 확인
   */
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

  /*
   * 2. 관리자 권한 확인
   */
  const {
    data: adminUser,
    error: adminError,
  } =
    await supabase
      .from("admin_users")
      .select("user_id")
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

  if (
    adminError ||
    !adminUser
  ) {
    return redirectWithError(
      request,
      "관리자 권한이 없습니다."
    );
  }

  /*
   * 3. 폼 데이터 읽기
   */
  const formData =
    await request.formData();

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

  const slug =
    text(
      formData.get(
        "slug"
      )
    ).toLowerCase();

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

  /*
   * 상세페이지 추가 콘텐츠
   */
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

  /*
   * 편의 정보
   */
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

  /*
   * 4. 기본값 검사
   */
  if (
    !ALLOWED_PLACE_TYPES.has(
      placeType
    )
  ) {
    return redirectWithError(
      request,
      "장소 유형이 올바르지 않습니다."
    );
  }

  if (!name) {
    return redirectWithError(
      request,
      "장소명을 입력해 주세요."
    );
  }

  if (!slug) {
    return redirectWithError(
      request,
      "영문 식별자를 입력해 주세요."
    );
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug
    )
  ) {
    return redirectWithError(
      request,
      "영문 식별자는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
    );
  }

  if (!region) {
    return redirectWithError(
      request,
      "지역을 선택해 주세요."
    );
  }

  if (!city) {
    return redirectWithError(
      request,
      "시·군·구를 입력해 주세요."
    );
  }

  if (!address) {
    return redirectWithError(
      request,
      "주소를 입력해 주세요."
    );
  }

  if (!summary) {
    return redirectWithError(
      request,
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
      "경도가 올바르지 않습니다."
    );
  }

  /*
   * 5. slug 중복 확인
   */
  const {
    data: existingPlace,
    error: existingError,
  } =
    await supabase
      .from("places")
      .select("id")
      .eq(
        "slug",
        slug
      )
      .maybeSingle();

  if (existingError) {
    return redirectWithError(
      request,
      `중복 확인 실패: ${existingError.message}`
    );
  }

  if (existingPlace) {
    return redirectWithError(
      request,
      "이미 사용 중인 영문 식별자입니다."
    );
  }

  /*
   * 6. 대표사진 업로드
   */
  let imageUrl:
    string | null = null;

  const imageValue =
    formData.get(
      "image"
    );

  if (
    imageValue instanceof File &&
    imageValue.size > 0
  ) {
    if (
      imageValue.size >
      MAX_IMAGE_SIZE
    ) {
      return redirectWithError(
        request,
        "대표사진은 5MB 이하만 업로드할 수 있습니다."
      );
    }

    const extension =
      ALLOWED_IMAGE_TYPES.get(
        imageValue.type
      );

    if (!extension) {
      return redirectWithError(
        request,
        "JPG, PNG, WEBP 이미지만 업로드할 수 있습니다."
      );
    }

    const imagePath =
      `places/${slug}.${extension}`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          IMAGE_BUCKET
        )
        .upload(
          imagePath,
          imageValue,
          {
            upsert: true,
            contentType:
              imageValue.type,
          }
        );

    if (uploadError) {
      return redirectWithError(
        request,
        `대표사진 업로드 실패: ${uploadError.message}`
      );
    }

    const {
      data:
        publicUrlData,
    } =
      supabase.storage
        .from(
          IMAGE_BUCKET
        )
        .getPublicUrl(
          imagePath
        );

    imageUrl =
      publicUrlData.publicUrl;
  }

  /*
   * 7. places 저장
   */
  const {
    error: insertError,
  } =
    await supabase
      .from("places")
      .insert({
        name,
        slug,
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
          seatingType ||
          null,

        cuisine_type:
          cuisineType,

        environment_type:
          environmentType ||
          null,

        /*
         * 상세페이지 콘텐츠
         */
        visit_tips:
          visitTips,

        faq,

        blog_reviews:
          blogReviews,

        image_url:
          imageUrl,

        tags,

        is_editor_pick:
          isEditorPick,

        is_published:
          isPublished,

        recommendation_score:
          0,

        is_partner:
          false,
      });

  if (insertError) {
    if (imageUrl) {
      const extension =
        imageUrl
          .split(".")
          .pop();

      if (extension) {
        await supabase.storage
          .from(
            IMAGE_BUCKET
          )
          .remove([
            `places/${slug}.${extension}`,
          ]);
      }
    }

    return redirectWithError(
      request,
      `장소 등록 실패: ${insertError.message}`
    );
  }

  /*
   * 8. 완료
   */
  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${name} 장소 등록 완료`
    ),
    303
  );
}