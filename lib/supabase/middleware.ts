import { getSupabaseServerClient } from "./server";
import { NextResponse } from "next/server";
import type { Database } from "./types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function requireAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 }),
      user: null,
      supabase,
    };
  }

  return { error: null, user, supabase };
}

export async function requireRole(role: "worker" | "company" | "admin") {
  const { error, user, supabase } = await requireAuth();
  if (error) return { error, user: null, profile: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single() as { data: ProfileRow | null };

  if (!profile || profile.role !== role) {
    return {
      error: NextResponse.json({ error: "권한이 없습니다" }, { status: 403 }),
      user: null,
      profile: null,
      supabase,
    };
  }

  return { error: null, user: user!, profile, supabase };
}

export async function requireAdmin() {
  const { error, user, supabase } = await requireAuth();
  if (error) return { error, user: null, profile: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single() as { data: ProfileRow | null };

  // profiles.role 또는 user_metadata.role로 admin 판별
  const isAdmin =
    (profile?.role as string) === "admin" || user!.user_metadata?.role === "admin";

  if (!profile || !isAdmin) {
    return {
      error: NextResponse.json({ error: "권한이 없습니다" }, { status: 403 }),
      user: null,
      profile: null,
      supabase,
    };
  }

  return { error: null, user: user!, profile, supabase };
}
