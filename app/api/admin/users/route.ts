import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  // admin 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin =
    (profile?.role as string) === "admin" ||
    user.user_metadata?.role === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "15", 10)));
  const role = searchParams.get("role");
  const search = searchParams.get("search");

  let query = supabase
    .from("profiles")
    .select(
      "id, name, email, role, created_at, avatar_url, worker_profiles(specialty), company_profiles(company_name)",
      { count: "exact" }
    );

  if (role && ["worker", "company"].includes(role)) {
    query = query.eq("role", role as "worker" | "company");
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  type ProfileWithJoins = {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    avatar_url: string | null;
    worker_profiles: { specialty: string | null } | null;
    company_profiles: { company_name: string | null } | null;
  };

  const users = ((data ?? []) as unknown as ProfileWithJoins[]).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    created_at: u.created_at,
    avatar_url: u.avatar_url,
    specialty: u.worker_profiles?.specialty ?? undefined,
    company_name: u.company_profiles?.company_name ?? undefined,
  }));

  const total = count ?? 0;

  return NextResponse.json({
    users,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
