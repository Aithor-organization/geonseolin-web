import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { generateBotResponse, checkEscalation, isWithinSchedule } from "@/lib/ai/company-bot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { room_id, message_id, sender_id, company_id } = await req.json();
  const supabase = await getSupabaseServiceClient();

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sender_id)
    .single();

  if (senderProfile?.role !== "worker") {
    return NextResponse.json({ skipped: true, reason: "sender_not_worker" });
  }

  const { data: settings } = await supabase
    .from("company_bot_settings")
    .select("*")
    .eq("company_id", company_id)
    .single();

  if (!settings?.enabled) {
    return NextResponse.json({ skipped: true, reason: "bot_disabled" });
  }

  if (!isWithinSchedule(settings.schedule_mode, settings.custom_start_time, settings.custom_end_time)) {
    return NextResponse.json({ skipped: true, reason: "outside_schedule" });
  }

  const { data: msg } = await supabase
    .from("messages")
    .select("text")
    .eq("id", message_id)
    .single();

  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const escalationMatch = checkEscalation(msg.text, settings.escalation_keywords ?? []);
  if (escalationMatch) {
    await supabase.from("messages").insert({
      room_id,
      sender_id: company_id,
      text: "담당자에게 전달하겠습니다. 확인 후 빠르게 연락드리겠습니다.",
      is_ai_response: true,
      escalated: true,
    });
    await supabase.from("messages").update({ escalated: true }).eq("id", message_id);
    await supabase
      .from("company_bot_settings")
      .update({ total_escalations: (settings.total_escalations ?? 0) + 1 })
      .eq("company_id", company_id);
    return NextResponse.json({ escalated: true, keyword: escalationMatch });
  }

  const { data: company } = await supabase
    .from("company_profiles")
    .select("company_name, industry, employees, address, description")
    .eq("id", company_id)
    .single();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("title, location, salary")
    .eq("company_id", company_id)
    .eq("status", "active")
    .limit(5);

  const { data: faq } = await supabase
    .from("company_bot_faq")
    .select("id, question, answer")
    .eq("company_id", company_id)
    .order("priority", { ascending: false })
    .limit(10);

  const { data: recentMsgs } = await supabase
    .from("messages")
    .select("sender_id, text")
    .eq("room_id", room_id)
    .order("created_at", { ascending: false })
    .limit(10);

  const botResponse = await generateBotResponse({
    company_name: company?.company_name ?? "기업",
    industry: company?.industry ?? null,
    employees: company?.employees ?? null,
    address: company?.address ?? null,
    description: company?.description ?? null,
    active_jobs: jobs ?? [],
    faq: (faq ?? []).map((f) => ({ question: f.question, answer: f.answer, id: f.id })),
    recent_messages: (recentMsgs ?? []).reverse().map((m) => ({
      sender: m.sender_id === company_id ? "기업" : "기술자",
      text: m.text,
    })),
    tone: settings.tone as "formal" | "polite" | "concise",
  });

  if (botResponse.confidence < 0.5) {
    await supabase.from("messages").insert({
      room_id,
      sender_id: company_id,
      text: "담당자에게 확인 후 안내드리겠습니다.",
      is_ai_response: true,
      ai_confidence: botResponse.confidence,
    });
  } else {
    await supabase.from("messages").insert({
      room_id,
      sender_id: company_id,
      text: botResponse.response,
      is_ai_response: true,
      ai_confidence: botResponse.confidence,
    });
  }

  await supabase
    .from("company_bot_settings")
    .update({ total_responses: (settings.total_responses ?? 0) + 1 })
    .eq("company_id", company_id);

  if (botResponse.matched_faq_id) {
    await supabase.rpc("increment_faq_use_count", { faq_id: botResponse.matched_faq_id });
  }

  return NextResponse.json({ success: true, confidence: botResponse.confidence });
}
