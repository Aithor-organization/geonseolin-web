import { requireRole } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

type WorkerRow = Database["public"]["Tables"]["worker_profiles"]["Row"];

export async function GET() {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const { data: profile } = await supabase
    .from("worker_profiles")
    .select("rating, review_count, completed_jobs, total_earnings, profile_views")
    .eq("id", user!.id)
    .single() as { data: Pick<WorkerRow, "rating" | "review_count" | "completed_jobs" | "total_earnings" | "profile_views"> | null };

  const { count: activeContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("worker_id", user!.id)
    .eq("status", "active");

  const { count: pendingApplications } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("worker_id", user!.id)
    .eq("status", "pending");

  return NextResponse.json({
    rating: profile?.rating ?? 0,
    review_count: profile?.review_count ?? 0,
    completed_jobs: profile?.completed_jobs ?? 0,
    total_earnings: profile?.total_earnings ?? 0,
    profile_views: profile?.profile_views ?? 0,
    active_contracts: activeContracts ?? 0,
    pending_applications: pendingApplications ?? 0,
  });
}
