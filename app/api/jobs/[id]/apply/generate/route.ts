import { requireRole } from "@/lib/supabase/middleware";
import { generateApplicationMessage } from "@/lib/ai/auto-apply";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const { id: jobId } = await params;
  const { user_context } = await req.json();

  // 워커 프로필 + 프로필 이름 + 공고 데이터 병렬 조회
  const [workerRes, profileRes, jobRes] = await Promise.all([
    supabase
      .from("worker_profiles")
      .select("specialty, experience, bio, skills, rating, review_count, completed_jobs")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("jobs")
      .select("title, location, salary, type, description, requirements")
      .eq("id", jobId)
      .single(),
  ]);

  if (!workerRes.data || !profileRes.data || !jobRes.data) {
    return NextResponse.json({ error: "데이터를 찾을 수 없습니다" }, { status: 404 });
  }

  const worker = workerRes.data;
  const profile = profileRes.data;
  const job = jobRes.data;

  // user_context가 있으면 bio에 추가 정보로 합침
  const enhancedBio = user_context
    ? `${worker.bio ?? ""}\n\n[추가 정보] ${user_context}`
    : worker.bio;

  const result = await generateApplicationMessage(
    {
      name: profile.name,
      specialty: worker.specialty,
      experience: worker.experience ?? 0,
      skills: worker.skills ?? [],
      bio: enhancedBio,
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
    }
  );

  return NextResponse.json(result);
}
