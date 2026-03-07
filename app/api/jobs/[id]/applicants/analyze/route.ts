import { requireRole } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";
import { analyzeAllApplicants } from "@/lib/ai/applicant-analysis";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const { data: job } = await supabase
    .from("jobs")
    .select("id, company_id, title, location, salary, type, description, requirements, benefits")
    .eq("id", id)
    .single();

  if (!job || job.company_id !== user!.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { data: apps } = await supabase
    .from("applications")
    .select("id, worker_id, message")
    .eq("job_id", id);

  if (!apps || apps.length === 0) {
    return NextResponse.json({ analyses: [], total: 0 });
  }

  const workerIds = apps.map((a) => a.worker_id);
  const { data: workers } = await supabase
    .from("worker_profiles")
    .select("id, specialty, experience, bio, location, hourly_rate, skills, rating, review_count, completed_jobs")
    .in("id", workerIds);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", workerIds);

  const wMap = Object.fromEntries((workers ?? []).map((w) => [w.id, w]));
  const pMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const applicants = apps.map((a) => {
    const w = wMap[a.worker_id] ?? {};
    const p = pMap[a.worker_id] ?? {};
    return {
      application_id: a.id,
      worker_id: a.worker_id,
      worker_name: (p as { name?: string }).name ?? "기술자",
      specialty: (w as { specialty?: string }).specialty ?? null,
      experience: (w as { experience?: number }).experience ?? 0,
      skills: (w as { skills?: string[] }).skills ?? [],
      bio: (w as { bio?: string }).bio ?? null,
      location: (w as { location?: string }).location ?? null,
      hourly_rate: (w as { hourly_rate?: number }).hourly_rate ?? 0,
      rating: (w as { rating?: number }).rating ?? 0,
      review_count: (w as { review_count?: number }).review_count ?? 0,
      completed_jobs: (w as { completed_jobs?: number }).completed_jobs ?? 0,
      application_message: a.message,
    };
  });

  const jobData = {
    title: job.title,
    location: job.location,
    salary: job.salary,
    type: job.type,
    description: job.description,
    requirements: job.requirements ?? [],
    benefits: job.benefits ?? [],
  };

  const results = await analyzeAllApplicants(jobData, applicants);

  for (const r of results) {
    await supabase.from("applicant_analysis").upsert({
      application_id: r.application_id,
      job_id: id,
      worker_id: r.worker_id,
      overall_score: r.result.match_score,
      grade: r.result.match_grade,
      summary: r.result.summary,
      strengths: r.result.strengths,
      weaknesses: r.result.concerns,
      category_scores: r.result.score_breakdown as unknown as import("@/lib/supabase/types").Json,
    }, { onConflict: "application_id" });
  }

  return NextResponse.json({
    analyses: results.map((r) => ({
      application_id: r.application_id,
      ...r.result,
    })),
    total: results.length,
    analyzed_at: new Date().toISOString(),
  });
}
