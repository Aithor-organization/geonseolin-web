import { requireAuth } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  matchJobsForWorker,
  matchWorkersForJob,
  type WorkerForMatching,
  type JobForMatching,
} from "@/lib/ai/matching";

// 필터 값 정제 (Supabase OR 구문 안전)
function sanitize(v: string): string {
  return v.replace(/[,%{}()"'\\]/g, "").trim();
}

// GET /api/matching?type=jobs   → 기술자에게 추천 공고
// GET /api/matching?type=workers&job_id=xxx → 기업에게 추천 인력
export async function GET(req: NextRequest) {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    return NextResponse.json({ error: "AI 매칭 서비스가 설정되지 않았습니다" }, { status: 503 });
  }

  const type = req.nextUrl.searchParams.get("type");

  // ─── 기술자 → 추천 공고 ───
  if (type === "jobs") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user!.id)
      .single();

    const { data: worker } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("id", user!.id)
      .single();

    if (!worker) {
      return NextResponse.json({ error: "기술자 프로필이 없습니다" }, { status: 404 });
    }

    // 전문분야/기술 기반 필터링 → 관련 공고만 전체 조회
    const orFilters: string[] = [];

    if (worker.specialty) {
      const s = sanitize(worker.specialty);
      if (s) {
        orFilters.push(`type.ilike.%${s}%`);
        orFilters.push(`title.ilike.%${s}%`);
        orFilters.push(`description.ilike.%${s}%`);
      }
    }

    for (const skill of (worker.skills ?? [])) {
      const s = sanitize(skill);
      if (s) {
        orFilters.push(`title.ilike.%${s}%`);
        orFilters.push(`description.ilike.%${s}%`);
      }
    }

    // 기술 배열 overlap (requirements와 skills 교집합)
    if ((worker.skills ?? []).length > 0) {
      const clean = (worker.skills as string[]).map(sanitize).filter(Boolean);
      if (clean.length > 0) {
        orFilters.push(`requirements.ov.{${clean.join(",")}}`);
      }
    }

    let jobQuery = supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("posted_at", { ascending: false });

    // 분야 필터가 있으면 적용, 없으면 전체 조회
    if (orFilters.length > 0) {
      jobQuery = jobQuery.or(orFilters.join(","));
    }

    const { data: jobs } = await jobQuery;

    const workerData: WorkerForMatching = {
      id: worker.id,
      name: profile?.name ?? "기술자",
      specialty: worker.specialty,
      experience: worker.experience,
      skills: worker.skills,
      location: worker.location,
      hourly_rate: worker.hourly_rate,
      rating: worker.rating,
      available: worker.available,
      bio: worker.bio,
    };

    const jobList: JobForMatching[] = (jobs ?? []).map((j) => ({
      id: j.id,
      title: j.title,
      location: j.location,
      salary: j.salary,
      type: j.type,
      description: j.description,
      requirements: j.requirements,
    }));

    const matches = await matchJobsForWorker(workerData, jobList);
    return NextResponse.json({ matches, total: matches.length });
  }

  // ─── 기업 → 추천 인력 ───
  if (type === "workers") {
    const jobId = req.nextUrl.searchParams.get("job_id");
    if (!jobId) {
      return NextResponse.json({ error: "job_id가 필요합니다" }, { status: 400 });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: "공고를 찾을 수 없습니다" }, { status: 404 });
    }

    if (job.company_id !== user!.id) {
      return NextResponse.json({ error: "본인 공고만 매칭 가능합니다" }, { status: 403 });
    }

    // 공고 요구사항/유형 기반 필터링 → 관련 기술자만 전체 조회
    const orFilters: string[] = [];

    if (job.type) {
      const s = sanitize(job.type);
      if (s) {
        orFilters.push(`specialty.ilike.%${s}%`);
      }
    }

    // 공고 요구사항으로 전문분야 매칭
    for (const r of (job.requirements ?? []).slice(0, 10)) {
      const s = sanitize(r);
      if (s) {
        orFilters.push(`specialty.ilike.%${s}%`);
        orFilters.push(`bio.ilike.%${s}%`);
      }
    }

    // 기술 배열 overlap (skills와 requirements 교집합)
    if ((job.requirements ?? []).length > 0) {
      const clean = (job.requirements as string[]).map(sanitize).filter(Boolean);
      if (clean.length > 0) {
        orFilters.push(`skills.ov.{${clean.join(",")}}`);
      }
    }

    let workerQuery = supabase
      .from("worker_profiles")
      .select("*")
      .eq("available", true)
      .order("rating", { ascending: false });

    // 분야 필터가 있으면 적용, 없으면 전체 조회
    if (orFilters.length > 0) {
      workerQuery = workerQuery.or(orFilters.join(","));
    }

    const { data: workers } = await workerQuery;

    // 기술자 이름 조회
    const workerIds = (workers ?? []).map((w) => w.id);
    const { data: profiles } = workerIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", workerIds)
      : { data: [] as { id: string; name: string }[] };

    const nameMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.name])
    );

    const jobData: JobForMatching = {
      id: job.id,
      title: job.title,
      location: job.location,
      salary: job.salary,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
    };

    const workerList: WorkerForMatching[] = (workers ?? []).map((w) => ({
      id: w.id,
      name: nameMap[w.id] ?? "기술자",
      specialty: w.specialty,
      experience: w.experience,
      skills: w.skills,
      location: w.location,
      hourly_rate: w.hourly_rate,
      rating: w.rating,
      available: w.available,
      bio: w.bio,
    }));

    const matches = await matchWorkersForJob(jobData, workerList);
    return NextResponse.json({ matches, total: matches.length });
  }

  return NextResponse.json({ error: "type 파라미터가 필요합니다 (jobs 또는 workers)" }, { status: 400 });
}
