import { requireRole } from "@/lib/supabase/middleware";
import { generateApplicationMessage } from "@/lib/ai/auto-apply";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const { job_id, template_content } = await req.json();

  const { data: worker } = await supabase
    .from("worker_profiles")
    .select("specialty, experience, bio, skills, rating, review_count, completed_jobs")
    .eq("id", user!.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("title, location, salary, type, description, requirements")
    .eq("id", job_id)
    .single();

  if (!worker || !profile || !job) {
    return NextResponse.json({ error: "데이터를 찾을 수 없습니다" }, { status: 404 });
  }

  const result = await generateApplicationMessage(
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
    template_content ?? null
  );

  return NextResponse.json(result);
}
