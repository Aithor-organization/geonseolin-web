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
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("jobs")
    .select("id, title, location, salary, applicant_count, status, created_at, company_id, company_profiles!inner(company_name)", { count: "exact" });

  if (status && ["active", "closed", "draft"].includes(status)) {
    query = query.eq("status", status as "active" | "closed" | "draft");
  }
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  type JobWithCompany = {
    id: string;
    title: string;
    location: string | null;
    salary: string | null;
    applicant_count: number;
    status: string;
    created_at: string;
    company_id: string;
    company_profiles: { company_name: string | null };
  };

  const jobs = ((data ?? []) as unknown as JobWithCompany[]).map((job) => ({
    id: job.id,
    title: job.title,
    company_name: job.company_profiles?.company_name ?? "기업",
    location: job.location,
    salary: job.salary,
    applicant_count: job.applicant_count ?? 0,
    status: job.status,
    created_at: job.created_at,
  }));

  const total = count ?? 0;

  return NextResponse.json({
    jobs,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function PUT(request: NextRequest) {
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

  const body = await request.json();
  const { jobId, status } = body as { jobId: string; status: string };

  if (!jobId || !status) {
    return NextResponse.json({ error: "jobId and status required" }, { status: 400 });
  }

  const validStatuses = ["active", "closed", "draft"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("jobs")
    .update({ status: status as "active" | "closed" | "draft" })
    .eq("id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
