import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Dog,
  ExternalLink,
  MapPin,
  ParkingCircle,
  Pencil,
  Phone,
  Toilet,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PreviewPage({
  params,
}: PreviewPageProps) {
  const { id } = await params;

  const supabase =
    await createClient();

  /*
   * 1. 로그인 확인
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  /*
   * 2. 관리자 권한 확인
   */
  const {
    data: adminUser,
    error: adminError,
  } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    adminError ||
    !adminUser
  ) {
    notFound();
  }

  /*
   * 3. 계곡 정보 조회
   *
   * 중요:
   * 여기서는 is_published 조건을 넣지 않습니다.
   * 관리자 미리보기이므로 비공개 계곡도 확인할 수 있습니다.
   */
  const {
    data: valley,
    error,
  } = await supabase
    .from("valleys")
    .select(`
      id,
      name,
      slug,
      region,
      city,
      address,
      phone,
      summary,
      tags,
      parking,
      restroom,
      family,
      pet,
      image_url,
      latitude,
      longitude,
      is_published
    `)
    .eq("id", id)
    .maybeSingle();

  if (
    error ||
    !valley
  ) {
    notFound();
  }

  const imageSrc =
    valley.image_url ||
    "/main-valley.jpg";

  const hasCoordinates =
    typeof valley.latitude === "number" &&
    typeof valley.longitude === "number";

  const kakaoMapUrl =
    hasCoordinates
      ? `https://map.kakao.com/link/map/${encodeURIComponent(
          valley.name
        )},${valley.latitude},${valley.longitude}`
      : `https://map.kakao.com/link/search/${encodeURIComponent(
          valley.address || valley.name
        )}`;

  const tags =
    Array.isArray(valley.tags)
      ? valley.tags
      : [];

  return (
    <main>
      {/* 관리자 미리보기 안내 */}
      <section
        style={{
          background: "#123f36",
          color: "#ffffff",
          padding: "14px 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong>
              관리자 미리보기
            </strong>

            <span
              style={{
                marginLeft: "10px",
                opacity: 0.8,
                fontSize: "14px",
              }}
            >
              현재 상태:{" "}
              {valley.is_published
                ? "공개"
                : "비공개"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "9px",
                background:
                  "rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              <ArrowLeft size={15} />
              관리자
            </Link>

            <Link
              href={`/admin/valleys/${valley.id}/edit`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "9px",
                background: "#ffffff",
                color: "#123f36",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              <Pencil size={15} />
              정보 수정
            </Link>
          </div>
        </div>
      </section>

      {/* 대표 이미지 */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: "420px",
        }}
      >
        <Image
          src={imageSrc}
          alt={`${valley.name} 대표사진`}
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: "cover",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.68), rgba(0,0,0,0.08))",
          }}
        />

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: "420px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingTop: "80px",
            paddingBottom: "50px",
            color: "#ffffff",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 800,
              marginBottom: "10px",
            }}
          >
            {valley.region} · {valley.city}
          </span>

          <h1
            style={{
              margin: 0,
              fontSize:
                "clamp(36px, 6vw, 60px)",
              letterSpacing: "-0.04em",
            }}
          >
            {valley.name}
          </h1>
        </div>
      </section>

      {/* 상세정보 */}
      <section
        style={{
          padding: "55px 0 100px",
        }}
      >
        <div className="container">
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            {/* 위치 */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <MapPin
                size={20}
                aria-hidden="true"
              />

              <div>
                <strong>
                  위치
                </strong>

                <p
                  style={{
                    margin: "5px 0 0",
                    lineHeight: 1.7,
                  }}
                >
                  {valley.address}
                </p>
              </div>
            </div>

            {/* 전화번호 */}
            {valley.phone && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <Phone
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    전화번호
                  </strong>

                  <p
                    style={{
                      margin: "5px 0 0",
                    }}
                  >
                    {valley.phone}
                  </p>
                </div>
              </div>
            )}

            {/* 소개 */}
            <div
              style={{
                marginTop: "38px",
                padding: "28px",
                border:
                  "1px solid #e1e8e5",
                borderRadius: "18px",
                background: "#ffffff",
              }}
            >
              <h2
                style={{
                  margin: "0 0 14px",
                }}
              >
                계곡 소개
              </h2>

              <p
                style={{
                  margin: 0,
                  lineHeight: 1.9,
                  whiteSpace: "pre-line",
                }}
              >
                {valley.summary}
              </p>
            </div>

            {/* 편의정보 */}
            <div
              style={{
                marginTop: "25px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "12px",
              }}
            >
              <FacilityBox
                icon={
                  <ParkingCircle size={21} />
                }
                label="주차"
                value={
                  valley.parking === true
                    ? "가능"
                    : "확인 필요"
                }
              />

              <FacilityBox
                icon={
                  <Toilet size={21} />
                }
                label="화장실"
                value={
                  valley.restroom === true
                    ? "있음"
                    : "확인 필요"
                }
              />

              <FacilityBox
                icon={
                  <Users size={21} />
                }
                label="가족 방문"
                value={
                  valley.family === true
                    ? "추천"
                    : "확인 필요"
                }
              />

              <FacilityBox
                icon={
                  <Dog size={21} />
                }
                label="반려견"
                value={
                  valley.pet === true
                    ? "동반 가능"
                    : "확인 필요"
                }
              />
            </div>

            {/* 태그 */}
            {tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "28px",
                }}
              >
                {tags.map(
                  (tag: string) => (
                    <span
                      key={tag}
                      style={{
                        padding:
                          "8px 12px",
                        borderRadius:
                          "999px",
                        background:
                          "#edf7f3",
                        color:
                          "#08705f",
                        fontSize:
                          "13px",
                        fontWeight: 700,
                      }}
                    >
                      #{tag}
                    </span>
                  )
                )}
              </div>
            )}

            {/* 카카오맵 */}
            <div
              style={{
                marginTop: "35px",
              }}
            >
              <a
                href={kakaoMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding:
                    "12px 16px",
                  borderRadius: "10px",
                  background: "#173f36",
                  color: "#ffffff",
                  fontWeight: 800,
                }}
              >
                카카오맵에서 위치 확인
                <ExternalLink
                  size={16}
                  aria-hidden="true"
                />
              </a>
            </div>

            {/* 좌표 경고 */}
            {!hasCoordinates && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fff8e8",
                  color: "#725b20",
                  lineHeight: 1.7,
                }}
              >
                이 계곡은 아직 위도·경도가
                등록되지 않았습니다.
                공개하기 전에 위치를 확인해 주세요.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function FacilityBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "18px",
        border:
          "1px solid #e1e8e5",
        borderRadius: "14px",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "8px",
          color: "#08705f",
        }}
      >
        {icon}

        <strong>
          {label}
        </strong>
      </div>

      <span
        style={{
          color: "#586762",
          fontSize: "14px",
        }}
      >
        {value}
      </span>
    </div>
  );
}