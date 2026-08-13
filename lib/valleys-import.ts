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

  parking: boolean;
  restroom: boolean;
  family: boolean;
  pet: boolean;

  latitude: number | null;
  longitude: number | null;
};

type ExcelRow = Record<string, unknown>;

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function nullableText(value: unknown): string | null {
  const valueText = text(value);

  return valueText || null;
}

function booleanValue(value: unknown): boolean {
  const valueText = text(value).toLowerCase();

  return [
    "true",
    "1",
    "yes",
    "y",
    "예",
    "가능",
    "있음",
    "추천",
    "on",
  ].includes(valueText);
}

function numberValue(value: unknown): number | null {
  const valueText = text(value);

  if (!valueText) {
    return null;
  }

  const number = Number(valueText);

  return Number.isFinite(number) ? number : null;
}

function tagsValue(value: unknown): string[] {
  return text(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function readValleyExcel(buffer: ArrayBuffer): ValleyImportRow[] {
  const workbook = XLSX.read(buffer, {
    type: "array",
  });

  /*
   * 앞으로 계곡모아 업로드용 엑셀에는
   * "업로드용" 시트를 사용하는 것을 기본으로 합니다.
   *
   * 업로드용 시트가 없으면 첫 번째 시트를 읽습니다.
   */
  const sheetName = workbook.SheetNames.includes("업로드용")
    ? "업로드용"
    : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("엑셀 파일에 시트가 없습니다.");
  }

  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
    defval: "",
  });

  return rows.map((row, index) => {
    return {
      /*
       * 엑셀 1행은 제목이므로
       * 실제 데이터는 2행부터 시작합니다.
       */
      rowNumber: index + 2,

      name: text(row["name"]),
      slug: text(row["slug"]).toLowerCase(),
      region: text(row["region"]),
      city: text(row["city"]),
      address: text(row["address"]),
      phone: nullableText(row["phone"]),
      summary: text(row["summary"]),
      tags: tagsValue(row["tags"]),

      parking: booleanValue(row["parking"]),
      restroom: booleanValue(row["restroom"]),
      family: booleanValue(row["family"]),
      pet: booleanValue(row["pet"]),

      latitude: numberValue(row["latitude"]),
      longitude: numberValue(row["longitude"]),
    };
  });
}