import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServiceClient();
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, "0");
  const currentMin = now.getMinutes();
  const windowStart = `${currentHour}:${(currentMin - (currentMin % 15)).toString().padStart(2, "0")}:00`;
  const windowEnd = `${currentHour}:${(currentMin - (currentMin % 15) + 14).toString().padStart(2, "0")}:59`;

  const { data: activeUsers } = await supabase
    .from("auto_apply_settings")
    .select("worker_id")
    .eq("enabled", true)
    .gte("apply_time", windowStart)
    .lte("apply_time", windowEnd);

  let processed = 0;
  for (const u of activeUsers ?? []) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

      await fetch(`${baseUrl}/api/auto-apply/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ worker_id: u.worker_id }),
      });
      processed++;
    } catch {
      // continue with next user
    }
  }

  return NextResponse.json({ processed, total: (activeUsers ?? []).length });
}
