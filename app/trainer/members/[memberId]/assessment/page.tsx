import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ASSESSMENT_ITEMS, ASSESSMENT_RESULTS } from "@/lib/assessment";
import type { Assessment, Member } from "@/lib/types";
import { RecommendButton } from "./recommend-button";
import { saveAssessmentResults } from "./actions";

export default async function MemberAssessmentPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle<Member>();
  if (!member) notFound();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Assessment>();

  const recommendedNames = assessment?.recommended_items?.items ?? [];
  const items = ASSESSMENT_ITEMS.filter((i) => recommendedNames.includes(i.name));

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {member.name ?? "회원"} - 신체 검사
          </h1>
          {assessment?.recommended_items?.reasoning && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              AI 추천: {assessment.recommended_items.reasoning}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/trainer/members/${memberId}/routines`} />}
        >
          지난 루틴 보기
        </Button>
      </div>

      {!assessment ? (
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              아직 추천된 검사 항목이 없습니다. 회원의 최신 문진표를 바탕으로
              AI에게 검사 항목을 추천받으세요.
            </p>
            <RecommendButton memberId={memberId} />
          </CardContent>
        </Card>
      ) : (
        <form
          action={saveAssessmentResults.bind(null, assessment.id, memberId)}
          className="space-y-6"
        >
          {items.map((item) => (
            <Card key={item.name}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="space-y-1 text-xs text-muted-foreground">
                  {ASSESSMENT_RESULTS.map((tier) => (
                    <div key={tier} className="flex gap-1.5">
                      <dt className="shrink-0 font-medium text-foreground">
                        {tier}:
                      </dt>
                      <dd>{item.tiers[tier]}</dd>
                    </div>
                  ))}
                </dl>

                <RadioGroup
                  name={`result_${item.name}`}
                  required
                  className="flex flex-wrap gap-4"
                >
                  {ASSESSMENT_RESULTS.map((tier) => (
                    <label
                      key={tier}
                      className="flex items-center gap-1.5 text-sm text-foreground"
                    >
                      <RadioGroupItem value={tier} />
                      {tier}
                    </label>
                  ))}
                </RadioGroup>

                <div className="space-y-1.5">
                  <Label htmlFor={`note_${item.name}`}>트레이너 메모 (선택)</Label>
                  <Textarea
                    id={`note_${item.name}`}
                    name={`note_${item.name}`}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="submit" size="lg" className="w-full">
            검사 결과 저장하고 카테고리 선택하기
          </Button>
        </form>
      )}
    </div>
  );
}
