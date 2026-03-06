import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

type WorkerRow = Database["public"]["Tables"]["worker_profiles"]["Row"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("worker_profiles")
    .select("*, profiles!inner(name, email, phone, avatar_url)")
    .eq("id", id)
    .single() as { data: (WorkerRow & { profiles: { name: string; email: string; phone: string | null; avatar_url: string | null } }) | null; error: unknown };

  if (error || !data) {
    return NextResponse.json({ error: "기술자를 찾을 수 없습니다" }, { status: 404 });
  }

  // 프로필 조회수 증가
  await supabase.rpc("increment_profile_views", { worker_uuid: id }).then(() => {}, () => {});

  // 경력/자격증도 함께 조회
  const [{ data: experiences }, { data: certificates }] = await Promise.all([
    supabase.from("worker_experiences").select("*").eq("worker_id", id).order("created_at", { ascending: false }),
    supabase.from("worker_certificates").select("*").eq("worker_id", id).order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({ ...data, experiences: experiences ?? [], certificates: certificates ?? [] });
}
