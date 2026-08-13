import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function loginPageUrl(request: Request, message: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", message);
  return url;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(
      loginPageUrl(request, "이메일과 비밀번호를 모두 입력해 주세요."),
      303
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.redirect(
      loginPageUrl(
        request,
        `로그인 실패: ${error?.message ?? "사용자 정보를 찾지 못했습니다."}`
      ),
      303
    );
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (adminError || !adminUser) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      loginPageUrl(
        request,
        adminError
          ? `관리자 권한 확인 실패: ${adminError.message}`
          : "관리자 권한이 없는 계정입니다."
      ),
      303
    );
  }

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}