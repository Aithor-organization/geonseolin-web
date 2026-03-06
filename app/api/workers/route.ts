import { getSupabaseServerClient } from "@/lib/supabase/server";
import { workerSearchSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

type WorkerRow = Database["public"]["Tables"]["worker_profiles"]["Row"];

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = workerSearchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { page, limit, specialty, location, search, available, min_rate, max_rate } = parsed.data;
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("worker_profiles")
    .select("*, profiles!inner(name, avatar_url)", { count: "exact" });

  if (specialty) query = query.eq("specialty", specialty);
  if (location) query = query.ilike("location", `%${location}%`);
  if (available !== undefined) query = query.eq("available", available);
  if (min_rate) query = query.gte("hourly_rate", min_rate);
  if (max_rate) query = query.lte("hourly_rate", max_rate);
  if (search) {
    query = query.or(`specialty.ilike.%${search}%,bio.ilike.%${search}%,skills.cs.{${search}}`);
  }

  const from = (page - 1) * limit;
  const { data, count, error } = await query
    .order("rating", { ascending: false })
    .range(from, from + limit - 1) as { data: (WorkerRow & { profiles: { name: string; avatar_url: string | null } })[] | null; count: number | null; error: unknown };

  if (error) {
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
}
