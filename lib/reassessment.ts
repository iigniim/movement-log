import type { SupabaseClient } from "@supabase/supabase-js";

// 문진표 재제출이든 건강 상태 업데이트든, 몸 상태가 바뀌었을 가능성이 있는
// 시점에는 기존 활성 루틴을 전부 archived로 돌리고 재검사부터 다시 진행한다.
export async function archiveActiveRoutines(supabase: SupabaseClient, memberId: string) {
  await supabase
    .from("routines")
    .update({ status: "archived" })
    .eq("member_id", memberId)
    .eq("status", "active");
}
