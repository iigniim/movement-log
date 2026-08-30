import { createClient } from "@supabase/supabase-js";

// service_role 키 - 절대 클라이언트 컴포넌트에서 import하지 말 것. API route/서버 컴포넌트 전용.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
