import { requireRole } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  // 공고 소유권 확인
  const { data: job } = await supabase
    .from("jobs")
    .select("id, company_id, title")
    .eq("id", id)
    .single();

  if (!job || job.company_id !== user!.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 지원자 목록
  const { data: applications, error: fetchError } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const workerIds = [...new Set((applications ?? []).map((a) => a.worker_id))];
  if (workerIds.length === 0) {
    return NextResponse.json({ job: { id: job.id, title: job.title }, applicants: [] });
  }

  // 기술자 상세 프로필
  const { data: workerProfiles } = await supabase
    .from("worker_profiles")
    .select("id, specialty, experience, bio, location, hourly_rate, skills, rating, review_count, completed_jobs")
    .in("id", workerIds);

  // 이름, 연락처
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, phone, avatar_url")
    .in("id", workerIds);

  // 경력
  const { data: experiences } = await supabase
    .from("worker_experiences")
    .select("worker_id, company_name, work_period, responsibility")
    .in("worker_id", workerIds);

  // 자격증
  const { data: certificates } = await supabase
    .from("worker_certificates")
    .select("worker_id, cert_name, acquired_date, issuing_agency")
    .in("worker_id", workerIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const workerMap = Object.fromEntries((workerProfiles ?? []).map((w) => [w.id, w]));
  const expMap: Record<string, typeof experiences> = {};
  (experiences ?? []).forEach((e) => {
    if (!expMap[e.worker_id]) expMap[e.worker_id] = [];
    expMap[e.worker_id]!.push(e);
  });
  const certMap: Record<string, typeof certificates> = {};
  (certificates ?? []).forEach((c) => {
    if (!certMap[c.worker_id]) certMap[c.worker_id] = [];
    certMap[c.worker_id]!.push(c);
  });

  // AI 분석 결과
  const { data: analyses } = await supabase
    .from("applicant_analysis")
    .select("application_id, overall_score, grade, category_scores, summary, strengths, weaknesses, analyzed_at")
    .eq("job_id", id);

  const analysisMap = Object.fromEntries(
    (analyses ?? []).map((a) => [a.application_id, a])
  );

  const applicants = (applications ?? []).map((a) => {
    const prof = profileMap[a.worker_id] ?? {};
    const wp = workerMap[a.worker_id] ?? {};
    return {
      application_id: a.id,
      status: a.status,
      message: a.message,
      applied_at: a.created_at,
      is_auto_applied: a.is_auto_applied ?? false,
      worker: {
        ...prof,
        ...wp,
        id: a.worker_id,
        experiences: expMap[a.worker_id] ?? [],
        certificates: certMap[a.worker_id] ?? [],
      },
      analysis: analysisMap[a.id] ?? null,
    };
  });

  return NextResponse.json({ job: { id: job.id, title: job.title }, applicants });
}
