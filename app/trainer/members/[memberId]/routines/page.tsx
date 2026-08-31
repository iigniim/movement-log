import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Assessment, Exercise, Member, Routine, RoutineItem } from "@/lib/types";

type RoutineItemWithExercise = RoutineItem & { exercise: Exercise | null };
type RoutineWithItems = Routine & { items: RoutineItemWithExercise[] };

export default async function RoutinesPage({
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

  const { data: routines } = await supabase
    .from("routines")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .returns<Routine[]>();

  const routineIds = (routines ?? []).map((r) => r.id);
  const { data: items } = routineIds.length
    ? await supabase
        .from("routine_items")
        .select("*, exercise:exercise_library(*)")
        .in("routine_id", routineIds)
        .order("sort_order")
        .returns<RoutineItemWithExercise[]>()
    : { data: [] as RoutineItemWithExercise[] };

  const itemsByRoutine = new Map<string, RoutineItemWithExercise[]>();
  for (const item of items ?? []) {
    const list = itemsByRoutine.get(item.routine_id) ?? [];
    list.push(item);
    itemsByRoutine.set(item.routine_id, list);
  }

  const routinesWithItems: RoutineWithItems[] = (routines ?? []).map((r) => ({
    ...r,
    items: itemsByRoutine.get(r.id) ?? [],
  }));

  const activeRoutines = routinesWithItems.filter((r) => r.status === "active");
  const archivedRoutines = routinesWithItems.filter((r) => r.status === "archived");

  const { data: latestAssessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Assessment>();

  function restartHref(routine: Routine) {
    if (!routine.assessment_id) return null;
    const params = new URLSearchParams({
      assessmentId: routine.assessment_id,
      restartFrom: routine.id,
    });
    for (const category of routine.target_categories ?? []) {
      params.append("category", category);
    }
    return `/trainer/members/${memberId}/routine/new?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {member.name ?? "회원"} - 루틴 선택
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            오늘 어떤 루틴으로 진행할지 선택해 주세요.
          </p>
        </div>
        {latestAssessment && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={`/trainer/members/${memberId}/categories?assessmentId=${latestAssessment.id}`}
              />
            }
          >
            새 루틴 추가
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">활성 루틴</h2>
        {activeRoutines.length === 0 && (
          <Card className="px-4 py-6">
            <p className="text-sm text-muted-foreground">진행 중인 루틴이 없습니다.</p>
          </Card>
        )}
        {activeRoutines.map((routine) => (
          <Card key={routine.id} className="flex-row items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {(routine.target_categories ?? []).join(", ") || "카테고리 없음"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(routine.created_at).toLocaleDateString("ko-KR")} 생성 ·{" "}
                {routine.items
                  .map((i) => i.exercise?.name_ko ?? i.exercise?.name_en)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <Button
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/trainer/members/${memberId}/session?routineId=${routine.id}`} />
              }
            >
              이 루틴으로 진행
            </Button>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">지난 루틴</h2>
        {archivedRoutines.length === 0 && (
          <Card className="px-4 py-6">
            <p className="text-sm text-muted-foreground">지난 루틴이 없습니다.</p>
          </Card>
        )}
        {archivedRoutines.map((routine) => {
          const href = restartHref(routine);
          return (
            <Card key={routine.id} className="flex-row items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {(routine.target_categories ?? []).join(", ") || "카테고리 없음"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(routine.created_at).toLocaleDateString("ko-KR")} 생성 ·{" "}
                  {routine.items
                    .map((i) => i.exercise?.name_ko ?? i.exercise?.name_en)
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              {href && (
                <Button size="sm" nativeButton={false} render={<Link href={href} />}>
                  이 루틴으로 다시 시작
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
