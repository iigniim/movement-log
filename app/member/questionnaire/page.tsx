import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PARQ_QUESTIONS } from "@/lib/parq";
import { BirthDatePicker } from "./birth-date-picker";
import { submitQuestionnaire } from "./actions";

export default async function QuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">사전 문진표</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          운동을 시작하기 전 아래 항목에 정확히 답변해 주세요.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form action={submitQuestionnaire} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 인적사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BirthDatePicker />
            <div className="space-y-1.5">
              <Label htmlFor="gender">성별</Label>
              <select
                id="gender"
                name="gender"
                required
                defaultValue=""
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled>
                  선택
                </option>
                <option value="female">여성</option>
                <option value="male">남성</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PAR-Q (신체활동 준비도 설문)</CardTitle>
            <CardDescription>모든 문항에 예/아니오로 답해 주세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {PARQ_QUESTIONS.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-4 border-b border-border pb-5 last:border-0 last:pb-0"
              >
                <p className="text-sm text-foreground">
                  {q.id}. {q.text}
                </p>
                <RadioGroup
                  name={`parq_${q.id}`}
                  required
                  className="flex w-auto shrink-0 gap-4"
                >
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <RadioGroupItem value="yes" />예
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <RadioGroupItem value="no" />
                    아니오
                  </label>
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>병력 사항</CardTitle>
            <CardDescription>해당하는 내용이 있다면 구체적으로 작성해 주세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5 border-b border-border pb-5">
              <Label
                htmlFor="injury_history"
                className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                상해력
              </Label>
              <Textarea
                id="injury_history"
                name="injury_history"
                rows={2}
                placeholder="예: 무릎 인대 부상(2022년), 허리 디스크 등"
              />
            </div>
            <div className="space-y-1.5 border-b border-border pb-5">
              <Label
                htmlFor="surgery_history"
                className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                수술력
              </Label>
              <Textarea
                id="surgery_history"
                name="surgery_history"
                rows={2}
                placeholder="예: 무릎 반월판 수술(2021년) 등"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="chronic_condition"
                className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                기저질환
              </Label>
              <Textarea
                id="chronic_condition"
                name="chronic_condition"
                rows={2}
                placeholder="예: 고혈압, 당뇨, 천식 등"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">
          제출
        </Button>
      </form>
    </div>
  );
}
