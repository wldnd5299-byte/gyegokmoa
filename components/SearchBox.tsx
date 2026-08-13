"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const keyword = query.trim();

    if (!keyword) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(keyword)}`);
  }

  return (
    <form className="search-box" onSubmit={submit}>
      <Search size={22} aria-hidden="true" />

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="계곡명 또는 지역을 검색해 보세요"
        aria-label="계곡명 또는 지역 검색"
      />

      <button type="submit">검색</button>
    </form>
  );
}