import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// 관리자 API(generateLink)로 발급한 초대/재설정 링크는 세션을 URL 해시로 넘기는
// implicit grant 형식인데, 브라우저 클라이언트(@supabase/ssr)는 항상 PKCE로 동작해
// 그 해시를 세션으로 인식하지 못한다. 그래서 해시 대신 token_hash를 쿼리로 받아
// 서버에서 직접 검증하고, 그 결과로 세션 쿠키를 심어준 뒤 최종 페이지로 보낸다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/set-password?error=invalid_link`,
  );
}
