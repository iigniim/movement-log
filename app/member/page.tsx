import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMemberForUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Questionnaire } from "@/lib/types";

const RISK_LABEL: Record<string, string> = {
  low: "낮음",
  mid: "중간",
  high: "높음",
};

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getMemberForUser(supabase, user.id);
  if (!member) redirect("/trainer");

  const { data: questionnaire } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("member_id", member.id)
    .eq("is_latest", true)
    .maybeSingle<Questionnaire>();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          안녕하세요, {member.name ?? "회원"}님
        </h1>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </div>

      {questionnaire?.risk_level === "high" && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          ⚠️ 의료진 상담을 권장드립니다. 운동 시작 전 담당 트레이너와 상담해
          주세요.
        </div>
      )}

      <Card>
        <CardContent className="space-y-3">
          {questionnaire ? (
            <p className="text-sm text-muted-foreground">
              최근 문진표 위험도:{" "}
              <Badge
                variant={
                  questionnaire.risk_level === "high"
                    ? "destructive"
                    : questionnaire.risk_level === "mid"
                      ? "secondary"
                      : "default"
                }
              >
                {questionnaire.risk_level
                  ? RISK_LABEL[questionnaire.risk_level]
                  : "분석 중"}
              </Badge>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 제출한 문진표가 없습니다.
            </p>
          )}
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/member/questionnaire" />}
          >
            {questionnaire ? "문진표 다시 작성하기" : "문진표 작성하기"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
