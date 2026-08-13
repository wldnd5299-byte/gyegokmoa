import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileSpreadsheet,
  ImagePlus,
  MapPinned,
  Save,
  Upload,
} from "lucide-react";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import ValleyLocationPicker from "@/components/ValleyLocationPicker";
import AdminValleyList from "@/components/AdminValleyList";

type AdminPageProps = {
  searchParams: Promise<{
    success?: string | string[];
    error?: string | string[];
  }>;
};

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const params = await searchParams;

  const successMessage = Array.isArray(params.success)
    ? params.success[0]
    : params.success;

  const errorMessage = Array.isArray(params.error)
    ? params.error[0]
    : params.error;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminUser) {
    redirect("/admin/login");
  }
  const {
    data: valleys,
    error,
  } = await supabase
    .from("valleys")
    .select(
      `
        id,
        name,
        slug,
        region,
        city,
        address,
        summary,
        image_url,
        latitude,
        longitude,
        is_published,
        created_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  return (
    <main>
      {/* =========================
          관리자 상단
      ========================== */}
      <section className="admin-hero">
        <div className="container">
          <p className="admin-eyebrow">
            GYEGOKMOA ADMIN
          </p>

          <h1>계곡 정보 관리</h1>

          <p>
            계곡을 직접 등록하거나 엑셀과 대표사진을 이용해
            여러 계곡을 한 번에 관리할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="admin-content">
        <div className="container">
          {/* =========================
              성공 메시지
          ========================== */}
          {successMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "16px 18px",
                marginBottom: "20px",
                border: "1px solid #bfe3d7",
                borderRadius: "14px",
                background: "#eaf8f3",
                color: "#08705f",
                fontWeight: 700,
                lineHeight: 1.6,
              }}
            >
              <CheckCircle2
                size={20}
                aria-hidden="true"
                style={{
                  flex: "0 0 auto",
                  marginTop: "2px",
                }}
              />

              <span>{successMessage}</span>
            </div>
          )}

          {/* =========================
              오류 메시지
          ========================== */}
          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "16px 18px",
                marginBottom: "20px",
                border: "1px solid #efc7c7",
                borderRadius: "14px",
                background: "#fff1f1",
                color: "#a43a3a",
                fontWeight: 700,
                lineHeight: 1.6,
              }}
            >
              <AlertCircle
                size={20}
                aria-hidden="true"
                style={{
                  flex: "0 0 auto",
                  marginTop: "2px",
                }}
              />

              <span>{errorMessage}</span>
            </div>
          )}

          {/* =========================
              엑셀 일괄 등록
          ========================== */}
          <section
            style={{
              marginBottom: "24px",
              padding: "32px",
              border: "1px solid #d7e5df",
              borderRadius: "22px",
              background: "#ffffff",
              boxShadow:
                "0 15px 40px rgba(7, 52, 43, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  flex: "0 0 50px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "15px",
                  background: "#eaf8f3",
                  color: "#07866c",
                }}
              >
                <FileSpreadsheet
                  size={25}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2
                  style={{
                    margin: "0 0 7px",
                    color: "#173f36",
                    fontSize: "24px",
                  }}
                >
                  엑셀 일괄 등록
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#687873",
                    lineHeight: 1.7,
                  }}
                >
                  여러 계곡 정보를 엑셀 파일 하나로
                  한 번에 등록할 수 있습니다.
                </p>
              </div>
            </div>

            <div
              style={{
                marginBottom: "24px",
                padding: "18px 20px",
                borderRadius: "14px",
                background: "#f4faf8",
                color: "#536b64",
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#174b40",
                }}
              >
                업로드 전 확인
              </strong>

              <div>
                · XLSX 또는 XLS 파일을 사용할 수 있습니다.
              </div>

              <div>
                · 기존에 등록된 slug는 중복 등록하지 않습니다.
              </div>

              <div>
                · 주소가 있으면 위도·경도를 자동으로 찾습니다.
              </div>

              <div>
                · 주소검색 실패 시 지역 + 시군 + 계곡명으로
                다시 좌표를 찾습니다.
              </div>

              <div>
                · 좌표 검색에 실패한 계곡은 정보 보완 필요로 남습니다.
              </div>

              <div>
                · 새로 등록되는 계곡은 모두 비공개 상태입니다.
              </div>
            </div>

            <form
              action="/api/admin/valleys/import"
              method="post"
              encType="multipart/form-data"
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#173f36",
                  fontWeight: 800,
                }}
              >
                엑셀 파일 선택
              </label>

              <div
                style={{
                  padding: "18px",
                  border: "1px dashed #b8d5cb",
                  borderRadius: "14px",
                  background: "#fbfdfc",
                }}
              >
                <input
                  type="file"
                  name="excel"
                  accept=".xlsx,.xls"
                  required
                  style={{
                    width: "100%",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  minHeight: "49px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "18px",
                  padding: "0 22px",
                  border: 0,
                  borderRadius: "13px",
                  background: "#07866c",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <Upload
                  size={18}
                  aria-hidden="true"
                />

                엑셀 일괄 등록
              </button>
            </form>
          </section>

          {/* =========================
              대표사진 일괄 업로드
          ========================== */}
          <section
            style={{
              marginBottom: "24px",
              padding: "32px",
              border: "1px solid #d7e5df",
              borderRadius: "22px",
              background: "#ffffff",
              boxShadow:
                "0 15px 40px rgba(7, 52, 43, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  flex: "0 0 50px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "15px",
                  background: "#eef4ff",
                  color: "#3559a8",
                }}
              >
                <FileImage
                  size={25}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2
                  style={{
                    margin: "0 0 7px",
                    color: "#173f36",
                    fontSize: "24px",
                  }}
                >
                  대표사진 일괄 업로드
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#687873",
                    lineHeight: 1.7,
                  }}
                >
                  여러 계곡의 대표사진을 한 번에
                  업로드하고 자동 연결할 수 있습니다.
                </p>
              </div>
            </div>

            <div
              style={{
                marginBottom: "24px",
                padding: "18px 20px",
                borderRadius: "14px",
                background: "#f7f9fd",
                color: "#53616f",
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#32435e",
                }}
              >
                사진 파일명 규칙
              </strong>

              <div>
                · 사진 파일명은 계곡의 slug와 같아야 합니다.
              </div>

              <div>
                · 예: yongchu-gapyeong.jpg
              </div>

              <div>
                · JPG, PNG, WEBP 파일만 가능합니다.
              </div>

              <div>
                · 사진 한 장당 최대 5MB입니다.
              </div>

              <div>
                · 한 번에 최대 100장까지 업로드할 수 있습니다.
              </div>

              <div>
                · 같은 slug의 사진을 다시 올리면 대표사진이 교체됩니다.
              </div>
            </div>

            <form
              action="/api/admin/valleys/images"
              method="post"
              encType="multipart/form-data"
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#173f36",
                  fontWeight: 800,
                }}
              >
                대표사진 선택
              </label>

              <div
                style={{
                  padding: "18px",
                  border: "1px dashed #b8c7df",
                  borderRadius: "14px",
                  background: "#fcfdff",
                }}
              >
                <input
                  type="file"
                  name="images"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  required
                  style={{
                    width: "100%",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  minHeight: "49px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "18px",
                  padding: "0 22px",
                  border: 0,
                  borderRadius: "13px",
                  background: "#3559a8",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <Upload
                  size={18}
                  aria-hidden="true"
                />

                대표사진 일괄 등록
              </button>
            </form>
          </section>

          {/* =========================
              좌표 없는 계곡 자동 보완
          ========================== */}
          <section
            style={{
              marginBottom: "30px",
              padding: "32px",
              border: "1px solid #d7e5df",
              borderRadius: "22px",
              background: "#ffffff",
              boxShadow:
                "0 15px 40px rgba(7, 52, 43, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  flex: "0 0 50px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "15px",
                  background: "#eaf8f3",
                  color: "#07866c",
                }}
              >
                <MapPinned
                  size={25}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2
                  style={{
                    margin: "0 0 7px",
                    color: "#173f36",
                    fontSize: "24px",
                  }}
                >
                  좌표 없는 계곡 자동 보완
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#687873",
                    lineHeight: 1.7,
                  }}
                >
                  현재 등록된 계곡 중 위도 또는 경도가 없는
                  계곡만 찾아 자동으로 좌표를 보완합니다.
                </p>
              </div>
            </div>

            <div
              style={{
                marginBottom: "22px",
                padding: "18px 20px",
                borderRadius: "14px",
                background: "#f4faf8",
                color: "#536b64",
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#174b40",
                }}
              >
                자동 보완 방식
              </strong>

              <div>
                · 좌표가 이미 있는 계곡은 건드리지 않습니다.
              </div>

              <div>
                · 먼저 등록된 주소로 좌표를 찾습니다.
              </div>

              <div>
                · 주소검색에 실패하면 지역 + 시군 + 계곡명으로
                다시 검색합니다.
              </div>

              <div>
                · 두 방법 모두 실패하면 기존 상태 그대로 남습니다.
              </div>

              <div>
                · 성공한 좌표는 Supabase에 자동 저장됩니다.
              </div>
            </div>

            <form
              action="/api/admin/valleys/geocode-missing"
              method="post"
            >
              <button
                type="submit"
                style={{
                  minHeight: "49px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "0 22px",
                  border: 0,
                  borderRadius: "13px",
                  background: "#07866c",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <MapPinned
                  size={18}
                  aria-hidden="true"
                />

                좌표 없는 계곡 자동 보완
              </button>
            </form>
          </section>

          {/* =========================
              신규 계곡 직접 등록
          ========================== */}
          <form
            className="admin-form"
            action="/api/admin/valleys"
            method="post"
            encType="multipart/form-data"
          >
            <div className="admin-form-heading">
              <div>
                <h2>기본정보</h2>

                <p>
                  계곡을 하나씩 직접 등록할 때 사용합니다.
                  별표가 있는 항목은 반드시 입력해 주세요.
                </p>
              </div>

              <button type="submit">
                <Save
                  size={18}
                  aria-hidden="true"
                />
                계곡 등록
              </button>
            </div>

            <div className="admin-form-grid">
              <label>
                <span>계곡명 *</span>

                <input
                  type="text"
                  name="name"
                  placeholder="예: 용추계곡"
                  required
                />
              </label>

              <label>
                <span>영문 식별자 *</span>

                <input
                  type="text"
                  name="slug"
                  placeholder="예: yongchu-gapyeong"
                  required
                />

                <small>
                  상세페이지 주소와 사진 저장에 사용됩니다.
                </small>
              </label>

              <label>
                <span>지역 *</span>

                <select
                  name="region"
                  required
                  defaultValue=""
                >
                  <option
                    value=""
                    disabled
                  >
                    지역 선택
                  </option>

                  <option value="경기">
                    경기
                  </option>

                  <option value="강원">
                    강원
                  </option>

                  <option value="충북">
                    충북
                  </option>

                  <option value="충남">
                    충남
                  </option>

                  <option value="전북">
                    전북
                  </option>

                  <option value="전남">
                    전남
                  </option>

                  <option value="경북">
                    경북
                  </option>

                  <option value="경남">
                    경남
                  </option>

                  <option value="제주">
                    제주
                  </option>
                </select>
              </label>

              <label>
                <span>시·군 *</span>

                <input
                  type="text"
                  name="city"
                  placeholder="예: 가평"
                  required
                />
              </label>

              {/* 주소 + 지도 + 위도/경도 */}
              <ValleyLocationPicker />

              <label>
                <span>전화번호</span>

                <input
                  type="tel"
                  name="phone"
                  placeholder="예: 031-582-8830"
                />
              </label>

              <label>
                <span>대표사진</span>

                <div className="admin-file-input">
                  <ImagePlus
                    size={23}
                    aria-hidden="true"
                  />

                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp"
                  />
                </div>

                <small>
                  JPG, PNG, WEBP / 최대 5MB
                </small>
              </label>

              <label className="admin-full-field">
                <span>간단 소개 *</span>

                <textarea
                  name="summary"
                  rows={5}
                  placeholder="계곡의 특징과 방문하기 좋은 이유를 간단하게 적어 주세요."
                  required
                />
              </label>

              <label className="admin-full-field">
                <span>특징 태그</span>

                <input
                  type="text"
                  name="tags"
                  placeholder="예: 가족추천, 주차가능, 물놀이"
                />

                <small>
                  태그는 쉼표로 구분해 주세요.
                </small>
              </label>
            </div>

            <div className="admin-option-section">
              <h2>
                편의시설 및 방문정보
              </h2>

              <div className="admin-checkbox-grid">
                <label>
                  <input
                    type="checkbox"
                    name="parking"
                  />

                  <span>주차 가능</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="restroom"
                  />

                  <span>화장실 있음</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="family"
                  />

                  <span>가족 방문 추천</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="pet"
                  />

                  <span>반려견 동반 가능</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="admin-mobile-submit"
            >
              <Save
                size={18}
                aria-hidden="true"
              />

              계곡 등록
            </button>
          </form>

          {/* =========================
              등록된 계곡 관리
          ========================== */}
          {error ? (
            <section className="admin-list-section">
              <div className="admin-list-empty">
                계곡 목록을 불러오지 못했습니다.
              </div>
            </section>
          ) : (
            <AdminValleyList
              valleys={valleys ?? []}
            />
          )}
        </div>
      </section>
    </main>
  );
}