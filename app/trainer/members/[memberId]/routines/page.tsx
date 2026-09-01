import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatRoutineName } from "@/lib/format";
import type { Assessment, Exercise, Member, Routine, RoutineItem } from "@/lib/types";
import { toggleRoutinePin } from "./actions";
import { RoutineNameEditor } from "./routine-name-editor";

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
    .eq("status", "active")
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

  const { data: sessionLogs } = routineIds.length
    ? await supabase
        .from("session_logs")
        .select("routine_id, created_at")
        .in("routine_id", routineIds)
        .returns<{ routine_id: string | null; created_at: string }[]>()
    : { data: [] as { routine_id: string | null; created_at: string }[] };

  const lastProgressedByRoutine = new Map<string, string>();
  for (const log of sessionLogs ?? []) {
    if (!log.routine_id) continue;
    const current = lastProgressedByRoutine.get(log.routine_id);
    if (!current || log.created_at > current) {
      lastProgressedByRoutine.set(log.routine_id, log.created_at);
    }
  }

  const routinesWithItems: RoutineWithItems[] = (routines ?? []).map((r) => ({
    ...r,
    items: itemsByRoutine.get(r.id) ?? [],
  }));

  routinesWithItems.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    const aLast = lastProgressedByRoutine.get(a.id);
    const bLast = lastProgressedByRoutine.get(b.id);
    if (aLast && bLast) return aLast > bLast ? -1 : aLast < bLast ? 1 : 0;
    if (aLast && !bLast) return -1;
    if (!aLast && bLast) return 1;
    return b.created_at.localeCompare(a.created_at);
  });

  const { data: latestAssessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Assessment>();

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
        {routinesWithItems.length === 0 && (
          <Card className="px-4 py-6">
            <p className="text-sm text-muted-foreground">진행 중인 루틴이 없습니다.</p>
          </Card>
        )}
        {routinesWithItems.map((routine) => {
          const lastProgressedAt = lastProgressedByRoutine.get(routine.id);
          return (
            <Card key={routine.id} className="flex-row items-center justify-between px-4 py-4">
              <div>
                <div className="flex items-center gap-1">
                  {routine.is_pinned && <span>📌</span>}
                  <RoutineNameEditor
                    memberId={memberId}
                    routineId={routine.id}
                    displayName={formatRoutineName(routine)}
                    rawName={routine.name}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(routine.created_at).toLocaleDateString("ko-KR")} 생성 ·{" "}
                  {routine.items
                    .map((i) => i.exercise?.name_ko ?? i.exercise?.name_en)
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  마지막 진행:{" "}
                  {lastProgressedAt ? formatDateTime(lastProgressedAt) : "아직 진행 안 함"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Button
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link href={`/trainer/members/${memberId}/session?routineId=${routine.id}`} />
                  }
                >
                  이 루틴으로 진행
                </Button>
                <form
                  action={toggleRoutinePin.bind(null, memberId, routine.id, !routine.is_pinned)}
                >
                  <Button type="submit" variant="ghost" size="sm">
                    {routine.is_pinned ? "고정 해제" : "상단 고정"}
                  </Button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
