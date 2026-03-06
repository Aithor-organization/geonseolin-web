import { requireRole } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const { count: activeJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", user!.id)
    .eq("status", "active");

  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", user!.id);

  const { count: activeContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("company_id", user!.id)
    .eq("status", "active");

  const { count: totalReviews } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("company_id", user!.id);

  return NextResponse.json({
    active_jobs: activeJobs ?? 0,
    total_jobs: totalJobs ?? 0,
    active_contracts: activeContracts ?? 0,
    total_reviews: totalReviews ?? 0,
  });
}
