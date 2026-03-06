import { requireAuth } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function GET() {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  // 내가 참여한 채팅방 목록
  const { data: rooms } = await supabase
    .from("chat_participants")
    .select("room_id")
    .eq("user_id", user!.id) as { data: { room_id: string }[] | null };

  if (!rooms || rooms.length === 0) {
    return NextResponse.json([]);
  }

  const roomIds = rooms.map((r) => r.room_id);

  // 각 방의 상대방, 마지막 메시지 조회
  // 내 last_read_at 조회
  const { data: myParticipants } = await supabase
    .from("chat_participants")
    .select("room_id, last_read_at")
    .eq("user_id", user!.id)
    .in("room_id", roomIds) as { data: { room_id: string; last_read_at: string }[] | null };

  const readAtMap = Object.fromEntries(
    (myParticipants ?? []).map((p) => [p.room_id, p.last_read_at])
  );

  const result = await Promise.all(
    roomIds.map(async (roomId) => {
      const { data: participants } = await supabase
        .from("chat_participants")
        .select("user_id, profiles!inner(name, avatar_url)")
        .eq("room_id", roomId)
        .neq("user_id", user!.id) as { data: { user_id: string; profiles: Pick<ProfileRow, "name" | "avatar_url"> }[] | null };

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("text, created_at, sender_id")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single() as { data: { text: string; created_at: string; sender_id: string } | null };

      // last_read_at 기준 안 읽은 메시지 수
      let unreadQuery = supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId)
        .neq("sender_id", user!.id);

      const lastRead = readAtMap[roomId];
      if (lastRead) {
        unreadQuery = unreadQuery.gt("created_at", lastRead);
      }

      const { count: unread } = await unreadQuery;

      const other = participants?.[0];
      return {
        id: roomId,
        other_user: other ? { id: other.user_id, name: other.profiles.name, avatar_url: other.profiles.avatar_url } : null,
        last_message: lastMsg,
        last_message_at: lastMsg?.created_at ?? null,
        unread_count: unread ?? 0,
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const { target_user_id } = await req.json();
  if (!target_user_id) {
    return NextResponse.json({ error: "대상 사용자 ID가 필요합니다" }, { status: 400 });
  }

  // 기존 1:1 채팅방 확인
  const { data: myRooms } = await supabase
    .from("chat_participants")
    .select("room_id")
    .eq("user_id", user!.id) as { data: { room_id: string }[] | null };

  if (myRooms && myRooms.length > 0) {
    const myRoomIds = myRooms.map((r) => r.room_id);
    const { data: existing } = await supabase
      .from("chat_participants")
      .select("room_id")
      .eq("user_id", target_user_id)
      .in("room_id", myRoomIds) as { data: { room_id: string }[] | null };

    if (existing && existing.length > 0) {
      return NextResponse.json({ room_id: existing[0].room_id });
    }
  }

  // 새 채팅방 생성
  const { data: room } = await supabase
    .from("chat_rooms")
    .insert({})
    .select("id")
    .single() as { data: { id: string } | null };

  if (!room) {
    return NextResponse.json({ error: "채팅방 생성 실패" }, { status: 500 });
  }

  await supabase.from("chat_participants").insert([
    { room_id: room.id, user_id: user!.id },
    { room_id: room.id, user_id: target_user_id },
  ]);

  return NextResponse.json({ room_id: room.id }, { status: 201 });
}
