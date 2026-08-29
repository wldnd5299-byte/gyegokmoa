import * as XLSX from "xlsx";

export type PlaceImportType =
  | "attraction"
  | "restaurant"
  | "cafe"
  | "accommodation";

export type PlaceImportRow = {
  rowNumber: number;

  place_type: PlaceImportType;

  name: string;
  slug: string;

  region: string;
  city: string;
  address: string;

  latitude: number | null;
  longitude: number | null;

  phone: string | null;
  website_url: string | null;

  summary: string;
  description: string | null;

  parent_recommendation:
    | string
    | null;

  business_hours:
    | string
    | null;

    closed_days:
  | string
  | null;

  admission_fee:
    | string
    | null;

  parking: boolean | null;
  restroom: boolean | null;

  walking_easy:
    | boolean
    | null;

  nearby_cafe:
    | boolean
    | null;

  environment_type:
    | "indoor"
    | "outdoor"
    | "mixed"
    | null;

  seating_type:
    | "chair"
    | "floor"
    | "mixed"
    | null;

  cuisine_type:
    | string
    | null;

  tags: string[];
};

type ExcelRow = Record<
  string,
  unknown
>;

function text(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function nullableText(
  value: unknown
): string | null {
  const valueText =
    text(value);

  return valueText
    ? valueText
    : null;
}

function numberOrNull(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

function booleanOrNull(
  value: unknown
): boolean | null {
  const normalized =
    text(value)
      .toLowerCase()
      .replace(/\s+/g, "");

  if (!normalized) {
    return null;
  }

  if (
    [
      "true",
      "1",
      "y",
      "yes",
      "예",
      "네",
      "가능",
      "있음",
      "o",
      "○",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "n",
      "no",
      "아니오",
      "아니요",
      "불가",
      "없음",
      "x",
      "×",
    ].includes(normalized)
  ) {
    return false;
  }

  return null;
}

function parsePlaceType(
  value: unknown
): PlaceImportType {
  const normalized =
    text(value)
      .toLowerCase()
      .replace(/\s+/g, "");

  switch (normalized) {
    case "attraction":
    case "가볼만한곳":
    case "관광지":
    case "여행지":
      return "attraction";

    case "restaurant":
    case "맛집":
    case "음식점":
    case "식당":
      return "restaurant";

    case "cafe":
    case "카페":
      return "cafe";

    case "accommodation":
    case "숙소":
    case "호텔":
    case "펜션":
    case "리조트":
      return "accommodation";

    default:
      return "attraction";
  }
}

function parseEnvironmentType(
  value: unknown
):
  | "indoor"
  | "outdoor"
  | "mixed"
  | null {
  const normalized =
    text(value)
      .toLowerCase()
      .replace(/\s+/g, "");

  if (!normalized) {
    return null;
  }

  if (
    normalized === "indoor" ||
    normalized === "실내"
  ) {
    return "indoor";
  }

  if (
    normalized === "outdoor" ||
    normalized === "실외"
  ) {
    return "outdoor";
  }

  if (
    normalized === "mixed" ||
    normalized ===
      "실내+실외" ||
    normalized ===
      "실내외"
  ) {
    return "mixed";
  }

  return null;
}

function parseSeatingType(
  value: unknown
):
  | "chair"
  | "floor"
  | "mixed"
  | null {
  const normalized =
    text(value)
      .toLowerCase()
      .replace(/\s+/g, "");

  if (!normalized) {
    return null;
  }

  if (
    normalized === "chair" ||
    normalized ===
      "의자식" ||
    normalized === "테이블"
  ) {
    return "chair";
  }

  if (
    normalized === "floor" ||
    normalized === "좌식"
  ) {
    return "floor";
  }

  if (
    normalized === "mixed" ||
    normalized ===
      "의자식+좌식" ||
    normalized ===
      "테이블+좌식"
  ) {
    return "mixed";
  }

  return null;
}

function parseTags(
  value: unknown
): string[] {
  const raw =
    text(value);

  if (!raw) {
    return [];
  }

  return raw
    .split(/[,|\n]/)
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

/*
 * 엑셀 헤더 이름을 여러 형태로
 * 사용할 수 있게 합니다.
 *
 * 예:
 * 장소명 / name
 * 주소 / address
 */
function getValue(
  row: ExcelRow,
  keys: string[]
): unknown {
  for (
    const key of keys
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        row,
        key
      )
    ) {
      return row[key];
    }
  }

  return undefined;
}

export function readPlaceExcel(
  buffer: ArrayBuffer
): PlaceImportRow[] {
  const workbook =
    XLSX.read(buffer, {
      type: "array",
    });

  const firstSheetName =
    workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet =
    workbook.Sheets[
      firstSheetName
    ];

  if (!sheet) {
    return [];
  }

  const rawRows =
    XLSX.utils.sheet_to_json<
      ExcelRow
    >(sheet, {
      defval: "",
      raw: false,
    });

  return rawRows
    .map(
      (
        row,
        index
      ): PlaceImportRow => {
        return {
          /*
           * 엑셀 1행은 헤더이므로
           * 실제 데이터 행 번호는 +2
           */
          rowNumber:
            index + 2,

          place_type:
            parsePlaceType(
              getValue(
                row,
                [
                  "place_type",
                  "장소유형",
                  "장소 유형",
                  "카테고리",
                ]
              )
            ),

          name: text(
            getValue(
              row,
              [
                "name",
                "장소명",
                "장소 이름",
                "이름",
              ]
            )
          ),

          slug: text(
            getValue(
              row,
              [
                "slug",
                "영문식별자",
                "영문 식별자",
              ]
            )
          ).toLowerCase(),

          region: text(
            getValue(
              row,
              [
                "region",
                "지역",
                "시도",
                "시·도",
              ]
            )
          ),

          city: text(
            getValue(
              row,
              [
                "city",
                "시군구",
                "시·군·구",
                "시군",
              ]
            )
          ),

          address: text(
            getValue(
              row,
              [
                "address",
                "주소",
                "도로명주소",
                "도로명 주소",
              ]
            )
          ),

          latitude:
            numberOrNull(
              getValue(
                row,
                [
                  "latitude",
                  "위도",
                ]
              )
            ),

          longitude:
            numberOrNull(
              getValue(
                row,
                [
                  "longitude",
                  "경도",
                ]
              )
            ),

          phone:
            nullableText(
              getValue(
                row,
                [
                  "phone",
                  "전화번호",
                  "전화",
                ]
              )
            ),

          website_url:
            nullableText(
              getValue(
                row,
                [
                  "website_url",
                  "홈페이지",
                  "웹사이트",
                  "홈페이지URL",
                ]
              )
            ),

          summary: text(
            getValue(
              row,
              [
                "summary",
                "한줄소개",
                "한줄 소개",
                "소개",
              ]
            )
          ),

          description:
            nullableText(
              getValue(
                row,
                [
                  "description",
                  "상세설명",
                  "상세 설명",
                ]
              )
            ),

          parent_recommendation:
            nullableText(
              getValue(
                row,
                [
                  "parent_recommendation",
                  "부모님추천",
                  "부모님 추천",
                  "부모님과 함께 가기 좋은 이유",
                ]
              )
            ),

          business_hours:
            nullableText(
              getValue(
                row,
                [
                  "business_hours",
                  "운영시간",
                  "영업시간",
                ]
              )
            ),

            closed_days:
  nullableText(
    getValue(
      row,
      [
        "closed_days",
        "휴무일",
        "휴관일",
        "정기휴무",
      ]
    )
  ),
  
          admission_fee:
            nullableText(
              getValue(
                row,
                [
                  "admission_fee",
                  "입장료",
                  "이용요금",
                  "요금",
                ]
              )
            ),

          parking:
            booleanOrNull(
              getValue(
                row,
                [
                  "parking",
                  "주차",
                  "주차가능",
                ]
              )
            ),

          restroom:
            booleanOrNull(
              getValue(
                row,
                [
                  "restroom",
                  "화장실",
                ]
              )
            ),

          walking_easy:
            booleanOrNull(
              getValue(
                row,
                [
                  "walking_easy",
                  "걷기편함",
                  "걷기 편함",
                ]
              )
            ),

          nearby_cafe:
            booleanOrNull(
              getValue(
                row,
                [
                  "nearby_cafe",
                  "주변카페",
                  "주변 카페",
                ]
              )
            ),

          environment_type:
            parseEnvironmentType(
              getValue(
                row,
                [
                  "environment_type",
                  "환경",
                  "실내실외",
                  "실내/실외",
                ]
              )
            ),

          seating_type:
            parseSeatingType(
              getValue(
                row,
                [
                  "seating_type",
                  "좌석형태",
                  "좌석 형태",
                ]
              )
            ),

          cuisine_type:
            nullableText(
              getValue(
                row,
                [
                  "cuisine_type",
                  "음식종류",
                  "음식 종류",
                ]
              )
            ),

          tags:
            parseTags(
              getValue(
                row,
                [
                  "tags",
                  "태그",
                  "검색태그",
                  "검색 태그",
                ]
              )
            ),
        };
      }
    )
    /*
     * 완전히 빈 행은 제거
     */
    .filter(
      (row) =>
        row.name ||
        row.slug ||
        row.address
    );
}