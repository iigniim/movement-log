"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CompleteSessionItem = {
  exerciseId: string;
  sets: number | null;
  reps: number | null;
  durationSeconds: number | null;
  weightKg: number | null;
  cautionNote: string | null;
  checked: boolean;
};

type ActionResult = { ok: true } | { ok: false; error: string };

// 수업 완료 시 원본 루틴(과 그 routine_items)은 절대 건드리지 않는다. 대신
// 오늘 실제로 체크된 운동들로 새 active 루틴을 하나 만들어 그 결과를 기록한다 -
// 원본 루틴은 다음에 다시 쓸 수 있는 "베이스"로 그대로 남아있어야 하기 때문이다.
export async function completeSession(
  memberId: string,
  routineId: string,
  payload: { items: CompleteSessionItem[]; freeMemo: string | null },
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: originalRoutine, error: routineFetchError } = await supabase
    .from("routines")
    .select("member_id, assessment_id, body_composition_id")
    .eq("id", routineId)
    .single();

  if (routineFetchError || !originalRoutine) {
    return {
      ok: false,
      error: routineFetchError?.message ?? "원본 루틴을 찾을 수 없습니다.",
    };
  }

  const checkedItems = payload.items.filter((item) => item.checked);

  // target_categories는 원본 루틴 것을 그대로 복사하지 않고, 실제로 이번에
  // 포함되는 운동들의 카테고리 중 가장 많이 등장한 것(다수결)으로 다시 계산한다 -
  // 편집 중 카테고리를 벗어난 운동으로 바꿔도 새 루틴의 이름·카테고리 표시가
  // 실제 구성과 어긋나지 않게. 최다 개수가 여러 카테고리에 걸쳐 동점이면 그
  // 카테고리들을 전부 담는다.
  const checkedExerciseIds = [...new Set(checkedItems.map((item) => item.exerciseId))];
  const { data: exercises } = checkedExerciseIds.length
    ? await supabase
        .from("exercise_library")
        .select("id, category")
        .in("id", checkedExerciseIds)
    : { data: [] as { id: string; category: string | null }[] };

  const categoryByExerciseId = new Map((exercises ?? []).map((e) => [e.id, e.category]));
  const categoryCounts = new Map<string, number>();
  for (const item of checkedItems) {
    const category = categoryByExerciseId.get(item.exerciseId);
    if (!category) continue;
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  const maxCount = Math.max(0, ...categoryCounts.values());
  const targetCategories = [...categoryCounts.entries()]
    .filter(([, count]) => count === maxCount)
    .map(([category]) => category);

  const { data: newRoutine, error: newRoutineError } = await supabase
    .from("routines")
    .insert({
      member_id: originalRoutine.member_id,
      assessment_id: originalRoutine.assessment_id,
      body_composition_id: originalRoutine.body_composition_id,
      target_categories: targetCategories,
      status: "active",
      is_pinned: false,
      name: null,
    })
    .select("id")
    .single();

  if (newRoutineError || !newRoutine) {
    return { ok: false, error: newRoutineError?.message ?? "루틴 생성에 실패했습니다." };
  }

  // 오늘 체크리스트의 기반이 된 그 루틴 하나만 archived 처리한다 - routineId로
  // 정확히 찍어서, 회원이 별도로 갖고 있는 다른 active 루틴은 건드리지 않는다.
  await supabase.from("routines").update({ status: "archived" }).eq("id", routineId);

  const rows = checkedItems.map((item, index) => ({
    routine_id: newRoutine.id,
    exercise_id: item.exerciseId,
    sets: item.sets,
    reps: item.reps,
    duration_seconds: item.durationSeconds,
    weight_kg: item.weightKg,
    caution_note: item.cautionNote,
    sort_order: index,
  }));

  const { data: insertedItems, error: itemsError } = rows.length
    ? await supabase.from("routine_items").insert(rows).select("id")
    : { data: [] as { id: string }[], error: null };

  if (itemsError) {
    return { ok: false, error: itemsError.message };
  }

  const { data: sessionLog, error: sessionLogError } = await supabase
    .from("session_logs")
    .insert({ member_id: memberId, routine_id: newRoutine.id, free_memo: payload.freeMemo })
    .select("id")
    .single();

  if (sessionLogError || !sessionLog) {
    return {
      ok: false,
      error: sessionLogError?.message ?? "수업 기록 저장에 실패했습니다.",
    };
  }

  if (checkedItems.length) {
    // routine_item_id는 방금 만든 새 routine_items를 참고용으로 가리키고,
    // sets/reps/duration_seconds/weight_kg는 그 값이 나중에 바뀌어도 이 기록엔
    // 영향이 없도록 스냅샷으로 별도 저장한다.
    await supabase.from("session_log_items").insert(
      checkedItems.map((item, index) => ({
        session_log_id: sessionLog.id,
        routine_item_id: insertedItems?.[index]?.id ?? null,
        checked: true,
        exercise_id: item.exerciseId,
        sets: item.sets,
        reps: item.reps,
        duration_seconds: item.durationSeconds,
        weight_kg: item.weightKg,
      })),
    );
  }

  // 새 루틴이 /trainer, /trainer/members/[memberId]/routines에 바로 보여야 한다.
  revalidatePath(`/trainer/members/${memberId}/routines`);
  revalidatePath("/trainer");
  redirect(`/trainer/members/${memberId}/routines?sessionCompleted=1`);
}
