import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTINE_CATEGORIES } from "@/lib/assessment";
import { selectCategories } from "./actions";

export default async function SelectCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ assessmentId?: string; error?: string }>;
}) {
  const { memberId } = await params;
  const { assessmentId, error } = await searchParams;
  if (!assessmentId) redirect(`/trainer/members/${memberId}/assessment`);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          오늘 포커스할 카테고리
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          하나 이상 선택해 주세요. 선택한 카테고리 안에서만 운동을 추천합니다.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        action={selectCategories.bind(null, memberId, assessmentId)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>카테고리</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {ROUTINE_CATEGORIES.map((category) => (
              <label
                key={category}
                className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm text-foreground has-checked:border-ring has-checked:bg-accent"
              >
                <input
                  type="checkbox"
                  name="category"
                  value={category}
                  className="size-4 rounded border-input accent-primary"
                />
                {category}
              </label>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">
          다음: AI 루틴 생성
        </Button>
      </form>
    </div>
  );
}
