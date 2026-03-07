import { requireRole } from "@/lib/supabase/middleware";
import { confirmApplicationSchema } from "@/lib/validations";
import { getOrCreateRoom, sendNotificationMessage } from "@/lib/helpers/confirm-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id: jobId, appId } = await params;
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = confirmApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action, auto_reject_others, create_contract_draft, contract_data } = parsed.data;

  const { data: job } = await supabase
    .from("jobs")
    .select("id, company_id, title")
    .eq("id", jobId)
    .single();

  if (!job || job.company_id !== user!.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { data: app } = await supabase
    .from("applications")
    .select("id, worker_id, status")
    .eq("id", appId)
    .single();

  if (!app) {
    return NextResponse.json({ error: "지원 정보를 찾을 수 없습니다" }, { status: 404 });
  }

  const { data: companyProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  const companyName = companyProfile?.name ?? "기업";
  const newStatus = action === "accept" ? "accepted" : "rejected";

  await supabase.from("applications").update({ status: newStatus }).eq("id", appId);

  const roomId = await getOrCreateRoom(supabase, user!.id, app.worker_id);
  const templateType = action === "accept" ? "application_accepted" : "application_rejected";
  await sendNotificationMessage(supabase, roomId, user!.id, templateType, {
    job_title: job.title,
    company_name: companyName,
  });

  if (action === "accept" && auto_reject_others) {
    const { data: others } = await supabase
      .from("applications")
      .select("id, worker_id")
      .eq("job_id", jobId)
      .eq("status", "pending")
      .neq("id", appId);

    for (const other of others ?? []) {
      await supabase.from("applications").update({ status: "rejected" }).eq("id", other.id);
      const otherRoom = await getOrCreateRoom(supabase, user!.id, other.worker_id);
      await sendNotificationMessage(supabase, otherRoom, user!.id, "application_rejected", {
        job_title: job.title,
        company_name: companyName,
      });
    }
  }

  if (action === "accept" && create_contract_draft && contract_data) {
    await supabase.from("contracts").insert({
      job_id: jobId,
      worker_id: app.worker_id,
      company_id: user!.id,
      daily_rate: contract_data.daily_rate,
      work_days: contract_data.work_days,
      total_amount: contract_data.daily_rate * contract_data.work_days,
      start_date: contract_data.start_date ?? null,
      end_date: contract_data.end_date ?? null,
      status: "pending",
    });
  }

  return NextResponse.json({ success: true, action, application_id: appId });
}
