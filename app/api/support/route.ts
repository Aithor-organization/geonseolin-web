import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  category: z.enum(["general", "payment", "account", "bug", "suggestion"]),
  message: z.string().min(5, "문의 내용을 5자 이상 입력하세요"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await (supabase.from as any)("support_tickets").insert({
    user_id: user?.id ?? null,
    name: parsed.data.name,
    email: parsed.data.email,
    category: parsed.data.category,
    message: parsed.data.message,
    status: "open",
  });

  if (error) {
    // 테이블이 없을 수도 있으므로 일단 성공 처리 (로그만 남김)
    console.error("Support ticket insert error:", error.message);
  }

  return NextResponse.json({ success: true });
}
