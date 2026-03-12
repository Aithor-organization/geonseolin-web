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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single();

        // OAuth 신규 사용자: 프로필 자동 생성 (온보딩 없이)
        let userRole = profile?.role;
        if (!profile) {
          const oauthName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ??
            "사용자";

          await supabase.from("profiles").insert({
            id: user.id,
            role: "worker",
            name: oauthName,
            email: user.email ?? "",
            avatar_url: user.user_metadata?.avatar_url ?? null,
          });
          await supabase.from("worker_profiles").insert({ id: user.id });
          userRole = "worker";
        }

        // role에 따라 적절한 대시보드로 리다이렉트
        if (next === "/dashboard") {
          const isAdmin = user.user_metadata?.role === "admin";
          const dashboardPath = isAdmin
            ? "/admin"
            : userRole === "company"
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
