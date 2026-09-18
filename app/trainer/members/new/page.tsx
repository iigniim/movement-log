import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberForUser } from "@/lib/auth";
import { InviteMemberForm } from "./invite-form";

export default async function NewMemberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getMemberForUser(supabase, user.id);
  if (member) redirect("/member");

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">새 회원 추가</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          가입 정보를 입력하면 회원에게 전달할 초대 링크가 발급됩니다.
        </p>
      </div>
      <InviteMemberForm />
    </div>
  );
}
