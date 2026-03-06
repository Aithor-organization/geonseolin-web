import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();

  // 현재 유저 확인 (admin 체크)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin =
    (profile?.role as string) === "admin" ||
    user.user_metadata?.role === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 통계 집계 (병렬 실행)
  const [
    profilesRes,
    workersRes,
    companiesRes,
    activeJobsRes,
    totalJobsRes,
    todayContractsRes,
    monthlyPaymentsRes,
    recentUsersRes,
    recentJobsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "worker"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "company"),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    // 오늘 생성된 계약 수
    supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date().toISOString().split("T")[0]),
    // 이번 달 완료된 결제 합계
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "completed")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    // 최근 가입 사용자 5명
    supabase
      .from("profiles")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    // 최근 공고 5건 (기업명 포함)
    supabase
      .from("jobs")
      .select("id, title, status, applicant_count, created_at, company_id, company_profiles!inner(company_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthlyRevenue = (monthlyPaymentsRes.data ?? []).reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0
  );

  type JobWithCompany = {
    id: string;
    title: string;
    status: string;
    applicant_count: number;
    created_at: string;
    company_id: string;
    company_profiles: { company_name: string | null };
  };

  const recentJobs = ((recentJobsRes.data ?? []) as unknown as JobWithCompany[]).map((job) => ({
    id: job.id,
    title: job.title,
    company_name: job.company_profiles?.company_name ?? "기업",
    status: job.status,
    applicant_count: job.applicant_count ?? 0,
    created_at: job.created_at,
  }));

  return NextResponse.json({
    totalUsers: profilesRes.count ?? 0,
    workerCount: workersRes.count ?? 0,
    companyCount: companiesRes.count ?? 0,
    activeJobs: activeJobsRes.count ?? 0,
    totalJobs: totalJobsRes.count ?? 0,
    todayMatches: todayContractsRes.count ?? 0,
    monthlyRevenue,
    recentUsers: recentUsersRes.data ?? [],
    recentJobs,
  });
}
