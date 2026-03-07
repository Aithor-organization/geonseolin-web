import { requireRole } from "@/lib/supabase/middleware";
import { applicationSchema } from "@/lib/validations";
import { calculateCompletion, type ProfileData } from "@/lib/profile-completeness";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  // 프로필 완성도 체크
  const { data: rawProfile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const p = rawProfile as unknown as Record<string, unknown> | null;
  const { data: workerData } = await supabase
    .from("worker_profiles")
    .select("specialty, experience, skills, hourly_rate, location, bio")
    .eq("id", user!.id)
    .single();
  const { count: expCount } = await supabase
    .from("worker_experiences")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user!.id);
  const { count: certCount } = await supabase
    .from("worker_certificates")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user!.id);

  const profileData: ProfileData = {
    name: (p?.name as string) ?? null,
    phone: (p?.phone as string) ?? null,
    birth_date: (p?.birth_date as string) ?? null,
    specialty: workerData?.specialty ?? null,
    experience: workerData?.experience ?? null,
    skills: workerData?.skills ?? null,
    hourly_rate: workerData?.hourly_rate ?? null,
    location: workerData?.location ?? null,
    bio: workerData?.bio ?? null,
    experience_count: expCount ?? 0,
    certificate_count: certCount ?? 0,
  };

  const completion = calculateCompletion(profileData);
  if (completion.percentage < 100) {
    const missing = completion.fields.filter((f) => !f.filled).map((f) => f.label);
    return NextResponse.json(
      {
        error: "프로필을 100% 완성해야 지원할 수 있습니다",
        completion: completion.percentage,
        missing,
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = applicationSchema.safeParse({ ...body, job_id: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  if (!parsed.data.message?.trim()) {
    return NextResponse.json({ error: "자기소개/각오를 작성해주세요" }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("applications")
    .insert({
      job_id: id,
      worker_id: user!.id,
      message: parsed.data.message,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "이미 지원한 공고입니다" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
