import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberForUser } from "@/lib/auth";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 회원 본인 계정으로는 다른 회원을 초대할 수 없다 - 트레이너만 허용
  const asMember = await getMemberForUser(supabase, user.id);
  if (asMember) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { name, email, birthDate, gender } = await request.json();
  if (!name || !email || !birthDate || !gender) {
    return NextResponse.json(
      { error: "모든 항목을 입력해 주세요." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const redirectTo = `${new URL(request.url).origin}/auth/set-password`;

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (inviteError || !invited.user) {
    const isDuplicate = inviteError?.code === "email_exists";
    return NextResponse.json(
      {
        error: isDuplicate
          ? "이미 등록된 이메일입니다."
          : (inviteError?.message ?? "초대에 실패했습니다."),
      },
      { status: isDuplicate ? 409 : 500 },
    );
  }

  // service_role로 insert하므로 members 테이블의 insert RLS 정책 여부와 무관하게 동작한다.
  // ponytail: 이 insert가 실패하면 auth 사용자만 초대된 채 members 행이 없는 상태로 남는다 -
  // 재시도/정리 로직은 실제로 발생할 때 추가.
  const { error: insertError } = await admin.from("members").insert({
    trainer_id: user.id,
    user_id: invited.user.id,
    name,
    birth_date: birthDate,
    gender,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
