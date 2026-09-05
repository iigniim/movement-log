import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exercise, RoutineItem, SessionLog, SessionLogItem } from "@/lib/types";

type SessionLogItemWithExercise = SessionLogItem & {
  exercise: Exercise | null;
  routine_item: (RoutineItem & { exercise: Exercise | null }) | null;
};

export type SessionHistoryItem = {
  id: string;
  exercise: Exercise | null;
  sets: number | null;
  reps: number | null;
  durationSeconds: number | null;
  weightKg: number | null;
  // session_log_items 자체에 스냅샷(exercise_id)이 없는 옛날 기록(스냅샷 저장
  // 이전에 완료된 수업)만 true - routine_items의 현재 상태를 참고용 fallback으로
  // 보여주고 있다는 뜻이라, 화면에서 정확하지 않을 수 있다는 안내가 필요하다.
  isStale: boolean;
};

export type SessionHistoryEntry = {
  log: SessionLog;
  items: SessionHistoryItem[];
};

function resolveSessionLogItemDisplay(item: SessionLogItemWithExercise): SessionHistoryItem {
  if (item.exercise_id != null) {
    return {
      id: item.id,
      exercise: item.exercise,
      sets: item.sets,
      reps: item.reps,
      durationSeconds: item.duration_seconds,
      weightKg: item.weight_kg,
      isStale: false,
    };
  }
  const routineItem = item.routine_item;
  return {
    id: item.id,
    exercise: routineItem?.exercise ?? null,
    sets: routineItem?.sets ?? null,
    reps: routineItem?.reps ?? null,
    durationSeconds: routineItem?.duration_seconds ?? null,
    weightKg: routineItem?.weight_kg ?? null,
    isStale: true,
  };
}

// 회원 복습 화면과 트레이너용 지난 수업 기록 화면이 공유하는 조회 로직.
// sets/reps/duration_seconds/weight_kg는 반드시 session_log_items 자체의
// 스냅샷 값을 쓴다 - routine_items를 다시 조인하면 나중에 그 운동이 수정될 때
// 과거 기록까지 조용히 바뀐 것처럼 보이는 버그가 재발한다.
export async function getSessionHistory(
  supabase: SupabaseClient,
  memberId: string,
  options?: { query?: string },
): Promise<SessionHistoryEntry[]> {
  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select("*")
    .eq("member_id", memberId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<SessionLog[]>();

  const sessionLogIds = (sessionLogs ?? []).map((s) => s.id);

  const { data: sessionLogItems } = sessionLogIds.length
    ? await supabase
        .from("session_log_items")
        .select(
          "*, exercise:exercise_library(*), routine_item:routine_items(*, exercise:exercise_library(*))",
        )
        .in("session_log_id", sessionLogIds)
        .returns<SessionLogItemWithExercise[]>()
    : { data: [] as SessionLogItemWithExercise[] };

  const itemsBySession = new Map<string, SessionHistoryItem[]>();
  for (const item of sessionLogItems ?? []) {
    const list = itemsBySession.get(item.session_log_id) ?? [];
    list.push(resolveSessionLogItemDisplay(item));
    itemsBySession.set(item.session_log_id, list);
  }

  const query = options?.query?.trim().toLowerCase() ?? "";
  const matchesQuery = (items: SessionHistoryItem[]) =>
    !query ||
    items.some(
      (item) =>
        item.exercise?.name_ko?.toLowerCase().includes(query) ||
        item.exercise?.name_en?.toLowerCase().includes(query),
    );

  return (sessionLogs ?? [])
    .map((log) => ({ log, items: itemsBySession.get(log.id) ?? [] }))
    .filter((entry) => matchesQuery(entry.items));
}
