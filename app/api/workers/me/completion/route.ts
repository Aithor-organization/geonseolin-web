import { requireRole } from "@/lib/supabase/middleware";
import { calculateCompletion, type ProfileData } from "@/lib/profile-completeness";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  // profiles 전체 조회 (birth_date, address는 타입에 없으므로 * + cast)
  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const p = rawProfile as unknown as Record<string, unknown> | null;

  const { data: workerData } = await supabase
    .from("worker_profiles")
    .select("specialty, experience, skills, hourly_rate, location, bio")
    .eq("id", user!.id)
    .single();

  // 경력/자격증 카운트
  const { count: expCount } = await supabase
    .from("worker_experiences")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user!.id);

  const { count: certCount } = await supabase
    .from("worker_certificates")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user!.id);

  const data: ProfileData = {
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

  const completion = calculateCompletion(data);

  return NextResponse.json(completion);
}
