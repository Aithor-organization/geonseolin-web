import { requireRole } from "@/lib/supabase/middleware";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { matchJobsForWorker } from "@/lib/ai/matching";
import { generateApplicationMessage } from "@/lib/ai/auto-apply";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let supabase;
  let workerId: string;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    supabase = await getSupabaseServiceClient();
    const body = await req.json();
    workerId = body.worker_id;
  } else {
    const auth = await requireRole("worker");
    if (auth.error) return auth.error;
    supabase = auth.supabase;
    workerId = auth.user!.id;
  }

  const { data: settings } = await supabase
    .from("auto_apply_settings")
    .select("*")
    .eq("worker_id", workerId)
    .single();

  if (!settings?.enabled) {
    return NextResponse.json({ error: "자동 지원이 비활성화되어 있습니다" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const { count: todayCount } = await supabase
    .from("auto_apply_logs")
    .select("*", { count: "exact", head: true })
    .eq("worker_id", workerId)
    .eq("status", "applied")
    .gte("executed_at", `${today}T00:00:00`);

  if ((todayCount ?? 0) >= settings.max_daily_applications) {
    return NextResponse.json({ message: "오늘 최대 지원 횟수에 도달했습니다", applied: 0 });
  }

  const remaining = settings.max_daily_applications - (todayCount ?? 0);

  const { data: worker } = await supabase
    .from("worker_profiles")
    .select("id, specialty, experience, bio, location, hourly_rate, skills, rating, review_count, completed_jobs")
    .eq("id", workerId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", workerId)
    .single();

  if (!worker || !profile) {
    return NextResponse.json({ error: "프로필을 찾을 수 없습니다" }, { status: 404 });
  }

  const { data: allJobs } = await supabase
    .from("jobs")
    .select("id, title, location, salary, type, description, requirements")
    .eq("status", "active")
    .limit(50);

  let jobs = allJobs ?? [];

  if (settings.preferred_locations?.length > 0) {
    jobs = jobs.filter((j) =>
      !j.location || settings.preferred_locations.some((loc: string) => j.location?.includes(loc))
    );
  }

  if (settings.exclude_keywords?.length > 0) {
    jobs = jobs.filter((j) =>
      !settings.exclude_keywords.some((kw: string) =>
        j.title.includes(kw) || (j.description ?? "").includes(kw)
      )
    );
  }

  const { data: existingApps } = await supabase
    .from("applications")
    .select("job_id")
    .eq("worker_id", workerId);

  const appliedJobIds = new Set((existingApps ?? []).map((a) => a.job_id));
  jobs = jobs.filter((j) => !appliedJobIds.has(j.id));

  if (jobs.length === 0) {
    return NextResponse.json({ message: "매칭 가능한 공고가 없습니다", applied: 0 });
  }

  const workerForMatch = {
    id: worker.id,
    name: profile.name,
    specialty: worker.specialty,
    experience: worker.experience ?? 0,
    skills: worker.skills ?? [],
    location: worker.location,
    hourly_rate: worker.hourly_rate ?? 0,
    rating: worker.rating ?? 0,
    available: true,
    bio: worker.bio,
  };

  const matches = await matchJobsForWorker(workerForMatch, jobs);
  const topMatches = matches.slice(0, remaining);

  let applied = 0;
  for (const match of topMatches) {
    const job = jobs.find((j) => j.id === match.job_id);
    if (!job) continue;

    try {
      const tplArray = Array.isArray(settings.templates) ? settings.templates as { id: string; content: string }[] : [];
      const template = settings.active_template_id
        ? tplArray.find((t) => t.id === settings.active_template_id)?.content ?? null
        : null;

      const ai = await generateApplicationMessage(
        {
          name: profile.name,
          specialty: worker.specialty,
          experience: worker.experience ?? 0,
          skills: worker.skills ?? [],
          bio: worker.bio,
          rating: worker.rating ?? 0,
          review_count: worker.review_count ?? 0,
          completed_jobs: worker.completed_jobs ?? 0,
        },
        {
          title: job.title,
          location: job.location,
          salary: job.salary,
          type: job.type,
          description: job.description,
          requirements: job.requirements ?? [],
        },
        template
      );

      const { data: app } = await supabase
        .from("applications")
        .insert({
          job_id: job.id,
          worker_id: workerId,
          message: ai.message,
          is_auto_applied: true,
        })
        .select("id")
        .single();

      await supabase.from("auto_apply_logs").insert({
        worker_id: workerId,
        job_id: job.id,
        application_id: app?.id,
        match_score: ai.match_score,
        match_reasons: ai.match_reasons,
        generated_message: ai.message,
        status: "applied",
      });

      applied++;
    } catch (err) {
      await supabase.from("auto_apply_logs").insert({
        worker_id: workerId,
        job_id: job.id,
        match_score: match.score,
        match_reasons: [match.reason],
        generated_message: "",
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ applied, total_matched: matches.length });
}
