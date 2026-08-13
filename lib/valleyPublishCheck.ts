export type PublishCheckValley = {
  name: string | null;
  slug: string | null;
  region: string | null;
  city: string | null;
  address: string | null;
  summary: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PublishCheckResult = {
  ready: boolean;
  missing: string[];
};

export function checkValleyPublishReady(
  valley: PublishCheckValley
): PublishCheckResult {
  const missing: string[] = [];

  if (!valley.name?.trim()) {
    missing.push("계곡명");
  }

  if (!valley.slug?.trim()) {
    missing.push("영문 식별자");
  }

  if (!valley.region?.trim()) {
    missing.push("지역");
  }

  if (!valley.city?.trim()) {
    missing.push("시·군");
  }

  if (!valley.address?.trim()) {
    missing.push("주소");
  }

  if (!valley.summary?.trim()) {
    missing.push("간단 소개");
  }

  if (!valley.image_url?.trim()) {
    missing.push("대표사진");
  }

  if (
    typeof valley.latitude !== "number" ||
    !Number.isFinite(valley.latitude)
  ) {
    missing.push("위도");
  }

  if (
    typeof valley.longitude !== "number" ||
    !Number.isFinite(valley.longitude)
  ) {
    missing.push("경도");
  }

  return {
    ready: missing.length === 0,
    missing,
  };
}