"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Exercise, RoutineItem } from "@/lib/types";

type RoutineItemWithExercise = RoutineItem & { exercise: Exercise | null };
type ActionResult<T> = { ok: true } & T | { ok: false; error: string };

// 진행 중인 active 루틴의 routine_items를 즉시 수정한다 - 확정 전 초안 상태가
// 아니라, 이 루틴을 다음에 또 쓸 때도 남아있어야 하는 실제 변경이다.

function revalidateRoutineViews(memberId: string) {
  revalidatePath(`/trainer/members/${memberId}/session`);
  revalidatePath(`/trainer/members/${memberId}/routines`);
}

export async function addRoutineItem(
  memberId: string,
  routineId: string,
  payload: {
    exerciseId: string;
    sets: number;
    reps: number | null;
    durationSeconds: number | null;
    cautionNote: string;
    weightKg: number | null;
  },
): Promise<ActionResult<{ item: RoutineItemWithExercise }>> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("routine_items")
    .select("id", { count: "exact", head: true })
    .eq("routine_id", routineId);

  const { data, error } = await supabase
    .from("routine_items")
    .insert({
      routine_id: routineId,
      exercise_id: payload.exerciseId,
      sets: payload.sets,
      reps: payload.reps,
      duration_seconds: payload.durationSeconds,
      caution_note: payload.cautionNote,
      weight_kg: payload.weightKg,
      sort_order: count ?? 0,
    })
    .select("*, exercise:exercise_library(*)")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "운동 추가에 실패했습니다." };
  }
  revalidateRoutineViews(memberId);
  return { ok: true, item: data };
}

export async function updateRoutineItem(
  memberId: string,
  routineItemId: string,
  patch: Partial<{
    exerciseId: string;
    sets: number;
    reps: number | null;
    durationSeconds: number | null;
    cautionNote: string;
    weightKg: number | null;
  }>,
): Promise<ActionResult<{ item: RoutineItemWithExercise }>> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (patch.exerciseId !== undefined) updates.exercise_id = patch.exerciseId;
  if (patch.sets !== undefined) updates.sets = patch.sets;
  if (patch.reps !== undefined) updates.reps = patch.reps;
  if (patch.durationSeconds !== undefined) updates.duration_seconds = patch.durationSeconds;
  if (patch.cautionNote !== undefined) updates.caution_note = patch.cautionNote;
  if (patch.weightKg !== undefined) updates.weight_kg = patch.weightKg;

  const { data, error } = await supabase
    .from("routine_items")
    .update(updates)
    .eq("id", routineItemId)
    .select("*, exercise:exercise_library(*)")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "수정에 실패했습니다." };
  }
  revalidateRoutineViews(memberId);
  return { ok: true, item: data };
}

export async function deleteRoutineItem(
  memberId: string,
  routineItemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("routine_items").delete().eq("id", routineItemId);
  if (error) return { ok: false, error: error.message };
  revalidateRoutineViews(memberId);
  return { ok: true };
}

export async function completeSession(
  memberId: string,
  routineId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const freeMemo = String(formData.get("free_memo") ?? "").trim() || null;

  const { data: sessionLog, error: insertError } = await supabase
    .from("session_logs")
    .insert({ member_id: memberId, routine_id: routineId, free_memo: freeMemo })
    .select("id")
    .single();

  if (insertError || !sessionLog) {
    redirect(
      `/trainer/members/${memberId}/session?error=${encodeURIComponent(insertError?.message ?? "저장에 실패했습니다.")}`,
    );
  }

  const checkedRoutineItemIds = Array.from(formData.keys())
    .filter((key) => key.startsWith("item_"))
    .map((key) => key.slice("item_".length));

  if (checkedRoutineItemIds.length) {
    // routine_items는 이후 트레이너가 자유롭게 수정하는 "현재 상태"이므로,
    // 여기서 그 시점의 exercise_id/sets/reps/duration_seconds/weight_kg 값을
    // session_log_items에 스냅샷으로 복사해 둔다 - 그렇지 않으면 나중에 routine_item이
    // 바뀔 때 과거 기록까지 조용히 덮어써진 것처럼 보인다.
    const { data: routineItems } = await supabase
      .from("routine_items")
      .select("id, exercise_id, sets, reps, duration_seconds, weight_kg")
      .in("id", checkedRoutineItemIds);

    const routineItemById = new Map((routineItems ?? []).map((r) => [r.id, r]));

    await supabase.from("session_log_items").insert(
      checkedRoutineItemIds.map((routineItemId) => {
        const snapshot = routineItemById.get(routineItemId);
        return {
          session_log_id: sessionLog.id,
          routine_item_id: routineItemId,
          checked: true,
          exercise_id: snapshot?.exercise_id ?? null,
          sets: snapshot?.sets ?? null,
          reps: snapshot?.reps ?? null,
          duration_seconds: snapshot?.duration_seconds ?? null,
          weight_kg: snapshot?.weight_kg ?? null,
        };
      }),
    );
  }

  // 체크하지 않은 운동은 이 루틴에서 완전히 제거한다 - 과거 기록은 이미
  // session_log_items에 스냅샷으로 남아있어 routine_item에 더 이상 의존하지
  // 않으므로 안전하다. 다만 그 routine_item을 가리키던 session_log_items 행이
  // 남아있으면 외래키(NO ACTION)에 걸려 delete가 실패하니, 참조만 먼저 끊는다.
  const { data: allRoutineItems } = await supabase
    .from("routine_items")
    .select("id")
    .eq("routine_id", routineId);

  const uncheckedRoutineItemIds = (allRoutineItems ?? [])
    .map((r) => r.id)
    .filter((id) => !checkedRoutineItemIds.includes(id));

  if (uncheckedRoutineItemIds.length) {
    await supabase
      .from("session_log_items")
      .update({ routine_item_id: null })
      .in("routine_item_id", uncheckedRoutineItemIds);

    await supabase.from("routine_items").delete().in("id", uncheckedRoutineItemIds);
  }

  // 마지막 진행 시각이 /trainer, /trainer/members/[memberId]/routines에도
  // 나오므로, redirect 대상인 /trainer 외에 그 페이지들도 캐시를 무효화한다.
  revalidatePath(`/trainer/members/${memberId}/routines`);
  revalidatePath("/trainer");
  redirect("/trainer?sessionCompleted=1");
}
