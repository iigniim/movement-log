"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Exercise, RoutineItem } from "@/lib/types";

type RoutineItemWithExercise = RoutineItem & { exercise: Exercise | null };
type ActionResult<T> = { ok: true } & T | { ok: false; error: string };

// 진행 중인 active 루틴의 routine_items를 즉시 수정한다 - 확정 전 초안 상태가
// 아니라, 이 루틴을 다음에 또 쓸 때도 남아있어야 하는 실제 변경이다.

export async function addRoutineItem(
  routineId: string,
  payload: {
    exerciseId: string;
    sets: number;
    reps: number | null;
    durationSeconds: number | null;
    cautionNote: string;
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
      sort_order: count ?? 0,
    })
    .select("*, exercise:exercise_library(*)")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "운동 추가에 실패했습니다." };
  }
  return { ok: true, item: data };
}

export async function updateRoutineItem(
  routineItemId: string,
  patch: Partial<{
    exerciseId: string;
    sets: number;
    reps: number | null;
    durationSeconds: number | null;
    cautionNote: string;
  }>,
): Promise<ActionResult<{ item: RoutineItemWithExercise }>> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (patch.exerciseId !== undefined) updates.exercise_id = patch.exerciseId;
  if (patch.sets !== undefined) updates.sets = patch.sets;
  if (patch.reps !== undefined) updates.reps = patch.reps;
  if (patch.durationSeconds !== undefined) updates.duration_seconds = patch.durationSeconds;
  if (patch.cautionNote !== undefined) updates.caution_note = patch.cautionNote;

  const { data, error } = await supabase
    .from("routine_items")
    .update(updates)
    .eq("id", routineItemId)
    .select("*, exercise:exercise_library(*)")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "수정에 실패했습니다." };
  }
  return { ok: true, item: data };
}

export async function deleteRoutineItem(
  routineItemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("routine_items").delete().eq("id", routineItemId);
  if (error) return { ok: false, error: error.message };
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
    await supabase.from("session_log_items").insert(
      checkedRoutineItemIds.map((routineItemId) => ({
        session_log_id: sessionLog.id,
        routine_item_id: routineItemId,
        checked: true,
      })),
    );
  }

  redirect("/trainer");
}
