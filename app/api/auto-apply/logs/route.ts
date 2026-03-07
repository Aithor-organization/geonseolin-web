import { requireRole } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const { data: logs } = await supabase
    .from("auto_apply_logs")
    .select("*, jobs(title, location, salary)")
    .eq("worker_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const today = new Date().toISOString().split("T")[0];
  const todayLogs = (logs ?? []).filter((l) => l.created_at?.startsWith(today));

  return NextResponse.json({
    logs: logs ?? [],
    stats: {
      today_applied: todayLogs.filter((l) => l.status === "applied").length,
      today_skipped: todayLogs.filter((l) => l.status === "skipped").length,
      total_applied: (logs ?? []).filter((l) => l.status === "applied").length,
    },
  });
}
