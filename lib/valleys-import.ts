import * as XLSX from "xlsx";

export type ValleyImportRow = {
  rowNumber: number;

  name: string;
  slug: string;
  region: string;
  city: string;
  address: string;
  phone: string | null;
  summary: string;
  tags: string[];

  parking: boolean | null;
  restroom: boolean | null;
  family: boolean | null;
  pet: boolean | null;

  latitude: number | null;
  longitude: number | null;
};

type ExcelRow = Record<string, unknown>;

function text(value: unknown): string {
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
  const valueText = text(value);

  return valueText || null;
}

/*
 * boolean 3단계 처리
 *
 * true
 *   가능 / 있음 / 추천 등
 *
 * false
 *   불가 / 없음 등
 *
 * null
 *   확인필요 / 미확인 / 빈칸 등
 */
function booleanValue(
  value: unknown
): boolean | null {
  const valueText =
    text(value).toLowerCase();

  if (!valueText) {
    return null;
  }

  const trueValues = [
    "true",
    "1",
    "yes",
    "y",
    "예",
    "가능",
    "있음",
    "추천",
    "on",
  ];

  const falseValues = [
    "false",
    "0",
    "no",
    "n",
    "아니오",
    "불가",
    "없음",
    "비추천",
    "off",
  ];

  const unknownValues = [
    "확인필요",
    "확인 필요",
    "미확인",
    "정보없음",
    "정보 없음",
    "모름",
    "unknown",
    "-",
  ];

  if (
    trueValues.includes(valueText)
  ) {
    return true;
  }

  if (
    falseValues.includes(valueText)
  ) {
    return false;
  }

  if (
    unknownValues.includes(valueText)
  ) {
    return null;
  }

  /*
   * 예상하지 못한 값은
   * 임의로 false 처리하지 않고
   * 안전하게 null 처리합니다.
   */
  return null;
}

function numberValue(
  value: unknown
): number | null {
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
  value: unknown
): string[] {
  return text(value)
    .split(",")
    .map((tag) =>
      tag.trim()
    )
    .filter(Boolean);
}

export function readValleyExcel(
  buffer: ArrayBuffer
): ValleyImportRow[] {
  const workbook = XLSX.read(
    buffer,
    {
      type: "array",
    }
  );

  /*
   * 계곡모아 업로드용 엑셀은
   * "업로드용" 시트를 우선 사용합니다.
   *
   * 업로드용 시트가 없으면
   * 첫 번째 시트를 읽습니다.
   */
  const sheetName =
    workbook.SheetNames.includes(
      "업로드용"
    )
      ? "업로드용"
      : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(
      "엑셀 파일에 시트가 없습니다."
    );
  }

  const worksheet =
    workbook.Sheets[
      sheetName
    ];

  const rows =
    XLSX.utils.sheet_to_json<ExcelRow>(
      worksheet,
      {
        defval: "",
      }
    );

  return rows.map(
    (row, index) => {
      return {
        /*
         * 엑셀 1행은 제목이므로
         * 실제 데이터는 2행부터 시작합니다.
         */
        rowNumber:
          index + 2,

        name:
          text(row["name"]),

        slug:
          text(
            row["slug"]
          ).toLowerCase(),

        region:
          text(row["region"]),

        city:
          text(row["city"]),

        address:
          text(
            row["address"]
          ),

        phone:
          nullableText(
            row["phone"]
          ),

        summary:
          text(
            row["summary"]
          ),

        tags:
          tagsValue(
            row["tags"]
          ),

        parking:
          booleanValue(
            row["parking"]
          ),

        restroom:
          booleanValue(
            row["restroom"]
          ),

        family:
          booleanValue(
            row["family"]
          ),

        pet:
          booleanValue(
            row["pet"]
          ),

        latitude:
          numberValue(
            row["latitude"]
          ),

        longitude:
          numberValue(
            row["longitude"]
          ),
      };
    }
  );
}