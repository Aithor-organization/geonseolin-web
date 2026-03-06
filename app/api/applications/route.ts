import { requireAuth } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  // 프로필 역할 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role === "worker") {
    // 기술자: 내 지원 목록
    const { data: applications, error: fetchError } = await supabase
      .from("applications")
      .select("*")
      .eq("worker_id", user!.id)
      .order("created_at", { ascending: false });

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    // 공고 정보 별도 조회
    const jobIds = [...new Set((applications ?? []).map((a) => a.job_id))];
    const { data: jobs } = jobIds.length > 0
      ? await supabase.from("jobs").select("id, title, location, company_id").in("id", jobIds)
      : { data: [] };

    // 기업명 조회
    const companyIds = [...new Set((jobs ?? []).map((j) => j.company_id).filter(Boolean))];
    const { data: companies } = companyIds.length > 0
      ? await supabase.from("company_profiles").select("id, company_name").in("id", companyIds)
      : { data: [] };

    const companyMap = Object.fromEntries((companies ?? []).map((c) => [c.id, c]));
    const jobMap = Object.fromEntries((jobs ?? []).map((j) => [j.id, {
      ...j,
      company_profiles: j.company_id ? companyMap[j.company_id] ?? null : null,
    }]));

    const result = (applications ?? []).map((a) => ({
      ...a,
      jobs: jobMap[a.job_id] ?? null,
    }));

    return NextResponse.json(result);
  } else {
    // 기업: 내 공고에 대한 지원자 목록
    const { data: myJobs } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("company_id", user!.id);

    const jobIds = (myJobs ?? []).map((j) => j.id);
    if (jobIds.length === 0) return NextResponse.json([]);

    const { data: applications, error: fetchError } = await supabase
      .from("applications")
      .select("*")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    // 기술자 프로필 조회
    const workerIds = [...new Set((applications ?? []).map((a) => a.worker_id))];
    const { data: workerProfiles } = workerIds.length > 0
      ? await supabase.from("worker_profiles").select("id, specialty").in("id", workerIds)
      : { data: [] };

    // 기술자 이름 조회
    const { data: profiles } = workerIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", workerIds)
      : { data: [] };

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    const workerMap = Object.fromEntries((workerProfiles ?? []).map((w) => [w.id, {
      ...w,
      profiles: profileMap[w.id] ?? null,
    }]));
    const jobMap = Object.fromEntries((myJobs ?? []).map((j) => [j.id, j]));

    const result = (applications ?? []).map((a) => ({
      ...a,
      jobs: jobMap[a.job_id] ?? null,
      worker_profiles: workerMap[a.worker_id] ?? null,
    }));

    return NextResponse.json(result);
  }
}
