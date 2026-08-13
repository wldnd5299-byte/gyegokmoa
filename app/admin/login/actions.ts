"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginError(message: string): never {
  redirect(`/admin/login?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    loginError("이메일과 비밀번호를 모두 입력해 주세요.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    loginError(`로그인 실패: ${error.message}`);
  }

  if (!data.user) {
    loginError("로그인 사용자 정보를 불러오지 못했습니다.");
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (adminError) {
    await supabase.auth.signOut();
    loginError(`관리자 권한 확인 실패: ${adminError.message}`);
  }

  if (!adminUser) {
    await supabase.auth.signOut();
    loginError("이 계정은 관리자 계정으로 등록되어 있지 않습니다.");
  }

  redirect("/admin");
}