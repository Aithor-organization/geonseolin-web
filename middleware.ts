import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/login", "/signup", "/api/auth/callback", "/forgot-password", "/reset-password", "/verify-email", "/api/setup-demo", "/support", "/terms", "/privacy"];
const authRoutes = ["/login", "/signup"];
// 인증은 필요하지만 프로필은 필요 없는 라우트
const noProfileRoutes = ["/onboarding"];

// 인메모리 Rate Limiting (IP 기반)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1분
const RATE_LIMIT_MAX_API = 60;    // API: 분당 60회
const RATE_LIMIT_MAX_AUTH = 10;   // 인증: 분당 10회

function checkRateLimit(ip: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// 오래된 엔트리 정리 (Rate Limit 체크 시 lazy cleanup)
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // API Rate Limiting
  if (pathname.startsWith("/api/")) {
    cleanupRateLimitMap();
    const isAuthApi = pathname.startsWith("/api/auth/");
    const limit = isAuthApi ? RATE_LIMIT_MAX_AUTH : RATE_LIMIT_MAX_API;
    const key = isAuthApi ? `auth:${ip}` : `api:${ip}`;

    if (!checkRateLimit(key, limit)) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." },
        { status: 429 }
      );
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수 미설정 시 미들웨어 통과 (빌드 시 또는 설정 누락)
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // admin 역할 판별 (profiles.role 또는 user_metadata.role)
  const isAdmin = (profileRole?: string) =>
    profileRole === "admin" || user?.user_metadata?.role === "admin";

  // 공개 라우트 - 인증 불필요
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // 이미 로그인한 사용자는 대시보드로 리다이렉트
    if (user && authRoutes.some((route) => pathname.startsWith(route))) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const dashboardPath = isAdmin(profile?.role)
        ? "/admin"
        : profile?.role === "company"
          ? "/dashboard/company"
          : "/dashboard/worker";
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    return supabaseResponse;
  }

  // 보호 라우트 - 로그인 필요
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 온보딩 라우트 - 인증만 필요, 프로필 불필요
  if (noProfileRoutes.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // 프로필 조회 (프로필 완성 체크 + admin 체크 겸용)
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 프로필 미완성 → 온보딩 강제
  if (!userProfile) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // 관리자 라우트 - admin 역할 필요
  if (pathname.startsWith("/admin")) {
    if (!isAdmin(userProfile.role)) {
      return NextResponse.redirect(new URL("/dashboard/worker", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)",
  ],
};
