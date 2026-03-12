import { requireAuth } from "@/lib/supabase/middleware";
import { settingsSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];

export async function GET() {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user!.id)
    .single() as { data: SettingsRow | null };

  return NextResponse.json(data ?? {
    push_enabled: true,
    email_enabled: true,
    chat_enabled: true,
    profile_public: true,
    location_enabled: false,
    ai_matching_enabled: true,
    matching_min_score: 50,
    matching_max_results: 5,
    matching_preferred_locations: [],
    matching_preferred_types: [],
  });
}

export async function PUT(req: NextRequest) {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from("user_settings")
    .upsert({ user_id: user!.id, ...parsed.data });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
