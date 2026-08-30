import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/app/login/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Member, Questionnaire } from "@/lib/types";

const RISK_LABEL: Record<string, string> = {
  low: "낮음",
  mid: "중간",
  high: "높음",
};

export default async function TrainerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("trainer_id", user.id)
    .returns<Member[]>();

  const memberIds = (members ?? []).map((m) => m.id);

  const { data: questionnaires } = memberIds.length
    ? await supabase
        .from("questionnaires")
        .select("*")
        .in("member_id", memberIds)
        .eq("is_latest", true)
        .returns<Questionnaire[]>()
    : { data: [] as Questionnaire[] };

  const riskByMember = new Map(
    (questionnaires ?? []).map((q) => [q.member_id, q]),
  );

  // ponytail: 회원마다 admin API를 한 번씩 호출한다(N+1) - 담당 회원 수가 늘어나면
  // members에 status 컬럼을 두고 웹훅으로 갱신하는 방식으로 바꿀 것.
  const admin = createAdminClient();
  const joinedByMember = new Map<string, boolean>();
  await Promise.all(
    (members ?? []).map(async (m) => {
      if (!m.user_id) return;
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      joinedByMember.set(m.id, Boolean(data.user?.last_sign_in_at));
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">담당 회원</h1>
        <div className="flex items-center gap-2">
          <Button nativeButton={false} render={<Link href="/trainer/members/new" />}>
            새 회원 추가
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
        </div>
      </div>

      <div className="space-y-3">
        {(members ?? []).length === 0 && (
          <Card className="px-4 py-6">
            <p className="text-sm text-muted-foreground">담당 회원이 없습니다.</p>
          </Card>
        )}
        {(members ?? []).map((member) => {
          const questionnaire = riskByMember.get(member.id);
          const risk = questionnaire?.risk_level;
          const joined = joinedByMember.get(member.id);
          return (
            <Card
              key={member.id}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {member.name ?? "이름 없음"}
                </p>
                {risk === "high" && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    ⚠️ 의료진 상담 권장 대상입니다
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={joined ? "default" : "outline"}>
                  {joined ? "가입완료" : "초대됨"}
                </Badge>
                <Badge
                  variant={
                    risk === "high"
                      ? "destructive"
                      : risk === "mid"
                        ? "secondary"
                        : risk === "low"
                          ? "default"
                          : "outline"
                  }
                >
                  {risk ? RISK_LABEL[risk] : "문진표 없음"}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
