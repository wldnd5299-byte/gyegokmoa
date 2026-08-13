import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "valley-images";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function adminUrl(
  request: Request,
  type: "success" | "error",
  message: string
) {
  const url = new URL("/admin", request.url);
  url.searchParams.set(type, message);
  return url;
}

function redirectWithError(
  request: Request,
  message: string
) {
  return NextResponse.redirect(
    adminUrl(request, "error", message),
    303
  );
}

function getStoragePathFromPublicUrl(
  imageUrl: string
): string | null {
  try {
    const url = new URL(imageUrl);

    const marker =
      `/storage/v1/object/public/${IMAGE_BUCKET}/`;

    const markerIndex =
      url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return url.pathname
      .slice(markerIndex + marker.length)
      .split("/")
      .map(decodeURIComponent)
      .join("/");
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  const supabase = await createClient();

  // 1. 로그인 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL(
        "/admin/login?error=로그인이 필요합니다.",
        request.url
      ),
      303
    );
  }

  // 2. 관리자 권한 확인
  const {
    data: adminUser,
    error: adminError,
  } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminUser) {
    return redirectWithError(
      request,
      "관리자 권한이 없습니다."
    );
  }

  // 3. 삭제할 계곡 확인
  const {
    data: valley,
    error: valleyError,
  } = await supabase
    .from("valleys")
    .select("id, name, image_url")
    .eq("id", id)
    .maybeSingle();

  if (valleyError || !valley) {
    return redirectWithError(
      request,
      "삭제할 계곡 정보를 찾을 수 없습니다."
    );
  }

  // 4. DB에서 계곡 삭제
  const { error: deleteError } =
    await supabase
      .from("valleys")
      .delete()
      .eq("id", id);

  if (deleteError) {
    return redirectWithError(
      request,
      `삭제 실패: ${deleteError.message}`
    );
  }

  // 5. 대표사진 Storage 정리
  // DB 삭제는 성공했으므로 사진 삭제 실패가
  // 전체 삭제 성공을 취소하지는 않습니다.
  if (valley.image_url) {
    const imagePath =
      getStoragePathFromPublicUrl(
        valley.image_url
      );

    if (imagePath) {
      const { error: storageError } =
        await supabase.storage
          .from(IMAGE_BUCKET)
          .remove([imagePath]);

      if (storageError) {
        console.error(
          "대표사진 삭제 실패:",
          storageError.message
        );
      }
    }
  }

  // 6. 관리자 페이지로 이동
  return NextResponse.redirect(
    adminUrl(
      request,
      "success",
      `${valley.name}이(가) 삭제되었습니다.`
    ),
    303
  );
}