import Link from "next/link";
import { ArrowLeft, ImagePlus, MapPin, Save } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditValleyPage({
  params,
}: EditPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // 1. 로그인 사용자 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login?error=로그인이 필요합니다.");
  }

  // 2. 관리자 권한 확인
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminUser) {
    return (
      <main>
        <section className="admin-content">
          <div className="container">
            <h1>관리자 권한이 없습니다.</h1>
            <p>관리자 계정으로 로그인되어 있는지 확인해 주세요.</p>

            <Link href="/admin">
              관리자 페이지로 돌아가기
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 3. 계곡 정보 가져오기
  const { data: valley, error: valleyError } = await supabase
    .from("valleys")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (valleyError) {
    return (
      <main>
        <section className="admin-content">
          <div className="container">
            <h1>계곡 정보를 불러오지 못했습니다.</h1>

            <p>오류 내용: {valleyError.message}</p>

            <p>계곡 ID: {id}</p>

            <Link href="/admin">
              관리자 페이지로 돌아가기
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!valley) {
    return (
      <main>
        <section className="admin-content">
          <div className="container">
            <h1>계곡 정보를 찾을 수 없습니다.</h1>

            <p>요청한 계곡 ID가 존재하지 않습니다.</p>

            <p>계곡 ID: {id}</p>

            <Link href="/admin">
              관리자 페이지로 돌아가기
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const tagsValue = Array.isArray(valley.tags)
    ? valley.tags.join(", ")
    : "";

  return (
    <main>
      <section className="admin-hero">
        <div className="container">
          <p className="admin-eyebrow">
            GYEGOKMOA ADMIN
          </p>

          <h1>계곡 정보 수정</h1>

          <p>
            등록된 계곡의 정보를 수정할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="admin-content">
        <div className="container">
          <form
            className="admin-form"
            action={`/api/admin/valleys/${valley.id}`}
            method="post"
            encType="multipart/form-data"
          >
            <div className="admin-form-heading">
              <div>
                <h2>기본정보</h2>

                <p>
                  {valley.name}의 정보를 수정합니다.
                </p>
              </div>

              <button type="submit">
                <Save size={18} aria-hidden="true" />
                수정 저장
              </button>
            </div>

            <div className="admin-form-grid">
              <label>
                <span>계곡명 *</span>

                <input
                  type="text"
                  name="name"
                  defaultValue={valley.name}
                  required
                />
              </label>

              <label>
                <span>영문 식별자 *</span>

                <input
                  type="text"
                  name="slug"
                  defaultValue={valley.slug}
                  required
                />

                <small>
                  영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.
                </small>
              </label>

              <label>
                <span>지역 *</span>

                <select
                  name="region"
                  required
                  defaultValue={valley.region}
                >
                  <option value="" disabled>
                    지역 선택
                  </option>

                  <option value="경기">경기</option>
                  <option value="강원">강원</option>
                  <option value="충북">충북</option>
                  <option value="충남">충남</option>
                  <option value="전북">전북</option>
                  <option value="전남">전남</option>
                  <option value="경북">경북</option>
                  <option value="경남">경남</option>
                  <option value="제주">제주</option>
                </select>
              </label>

              <label>
                <span>시·군 *</span>

                <input
                  type="text"
                  name="city"
                  defaultValue={valley.city}
                  required
                />
              </label>

              <label className="admin-full-field">
                <span>주소 *</span>

                <div className="admin-input-with-icon">
                  <MapPin size={18} aria-hidden="true" />

                  <input
                    type="text"
                    name="address"
                    defaultValue={valley.address}
                    required
                  />
                </div>
              </label>

              <label>
                <span>전화번호</span>

                <input
                  type="tel"
                  name="phone"
                  defaultValue={valley.phone ?? ""}
                />
              </label>

              <label>
                <span>대표사진</span>

                {valley.image_url && (
                  <div
                    style={{
                      marginBottom: "12px",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={valley.image_url}
                      alt={`${valley.name} 대표사진`}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "180px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

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
                  새 사진을 선택하지 않으면 기존 사진이 유지됩니다.
                </small>
              </label>

              <label className="admin-full-field">
                <span>간단 소개 *</span>

                <textarea
                  name="summary"
                  rows={5}
                  defaultValue={valley.summary}
                  required
                />
              </label>

              <label className="admin-full-field">
                <span>특징 태그</span>

                <input
                  type="text"
                  name="tags"
                  defaultValue={tagsValue}
                  placeholder="예: 가족추천, 주차가능, 물놀이"
                />

                <small>
                  태그는 쉼표로 구분해 주세요.
                </small>
              </label>
            </div>

            <div className="admin-option-section">
              <h2>편의시설 및 방문정보</h2>

              <div className="admin-checkbox-grid">
                <label>
                  <input
                    type="checkbox"
                    name="parking"
                    defaultChecked={Boolean(valley.parking)}
                  />
                  <span>주차 가능</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="restroom"
                    defaultChecked={Boolean(valley.restroom)}
                  />
                  <span>화장실 있음</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="family"
                    defaultChecked={Boolean(valley.family)}
                  />
                  <span>가족 방문 추천</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="pet"
                    defaultChecked={Boolean(valley.pet)}
                  />
                  <span>반려견 동반 가능</span>
                </label>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/admin"
                className="admin-back-button"
              >
                <ArrowLeft
                  size={18}
                  aria-hidden="true"
                />
                관리자 목록으로
              </Link>

              <button type="submit">
                <Save
                  size={18}
                  aria-hidden="true"
                />
                수정 저장
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}