import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PublicValley = {
  id: string;
  slug: string;
  name: string;
  region: string;
  city: string;
  address: string;
  phone: string | null;
  summary: string;
  tags: string[];
  parking: boolean | null;
  restroom: boolean | null;
  family: boolean | null;
  activity: string | null;
  pet: boolean | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  theme: string;
};

const PUBLIC_VALLEY_COLUMNS = `
  id,
  slug,
  name,
  region,
  city,
  address,
  phone,
  summary,
  tags,
  parking,
  restroom,
  family,
  activity,
  pet,
  image_url,
  latitude,
  longitude,
  theme
`;

export async function getPublishedValleys(): Promise<PublicValley[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("valleys")
    .select(PUBLIC_VALLEY_COLUMNS)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "공개 계곡 목록 조회 실패:",
      error.message
    );
    return [];
  }

  return (data ?? []) as PublicValley[];
}

export async function getPublishedValleyBySlug(
  slug: string
): Promise<PublicValley | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("valleys")
    .select(PUBLIC_VALLEY_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error(
      "계곡 상세정보 조회 실패:",
      error.message
    );
    return null;
  }

  return data as PublicValley | null;
}