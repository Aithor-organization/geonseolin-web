import { requireAuth } from "@/lib/supabase/middleware";
import { messageSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  // 참여자 확인
  const { data: participant } = await supabase
    .from("chat_participants")
    .select("room_id")
    .eq("room_id", roomId)
    .eq("user_id", user!.id)
    .single();

  if (!participant) {
    return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
  }

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const from = (page - 1) * limit;

  const { data: messages, count } = await supabase
    .from("messages")
    .select("*, profiles!inner(name, avatar_url)", { count: "exact" })
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .range(from, from + limit - 1);

  // 읽음 처리
  await supabase
    .from("chat_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", user!.id);

  return NextResponse.json({
    data: messages ?? [],
    pagination: { page, limit, total: count ?? 0 },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      sender_id: user!.id,
      text: parsed.data.text,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
