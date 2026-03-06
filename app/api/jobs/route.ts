import { getSupabaseServerClient } from "@/lib/supabase/server";
import { jobSearchSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = jobSearchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { page, limit, location, type, search, status } = parsed.data;
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("jobs")
    .select("*, company_profiles!inner(company_name)", { count: "exact" });

  query = query.eq("status", status ?? "active");
  if (location) query = query.ilike("location", `%${location}%`);
  if (type) query = query.eq("type", type);
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const { data, count, error } = await query
    .order("posted_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
}
