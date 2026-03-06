import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

type CompanyRow = Database["public"]["Tables"]["company_profiles"]["Row"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("company_profiles")
    .select("*, profiles!inner(name, email, avatar_url)")
    .eq("id", id)
    .single() as { data: (CompanyRow & { profiles: { name: string; email: string; avatar_url: string | null } }) | null; error: unknown };

  if (error || !data) {
    return NextResponse.json({ error: "기업을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}
