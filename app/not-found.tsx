import Link from "next/link";

import {
  ArrowLeft,
  Map,
  Search,
} from "lucide-react";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        background: "#f4f9f7",
      }}
    >
      <div
        style={{
          width: "min(540px, 100%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            margin: "0 auto 24px",
            display: "grid",
            placeItems: "center",
            borderRadius: "22px",
            background: "#e5f5ef",
            color: "#07866c",
          }}
        >
          <Map
            size={32}
            aria-hidden="true"
          />
        </div>

        <p
          style={{
            margin: "0 0 8px",
            color: "#07866c",
            fontWeight: 900,
            letterSpacing: "1px",
          }}
        >
          404
        </p>

        <h1
          style={{
            margin: "0",
            fontSize: "36px",
            color: "#153a32",
          }}
        >
          페이지를 찾을 수 없습니다
        </h1>

        <p
          style={{
            margin: "18px 0 30px",
            color: "#667670",
            lineHeight: 1.7,
          }}
        >
          주소가 변경되었거나
          존재하지 않는 페이지입니다.
          <br />
          계곡 검색 또는 지도를 이용해
          원하는 계곡을 찾아보세요.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "13px 18px",
              borderRadius: "12px",
              background: "#07866c",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />
            홈으로
          </Link>

          <Link
            href="/#search"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "13px 18px",
              border: "1px solid #dce9e4",
              borderRadius: "12px",
              background: "#fff",
              color: "#07866c",
              fontWeight: 800,
            }}
          >
            <Search
              size={17}
              aria-hidden="true"
            />
            계곡 검색
          </Link>
        </div>
      </div>
    </main>
  );
}