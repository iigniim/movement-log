"use server";

import { createClient } from "@/lib/supabase/server";
import type { RoutineDraftItem } from "@/lib/routine-generate";

export async function confirmRoutine(payload: {
  memberId: string;
  assessmentId: string;
  categories: string[];
  finalItems: RoutineDraftItem[];
  aiSnapshot: { items: RoutineDraftItem[]; reasoning: string };
  bodyCompositionId?: string | null;
}): Promise<
  { ok: true; routineId: string; itemIds: string[] } | { ok: false; error: string }
> {
  const supabase = await createClient();

  // 회원당 여러 개의 active 루틴이 동시에 존재할 수 있다 (예: 하체 위주/상체
  // 위주를 번갈아 사용) - 기존 활성 루틴을 보관 처리하지 않고 그대로 둔 채
  // 새 루틴을 추가한다. 몸 상태 갱신에 따른 일괄 archived 처리는
  // 문진표 재제출 시점(submitQuestionnaire)에서 담당한다.
  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      member_id: payload.memberId,
      assessment_id: payload.assessmentId,
      body_composition_id: payload.bodyCompositionId ?? null,
      target_categories: payload.categories,
      status: "active",
      // AI가 처음 생성한 원본 그대로 - 트레이너가 이후에 수정한 내용은 여기 반영하지 않는다
      ai_snapshot: payload.aiSnapshot,
    })
    .select("id")
    .single();

  if (routineError || !routine) {
    return {
      ok: false,
      error: routineError?.message ?? "루틴 저장에 실패했습니다.",
    };
  }

  const rows = payload.finalItems.map((item, index) => ({
    routine_id: routine.id,
    exercise_id: item.exerciseId,
    sets: item.sets,
    reps: item.reps,
    duration_seconds: item.durationSeconds,
    caution_note: item.cautionNote,
    sort_order: index,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("routine_items")
    .insert(rows)
    .select("id");

  if (itemsError || !insertedItems) {
    return {
      ok: false,
      error: itemsError?.message ?? "루틴 항목 저장에 실패했습니다.",
    };
  }

  return { ok: true, routineId: routine.id, itemIds: insertedItems.map((r) => r.id) };
}
