import { requireRole } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

// 개인정보 조회 (profiles 테이블의 birth_date, address, phone)
export async function GET() {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const { data } = await supabase
    .from("profiles")
    .select("name, phone, birth_date, address")
    .eq("id", user!.id)
    .single();

  return NextResponse.json(data ?? {});
}

// 개인정보 수정
export async function PUT(req: NextRequest) {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const body = await req.json();
  const { name, phone, birth_date, address } = body as {
    name?: string;
    phone?: string | null;
    birth_date?: string | null;
    address?: string | null;
  };

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (birth_date !== undefined) updateData.birth_date = birth_date;
  if (address !== undefined) updateData.address = address;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없습니다" }, { status: 400 });
  }

  const { error: updateError } = await (supabase.from("profiles") as ReturnType<typeof supabase.from>)
    .update(updateData)
    .eq("id", user!.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
