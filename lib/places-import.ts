import * as XLSX from "xlsx";

export type PlaceImportFaqItem = {
  question: string;
  answer: string;
};

export type PlaceImportBlogReviewItem = {
  title: string;
  url: string;
  source: string | null;
  description: string | null;
};

export type PlaceImportRow = {
  rowNumber: number;

  place_type: string;
  name: string;
  slug: string;
  region: string;
  city: string;
  address: string;

  latitude: number | null;
  longitude: number | null;

  phone: string | null;
  website_url: string | null;

  business_hours: string | null;
  closed_days: string | null;
  admission_fee: string | null;

  environment_type: string | null;
  seating_type: string | null;
  cuisine_type: string | null;

  summary: string;
  description: string | null;
  parent_recommendation: string | null;

  tags: string[];
  visit_tips: string[] | null;
  faq: PlaceImportFaqItem[] | null;
  blog_reviews: PlaceImportBlogReviewItem[] | null;

  parking: boolean | null;
  restroom: boolean | null;
  walking_easy: boolean | null;
  nearby_cafe: boolean | null;

  is_editor_pick: boolean;
  is_published: boolean;

  image_url: string | null;
};

type RawExcelRow = Record<string, unknown>;

function cleanText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\r\n/g, "\n")
    .trim();
}

function nullableText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function getCell(
  row: RawExcelRow,
  ...keys: string[]
) {
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        row,
        key
      )
    ) {
      return row[key];
    }
  }

  return "";
}

function numberOrNull(
  value: unknown
): number | null {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const number = Number(
    text.replace(/,/g, "")
  );

  return Number.isFinite(number)
    ? number
    : null;
}

function booleanOrNull(
  value: unknown
): boolean | null {
  const text = cleanText(value)
    .toLowerCase();

  if (!text) {
    return null;
  }

  const trueValues = new Set([
    "true",
    "1",
    "yes",
    "y",
    "예",
    "네",
    "가능",
    "있음",
    "o",
    "○",
    "체크",
  ]);

  const falseValues = new Set([
    "false",
    "0",
    "no",
    "n",
    "아니오",
    "아니요",
    "불가",
    "없음",
    "x",
    "×",
  ]);

  if (trueValues.has(text)) {
    return true;
  }

  if (falseValues.has(text)) {
    return false;
  }

  return null;
}

function booleanWithDefaultFalse(
  value: unknown
) {
  return booleanOrNull(value) === true;
}

function tagsValue(
  value: unknown
) {
  const text = cleanText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function visitTipsValue(
  value: unknown
): string[] | null {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const items = text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0
    ? items
    : null;
}

function faqValue(
  value: unknown
): PlaceImportFaqItem[] | null {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const items = text
    .split("\n")
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
      (
        item
      ): item is PlaceImportFaqItem =>
        item !== null
    );

  return items.length > 0
    ? items
    : null;
}

function blogReviewsValue(
  value: unknown
): PlaceImportBlogReviewItem[] | null {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const items = text
    .split("\n")
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
      ): item is PlaceImportBlogReviewItem =>
        item !== null
    );

  return items.length > 0
    ? items
    : null;
}

function rowHasContent(
  row: RawExcelRow
) {
  return Object.values(row).some(
    (value) =>
      cleanText(value) !== ""
  );
}

export function readPlaceExcel(
  buffer: ArrayBuffer
): PlaceImportRow[] {
  const workbook =
    XLSX.read(
      buffer,
      {
        type: "array",
      }
    );

  const firstSheetName =
    workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet =
    workbook.Sheets[
      firstSheetName
    ];

  const rawRows =
    XLSX.utils.sheet_to_json<RawExcelRow>(
      sheet,
      {
        defval: "",
        raw: false,
      }
    );

  return rawRows
    .map(
      (
        row,
        index
      ): PlaceImportRow | null => {
        if (!rowHasContent(row)) {
          return null;
        }

        const websiteUrl =
          nullableText(
            getCell(
              row,
              "website_url",
              "홈페이지"
            )
          );

        const imageUrl =
          nullableText(
            getCell(
              row,
              "image_url",
              "대표사진URL"
            )
          );

        return {
          rowNumber:
            index + 2,

          place_type:
            cleanText(
              getCell(
                row,
                "place_type",
                "장소유형"
              )
            ).toLowerCase(),

          name:
            cleanText(
              getCell(
                row,
                "name",
                "장소명"
              )
            ),

          slug:
            cleanText(
              getCell(
                row,
                "slug",
                "영문식별자"
              )
            ).toLowerCase(),

          region:
            cleanText(
              getCell(
                row,
                "region",
                "지역"
              )
            ),

          city:
            cleanText(
              getCell(
                row,
                "city",
                "시군구"
              )
            ),

          address:
            cleanText(
              getCell(
                row,
                "address",
                "주소"
              )
            ),

          latitude:
            numberOrNull(
              getCell(
                row,
                "latitude",
                "위도"
              )
            ),

          longitude:
            numberOrNull(
              getCell(
                row,
                "longitude",
                "경도"
              )
            ),

          phone:
            nullableText(
              getCell(
                row,
                "phone",
                "전화번호"
              )
            ),

          website_url:
            websiteUrl,

          business_hours:
            nullableText(
              getCell(
                row,
                "business_hours",
                "운영시간"
              )
            ),

          closed_days:
            nullableText(
              getCell(
                row,
                "closed_days",
                "휴무일"
              )
            ),

          admission_fee:
            nullableText(
              getCell(
                row,
                "admission_fee",
                "이용요금"
              )
            ),

          environment_type:
            nullableText(
              getCell(
                row,
                "environment_type",
                "실내외"
              )
            ),

          seating_type:
            nullableText(
              getCell(
                row,
                "seating_type",
                "좌석형태"
              )
            ),

          cuisine_type:
            nullableText(
              getCell(
                row,
                "cuisine_type",
                "음식종류"
              )
            ),

          summary:
            cleanText(
              getCell(
                row,
                "summary",
                "한줄소개"
              )
            ),

          description:
            nullableText(
              getCell(
                row,
                "description",
                "상세설명"
              )
            ),

          parent_recommendation:
            nullableText(
              getCell(
                row,
                "parent_recommendation",
                "부모님추천이유"
              )
            ),

          tags:
            tagsValue(
              getCell(
                row,
                "tags",
                "검색태그"
              )
            ),

          visit_tips:
            visitTipsValue(
              getCell(
                row,
                "visit_tips",
                "방문꿀팁"
              )
            ),

          faq:
            faqValue(
              getCell(
                row,
                "faq",
                "FAQ"
              )
            ),

          blog_reviews:
            blogReviewsValue(
              getCell(
                row,
                "blog_reviews",
                "블로그후기"
              )
            ),

          parking:
            booleanOrNull(
              getCell(
                row,
                "parking",
                "주차"
              )
            ),

          restroom:
            booleanOrNull(
              getCell(
                row,
                "restroom",
                "화장실"
              )
            ),

          walking_easy:
            booleanOrNull(
              getCell(
                row,
                "walking_easy",
                "걷기편함"
              )
            ),

          nearby_cafe:
            booleanOrNull(
              getCell(
                row,
                "nearby_cafe",
                "주변카페"
              )
            ),

          is_editor_pick:
            booleanWithDefaultFalse(
              getCell(
                row,
                "is_editor_pick",
                "엄마랑아빠랑추천"
              )
            ),

          is_published:
            booleanWithDefaultFalse(
              getCell(
                row,
                "is_published",
                "바로공개"
              )
            ),

          image_url:
            imageUrl,
        };
      }
    )
    .filter(
      (
        row
      ): row is PlaceImportRow =>
        row !== null
    );
}
