type KakaoAddressDocument = {
  x: string;
  y: string;
  address_name: string;
};

type KakaoAddressResponse = {
  documents: KakaoAddressDocument[];
};

type KakaoKeywordDocument = {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
};

type KakaoKeywordResponse = {
  documents: KakaoKeywordDocument[];
};

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  matchedAddress: string;
  matchedPlaceName?: string;
  method: "address" | "keyword";
};

function getApiKey() {
  const apiKey =
    process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    throw new Error(
      "KAKAO_REST_API_KEY 환경변수가 없습니다."
    );
  }

  return apiKey;
}

/*
 * 1차 검색
 * 주소 → 좌표
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const apiKey =
    getApiKey();

  const normalizedAddress =
    address.trim();

  if (!normalizedAddress) {
    return null;
  }

  const url =
    new URL(
      "https://dapi.kakao.com/v2/local/search/address.json"
    );

  url.searchParams.set(
    "query",
    normalizedAddress
  );

  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Authorization:
            `KakaoAK ${apiKey}`,
        },

        cache: "no-store",
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `카카오 주소 검색 실패 (${response.status}): ${errorText}`
    );
  }

  const data =
    (await response.json()) as KakaoAddressResponse;

  const first =
    data.documents?.[0];

  if (!first) {
    return null;
  }

  const latitude =
    Number(first.y);

  const longitude =
    Number(first.x);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,

    matchedAddress:
      first.address_name,

    method:
      "address",
  };
}

/*
 * 2차 검색
 *
 * 주소 검색에 실패했을 때
 * "계곡명 + 지역 + 시군"으로
 * 카카오 장소검색을 수행합니다.
 */
export async function geocodeValleyByKeyword(
  name: string,
  region: string,
  city: string
): Promise<GeocodeResult | null> {
  const apiKey =
    getApiKey();

  const query =
    [
      region.trim(),
      city.trim(),
      name.trim(),
    ]
      .filter(Boolean)
      .join(" ");

  if (!query) {
    return null;
  }

  const url =
    new URL(
      "https://dapi.kakao.com/v2/local/search/keyword.json"
    );

  url.searchParams.set(
    "query",
    query
  );

  /*
   * 결과가 너무 많아지는 것을 막기 위해
   * 상위 5건만 요청합니다.
   */
  url.searchParams.set(
    "size",
    "5"
  );

  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Authorization:
            `KakaoAK ${apiKey}`,
        },

        cache: "no-store",
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `카카오 장소 검색 실패 (${response.status}): ${errorText}`
    );
  }

  const data =
    (await response.json()) as KakaoKeywordResponse;

  if (
    !data.documents ||
    data.documents.length === 0
  ) {
    return null;
  }

  /*
   * 단순히 첫 번째 결과를 사용하지 않고
   * 계곡명이 실제 장소명에 포함된 결과를 우선합니다.
   */
  const exactCandidate =
    data.documents.find(
      (item) =>
        item.place_name
          .replace(/\s/g, "")
          .includes(
            name
              .replace(/\s/g, "")
          )
    );

  const candidate =
    exactCandidate ??
    data.documents[0];

  if (!candidate) {
    return null;
  }

  const latitude =
    Number(candidate.y);

  const longitude =
    Number(candidate.x);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,

    matchedAddress:
      candidate.road_address_name ||
      candidate.address_name,

    matchedPlaceName:
      candidate.place_name,

    method:
      "keyword",
  };
}