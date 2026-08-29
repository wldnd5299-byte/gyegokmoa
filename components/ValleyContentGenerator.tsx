"use client";

import { useRef, useState } from "react";

export default function ValleyContentGenerator() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");

  function generateContent() {
    const form =
      containerRef.current?.closest("form");

    if (!form) {
      alert("계곡 등록 폼을 찾을 수 없습니다.");
      return;
    }

    const formData = new FormData(form);

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const region = String(
      formData.get("region") ?? ""
    ).trim();

    const city = String(
      formData.get("city") ?? ""
    ).trim();

    const address = String(
      formData.get("address") ?? ""
    ).trim();

    if (!name) {
      alert("계곡명을 먼저 입력해 주세요.");
      return;
    }

    if (!region || !city) {
      alert("지역과 시·군을 먼저 입력해 주세요.");
      return;
    }

    const parking =
      formData.get("parking") !== null;

    const restroom =
      formData.get("restroom") !== null;

    const family =
      formData.get("family") !== null;

    const pet =
      formData.get("pet") !== null;

    const locationText =
      address
        ? `${region} ${city} ${address}에 위치한 ${name}`
        : `${region} ${city}에 위치한 ${name}`;

    const infoParts: string[] = [];

    if (parking) {
      infoParts.push("주차");
    }

    if (restroom) {
      infoParts.push("화장실");
    }

    if (family) {
      infoParts.push("가족 방문");
    }

    if (pet) {
      infoParts.push("반려견 동반");
    }

    const infoText =
      infoParts.length > 0
        ? `${infoParts.join(
            ", "
          )} 정보를 함께 확인할 수 있습니다.`
        : "주소와 위치 등 방문에 필요한 기본 정보를 확인할 수 있습니다.";

    const generatedSummary =
      `${locationText}입니다. ` +
      "엄마랑 아빠랑에서 위치와 방문 정보를 확인할 수 있습니다."

    const generatedTags: string[] = [
      region,
      city,
      "계곡여행",
    ];

    if (parking) {
      generatedTags.push("주차가능");
    }

    if (restroom) {
      generatedTags.push("화장실");
    }

    if (family) {
      generatedTags.push("가족방문");
    }

    if (pet) {
      generatedTags.push("반려견동반");
    }

    setSummary(generatedSummary);

    setTags(
      Array.from(
        new Set(generatedTags)
      ).join(", ")
    );
  }

  return (
    <div
      ref={containerRef}
      className="admin-full-field"
      style={{
        gridColumn: "1 / -1",
      }}
    >
      <div
        style={{
          marginBottom: "18px",
          padding: "18px",
          border: "1px solid #cfe3dc",
          borderRadius: "14px",
          background: "#f4faf8",
        }}
      >
        <strong
          style={{
            display: "block",
            marginBottom: "7px",
            color: "#173f36",
          }}
        >
          설명 · 태그 자동생성
        </strong>

        <p
          style={{
            margin: "0 0 14px",
            color: "#667670",
            fontSize: "14px",
            lineHeight: 1.7,
          }}
        >
          계곡명, 지역, 시·군과 체크한
          편의정보를 기준으로 초안을 만듭니다.
          생성 후 직접 수정할 수 있습니다.
        </p>

        <button
          type="button"
          onClick={generateContent}
          style={{
            padding: "11px 16px",
            border: 0,
            borderRadius: "10px",
            background: "#07866c",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          설명 · 태그 자동생성
        </button>
      </div>

      <label
        style={{
          display: "block",
          marginBottom: "20px",
        }}
      >
        <span>
          간단 소개 *
        </span>

        <textarea
          name="summary"
          rows={6}
          value={summary}
          onChange={(event) =>
            setSummary(
              event.target.value
            )
          }
          placeholder="계곡의 특징과 방문 정보를 입력해 주세요."
          required
          style={{
            width: "100%",
          }}
        />
      </label>

      <label
        style={{
          display: "block",
        }}
      >
        <span>
          특징 태그
        </span>

        <input
          type="text"
          name="tags"
          value={tags}
          onChange={(event) =>
            setTags(
              event.target.value
            )
          }
          placeholder="예: 경기, 가평, 계곡여행, 주차가능"
          style={{
            width: "100%",
          }}
        />

        <small>
          태그는 쉼표로 구분해 주세요.
        </small>
      </label>
    </div>
  );
}