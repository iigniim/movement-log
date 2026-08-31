import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import type { Assessment, Exercise, Member, Routine, RoutineItem } from "@/lib/types";
import { SessionChecklist, type ChecklistItem } from "../session-checklist";

type RoutineItemWithExercise = RoutineItem & { exercise: Exercise | null };

export default async function MemberSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ error?: string; routineId?: string }>;
}) {
  const { memberId } = await params;
  const { error, routineId } = await searchParams;
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

  // routineId가 지정되면(활성 루틴이 여럿일 때 선택 화면에서 넘어온 경우) 그
  // 루틴을 그대로 쓰고, 없으면 활성 루틴이 하나뿐인 경우를 위해 최신 것을 찾는다.
  const { data: routine } = routineId
    ? await supabase
        .from("routines")
        .select("*")
        .eq("id", routineId)
        .eq("member_id", memberId)
        .maybeSingle<Routine>()
    : await supabase
        .from("routines")
        .select("*")
        .eq("member_id", memberId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<Routine>();

  const { data: items } = routine
    ? await supabase
        .from("routine_items")
        .select("*, exercise:exercise_library(*)")
        .eq("routine_id", routine.id)
        .order("sort_order")
        .returns<RoutineItemWithExercise[]>()
    : { data: [] as RoutineItemWithExercise[] };

  const checklistItems: ChecklistItem[] = (items ?? []).map((item) => ({
    id: item.id,
    exerciseId: item.exercise_id ?? "",
    exercise: item.exercise,
    sets: item.sets,
    reps: item.reps,
    durationSeconds: item.duration_seconds,
    cautionNote: item.caution_note,
  }));

  const { data: latestAssessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Assessment>();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {member.name ?? "회원"} - 오늘 수업
        </h1>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!routine ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              진행 중인 루틴이 없습니다. 먼저 검사와 루틴 생성을 완료해 주세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SessionChecklist
          memberId={memberId}
          routineId={routine.id}
          items={checklistItems}
          latestAssessmentId={latestAssessment?.id}
        />
      )}
    </div>
  );
}
