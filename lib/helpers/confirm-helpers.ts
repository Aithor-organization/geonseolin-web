import { SupabaseClient } from "@supabase/supabase-js";

export async function getOrCreateRoom(
  supabase: SupabaseClient,
  userId1: string,
  userId2: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("chat_participants")
    .select("room_id")
    .eq("user_id", userId1);

  if (existing) {
    for (const row of existing) {
      const { data: partner } = await supabase
        .from("chat_participants")
        .select("user_id")
        .eq("room_id", row.room_id)
        .eq("user_id", userId2)
        .single();
      if (partner) return row.room_id;
    }
  }

  const { data: room } = await supabase
    .from("chat_rooms")
    .insert({})
    .select("id")
    .single();

  const roomId = room!.id;
  await supabase.from("chat_participants").insert([
    { room_id: roomId, user_id: userId1 },
    { room_id: roomId, user_id: userId2 },
  ]);

  return roomId;
}

export async function sendNotificationMessage(
  supabase: SupabaseClient,
  roomId: string,
  senderId: string,
  templateType: string,
  variables: Record<string, string>
) {
  const { data: tmpl } = await supabase
    .from("notification_templates")
    .select("template")
    .eq("type", templateType)
    .single();

  let text = tmpl?.template ?? "";
  for (const [key, val] of Object.entries(variables)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, "g"), val);
  }

  await supabase.from("messages").insert({
    room_id: roomId,
    sender_id: senderId,
    text,
  });
}
