import { requireRole } from "@/lib/supabase/middleware";
import { companyProfileSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

type CompanyRow = Database["public"]["Tables"]["company_profiles"]["Row"];

export async function GET() {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const { data } = await supabase
    .from("company_profiles")
    .select("*, profiles!inner(name, email, phone, avatar_url)")
    .eq("id", user!.id)
    .single() as { data: (CompanyRow & { profiles: { name: string; email: string; phone: string | null; avatar_url: string | null } }) | null };

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = companyProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("company_profiles")
    .update(parsed.data)
    .eq("id", user!.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
