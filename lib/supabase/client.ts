import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 빌드 시 정적 페이지 생성 단계에서는 환경변수가 없을 수 있음
  // placeholder 값으로 클라이언트 생성 (런타임에서만 실제 사용됨)
  client = createBrowserClient<Database>(
    url || "https://placeholder.supabase.co",
    key || "placeholder-key"
  );

  return client;
}
