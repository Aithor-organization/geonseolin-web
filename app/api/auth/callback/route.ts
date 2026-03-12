import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // OAuth 신규 사용자: 프로필이 없으면 온보딩으로 리다이렉트
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single();

        if (!profile) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // role에 따라 적절한 대시보드로 리다이렉트
        if (next === "/dashboard") {
          const isAdmin = user.user_metadata?.role === "admin";
          const dashboardPath = isAdmin
            ? "/admin"
            : profile.role === "company"
              ? "/dashboard/company"
              : "/dashboard/worker";
          return NextResponse.redirect(`${origin}${dashboardPath}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
