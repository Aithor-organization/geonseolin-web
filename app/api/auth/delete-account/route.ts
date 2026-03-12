import { requireAuth } from "@/lib/supabase/middleware";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DELETE /api/auth/delete-account - 회원 탈퇴
export async function DELETE() {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const userId = user!.id;

  // 사용자 관련 데이터 삭제 (CASCADE로 대부분 처리되지만 명시적으로)
  await supabase.from("user_settings").delete().eq("user_id", userId);
  await supabase.from("worker_profiles").delete().eq("id", userId);
  await supabase.from("company_profiles").delete().eq("id", userId);
  await supabase.from("profiles").delete().eq("id", userId);

  // Supabase Auth에서 사용자 삭제 (admin API 필요)
  const admin = getSupabaseAdmin();
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json(
      { error: "계정 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
