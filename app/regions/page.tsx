import { RegionFilter } from "@/components/RegionFilter";
import { getPublishedValleys } from "@/lib/valleys";

type RegionsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function RegionsPage({
  searchParams,
}: RegionsPageProps) {
  const params = await searchParams;

  const rawQuery = Array.isArray(params.q)
    ? params.q[0]
    : params.q;

  const initialQuery = rawQuery?.trim() ?? "";

  // Supabase에서 공개된 계곡만 가져옵니다.
  const valleys = await getPublishedValleys();

  return (
    <main className="container subpage">
      <div className="page-heading">
        <span className="section-kicker">
          EXPLORE
        </span>

        <h1>지역별 계곡 찾기</h1>

        <p>
          지역이나 계곡 이름으로 원하는 여행지를 찾아보세요.
        </p>
      </div>

      <RegionFilter
        initialQuery={initialQuery}
        valleys={valleys}
      />
    </main>
  );
}