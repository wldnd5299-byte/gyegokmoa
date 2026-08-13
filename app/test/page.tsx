import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("valleys")
    .select("*")
    .limit(5);

  return (
    <main style={{ padding: 40 }}>
      <h1>Supabase 연결 테스트</h1>

      <pre>
        {JSON.stringify(
          {
            error,
            data,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
