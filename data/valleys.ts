export type Valley = {
  slug: string;
  name: string;
  region: string;
  city: string;
  address: string;
  phone: string;
  summary: string;
  tags: string[];
  rating: number;
  reviews: number;
  parking: boolean;
  restroom: boolean;
  family: boolean;
  pet: boolean;
  theme: string;
};

export const valleys: Valley[] = [
  {
    slug: "yongchu-gapyeong",
    name: "용추계곡",
    region: "경기",
    city: "가평",
    address: "경기도 가평군 가평읍 승안리 일대",
    phone: "031-582-8830",
    summary: "맑은 물과 완만한 물놀이 구간이 이어져 가족 나들이 장소로 사랑받는 계곡입니다.",
    tags: ["가족추천", "주차가능", "물놀이"],
    rating: 4.8,
    reviews: 128,
    parking: true,
    restroom: true,
    family: true,
    pet: false,
    theme: "emerald"
  },
  {
    slug: "heungjeong-pyeongchang",
    name: "흥정계곡",
    region: "강원",
    city: "평창",
    address: "강원특별자치도 평창군 봉평면 흥정계곡길",
    phone: "033-330-2771",
    summary: "울창한 숲과 차가운 계곡물이 어우러져 한여름에도 시원하게 쉬기 좋은 곳입니다.",
    tags: ["숲속계곡", "드라이브", "펜션"],
    rating: 4.7,
    reviews: 96,
    parking: true,
    restroom: true,
    family: true,
    pet: true,
    theme: "blue"
  },
  {
    slug: "songgye-jecheon",
    name: "송계계곡",
    region: "충북",
    city: "제천",
    address: "충청북도 제천시 한수면 송계리 일대",
    phone: "043-641-6731",
    summary: "월악산의 수려한 풍경 속에서 넓은 계곡과 기암을 함께 감상할 수 있습니다.",
    tags: ["월악산", "경치좋은", "캠핑"],
    rating: 4.6,
    reviews: 74,
    parking: true,
    restroom: true,
    family: true,
    pet: false,
    theme: "teal"
  },
  {
    slug: "surak-nonsan",
    name: "수락계곡",
    region: "충남",
    city: "논산",
    address: "충청남도 논산시 벌곡면 수락리 일대",
    phone: "041-746-6156",
    summary: "대둔산 자락의 기암절벽과 깨끗한 물이 인상적인 남녀노소 인기 피서지입니다.",
    tags: ["대둔산", "여름피서", "산책"],
    rating: 4.5,
    reviews: 61,
    parking: true,
    restroom: true,
    family: true,
    pet: true,
    theme: "green"
  },
  {
    slug: "baegundong-sancheong",
    name: "백운동계곡",
    region: "경남",
    city: "산청",
    address: "경상남도 산청군 단성면 백운리 일대",
    phone: "055-970-7201",
    summary: "지리산의 맑은 물과 반석이 이어지는 고즈넉한 계곡으로 자연 풍광이 뛰어납니다.",
    tags: ["지리산", "반석", "힐링"],
    rating: 4.8,
    reviews: 83,
    parking: false,
    restroom: true,
    family: false,
    pet: false,
    theme: "navy"
  },
  {
    slug: "donghaksa-gongju",
    name: "동학사계곡",
    region: "충남",
    city: "공주",
    address: "충청남도 공주시 반포면 동학사1로",
    phone: "042-825-3002",
    summary: "계룡산 등산과 계곡 산책을 함께 즐기기 좋은 접근성 높은 나들이 명소입니다.",
    tags: ["계룡산", "등산", "맛집"],
    rating: 4.4,
    reviews: 109,
    parking: true,
    restroom: true,
    family: true,
    pet: false,
    theme: "aqua"
  }
];

export const regions = ["전체", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
